import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
    computeControlEffectiveness,
    computeObligationExposure,
    computeConcentrationHHI,
    computeFinalScore,
    computeStableHash,
    deriveOperationFromRuns,
    deriveRecencyFromDays,
    TestOutcome,
    applyAuditExposureFloor,
    computeReadinessScore
} from '@/lib/engine-v3';

export async function POST(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id: evaluationId } = params;

        // 1. GATHER DATA
        const evaluation = await prisma.corpusEvaluation.findUnique({
            where: { id: evaluationId },
            include: {
                assessment: true,
                controlStates: {
                    include: { control: true }
                },
                testRuns: true,
                scopes: true
            }
        });

        if (!evaluation) return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
        if (evaluation.statusId === 2) return NextResponse.json({ error: 'Evaluation is already locked' }, { status: 400 });

        // Fetch Active Supervisor Profile (Capa 2) for parameters
        const supervisorProfile = await (prisma as any).corpusSuperintendence.findFirst({
            where: {
                companyId: evaluation.assessment.companyId,
                isActive: true
            }
        });

        // Fetch active Parameter Set for weights
        const parameterSet = await (prisma as any).corpusParameterSet.findFirst({
            where: { statusId: 2 }, // Assume 2 is 'Active/Locked' for ParameterSets or similar
            include: { values: true, weights: true }
        });

        if (!parameterSet) return NextResponse.json({ error: 'No active parameter set' }, { status: 400 });

        const gamma = supervisorProfile?.gamma ? parseFloat(supervisorProfile.gamma.toString()) :
            parseFloat(parameterSet?.values.find((v: any) => v.key === 'gamma')?.value.toString() || '4.0');

        const alpha = supervisorProfile?.alpha ? parseFloat(supervisorProfile.alpha.toString()) :
            parseFloat(parameterSet?.values.find((v: any) => v.key === 'alpha')?.value.toString() || '0.3');

        // 2. FETCH AUDIT FINDINGS
        const findings = await prisma.corpusAuditFinding.findMany({
            where: { evaluationId, status: 'open' }
        });

        // 3. CALCULATE ENGINE RESULTS
        const runResults: any = {
            controls: [],
            obligations: [],
            scores: []
        };

        // Group controls by obligation using prisma
        const controlObligationMap = await prisma.corpusControlObligation.findMany();

        // Loop through obligations in scope
        const obligationsInScope = await prisma.corpusObligation.findMany({
            include: { domain: true }
        });

        let totalExposure = 0;
        const domainExposures: Record<string, number> = {};

        for (const obl of obligationsInScope) {
            const relatedControlIds = controlObligationMap
                .filter((m: any) => m.obligationId === obl.id)
                .map((m: any) => m.controlId);

            const relatedStates = evaluation.controlStates.filter((s: any) => relatedControlIds.includes(s.controlId));

            let maxMitigation = 0;
            for (const state of relatedStates) {
                const C = computeControlEffectiveness({
                    design: 1.0,
                    formalization: parseFloat(state.formalizationEffectiveness?.toString() || '0'),
                    operation: 0.4,
                    coverage: parseFloat(state.coverageEffectiveness?.toString() || '0'),
                    recency: parseFloat(state.recencyEffectiveness?.toString() || '0'),
                    evidenceValidated: state.evidenceValidated,
                    applicable: state.applicability === 'applicable'
                }) || 0;

                const sj = C * parseFloat(state.control.inherentMitigationStrength.toString());
                if (sj > maxMitigation) maxMitigation = sj;

                runResults.controls.push({ controlId: state.controlId, score: C });
            }

            const weight = parseFloat(parameterSet.weights.find((w: any) => w.obligationId === obl.id)?.weight.toString() || '1.0');
            const Ei = computeObligationExposure(weight, maxMitigation);

            runResults.obligations.push({ obligationId: obl.id, score: Ei });
            totalExposure += Ei;

            if (obl.domainId) {
                domainExposures[obl.domainId] = (domainExposures[obl.domainId] || 0) + Ei;
            }
        }

        // Concentration
        const H = computeConcentrationHHI(Object.values(domainExposures));
        const E_conc = totalExposure * (1 + alpha * H);

        // --- AUDIT INTEGRATION ---
        const { eFinal: E_final, gatilloMax } = applyAuditExposureFloor(E_conc, findings as any);
        const readinessScore = computeReadinessScore(findings as any);

        // Final Score
        const finalScore = computeFinalScore(E_final, gamma);

        runResults.scores.push({
            scoreValue: finalScore,
            readinessScore: readinessScore,
            eBase: totalExposure,
            eConc: E_conc,
            eSys: E_conc, // Simplify for now
            eFinal: E_final,
            gatilloMax: gatilloMax
        });

        // 3. GENERATE STABLE HASHES
        const inputSnapshot = {
            evaluationId,
            states: evaluation.controlStates,
            parameterSetId: parameterSet.id
        };
        const inputHash = computeStableHash(inputSnapshot);
        const outputHash = computeStableHash(runResults);

        // 4. TRANSACTION: CREATE RUN + LOCK EVALUATION
        const modelRun = await (prisma as any).$transaction(async (tx: any) => {
            // Create Model Run
            const run = await tx.corpusModelRun.create({
                data: {
                    tenantId: evaluation.tenantId,
                    assessmentId: evaluation.assessmentId,
                    evaluationId: evaluation.id,
                    parameterSetId: parameterSet.id,
                    frameworkVersionId: evaluation.frameworkVersionId,
                    engineVersion: '3.0-V3',
                    runStatus: 'completed',
                    inputHash,
                    outputHash,
                    endedAt: new Date()
                }
            });

            // Bulk create children (Note: Prisma doesn't have bulk create for all relations easily without multiple calls)
            await tx.corpusModelRunScore.createMany({
                data: runResults.scores.map((s: any) => ({ ...s, modelRunId: run.id }))
            });
            await tx.corpusModelRunControl.createMany({
                data: runResults.controls.map((c: any) => ({ ...c, modelRunId: run.id }))
            });
            await tx.corpusModelRunObligation.createMany({
                data: runResults.obligations.map((o: any) => ({ ...o, modelRunId: run.id }))
            });

            // Lock Evaluation
            await tx.corpusEvaluation.update({
                where: { id: evaluationId },
                data: { statusId: 2 } // Frozen
            });

            return run;
        });

        return NextResponse.json({ success: true, runId: modelRun.id, score: finalScore });
    } catch (error: any) {
        console.error('Error running ScoreV3 engine:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
