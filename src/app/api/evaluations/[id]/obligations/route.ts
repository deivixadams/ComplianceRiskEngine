import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 1. Get evaluation to know the framework version
        const evaluation = await prisma.corpusEvaluation.findUnique({
            where: { id },
            include: { assessment: { select: { frameworkVersionId: true } } }
        });

        if (!evaluation) return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });

        const frameworkVersionId = (evaluation as any).assessment?.frameworkVersionId as string | undefined;

        const obligations = await prisma.$queryRaw(Prisma.sql`
            SELECT
              de.id,
              de.code,
              COALESCE(de.title, de.name, de.code) AS title,
              de.statement,
              de.criticality_id AS "criticalityId",
              mde.domain_id AS "domainId",
              d.name AS "domainName"
            FROM graph.domain_elements de
            LEFT JOIN graph.map_domain_element mde
              ON mde.element_id = de.id
            LEFT JOIN graph.domain d
              ON d.id = mde.domain_id
            WHERE de.element_type = 'OBLIGATION'
              ${frameworkVersionId ? Prisma.sql`AND d.framework_version_id = ${frameworkVersionId}::uuid` : Prisma.empty}
            ORDER BY de.code
        `) as Array<{
            id: string;
            code: string;
            title: string;
            statement: string | null;
            criticalityId: number | null;
            domainId: string | null;
            domainName: string | null;
        }>;

        const obligationIds = obligations.map((o) => o.id);

        const controls = obligationIds.length > 0
            ? await prisma.$queryRaw(Prisma.sql`
                SELECT
                  moc.element_id AS "obligationId",
                  c.id AS "controlId",
                  c.code,
                  c.name,
                  c.description,
                  c.automation_id AS "automationId"
                FROM graph.map_domain_elements_control moc
                JOIN graph.control c
                  ON c.id = moc.control_id
                WHERE moc.element_id IN (${Prisma.join(obligationIds.map((oid) => Prisma.sql`${oid}::uuid`))})
                ORDER BY c.code
            `) as Array<{
                obligationId: string;
                controlId: string;
                code: string;
                name: string;
                description: string | null;
                automationId: number | null;
            }>
            : [];

        const controlIds = Array.from(new Set(controls.map((c) => c.controlId)));
        const evalStates = controlIds.length > 0
            ? await prisma.$queryRaw(Prisma.sql`
                SELECT
                  control_id AS "controlId",
                  design_effectiveness AS "designEffectiveness",
                  operating_effectiveness AS "operatingEffectiveness"
                FROM "_DONOTUSE_".corpus_evaluation_control_state
                WHERE evaluation_id = ${id}::uuid
                  AND control_id IN (${Prisma.join(controlIds.map((cid) => Prisma.sql`${cid}::uuid`))})
            `) as Array<{
                controlId: string;
                designEffectiveness: Prisma.Decimal | number | null;
                operatingEffectiveness: Prisma.Decimal | number | null;
            }>
            : [];

        const stateByControl = new Map<string, any>(
            evalStates.map((s) => [s.controlId, {
                formalizationEffectiveness: s.designEffectiveness === null ? 0 : Number(s.designEffectiveness),
                coverageEffectiveness: s.operatingEffectiveness === null ? 0 : Number(s.operatingEffectiveness),
                recencyEffectiveness: 0,
                evidenceValidated: false,
                applicability: 'applicable'
            }])
        );

        const controlsByObligation = new Map<string, any[]>();
        for (const row of controls) {
            const list = controlsByObligation.get(row.obligationId) ?? [];
            list.push({
                control: {
                    id: row.controlId,
                    code: row.code,
                    name: row.name,
                    description: row.description,
                    automationId: row.automationId,
                    inherentMitigationStrength: null,
                    evaluationStates: stateByControl.has(row.controlId) ? [stateByControl.get(row.controlId)] : []
                }
            });
            controlsByObligation.set(row.obligationId, list);
        }

        const payload = obligations.map((o) => ({
            id: o.id,
            code: o.code,
            title: o.title,
            statement: o.statement,
            criticalityId: o.criticalityId,
            domainId: o.domainId,
            domain: o.domainId ? { id: o.domainId, name: o.domainName } : null,
            controls: controlsByObligation.get(o.id) ?? []
        }));

        return NextResponse.json(payload);
    } catch (error: any) {
        console.error('Error fetching obligations:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
