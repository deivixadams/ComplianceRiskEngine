import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

function toNumber(value: Prisma.Decimal | number | null | undefined) {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  return Number(value);
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items));
}

export async function POST(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const body = await request.json();
    const {
      companyId,
      frameworkSourceId,
      periodStart,
      periodEnd,
      mode,
      draftId,
    } = body || {};

    if (!companyId || !periodStart || !periodEnd || !mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let frameworkVersionId = null as string | null;
    if (frameworkSourceId) {
      const source = await prisma.framework_source.findUnique({
        where: { id: frameworkSourceId },
        select: { framework_version_id: true },
      });
      frameworkVersionId = source?.framework_version_id || null;
    }

    if (!frameworkVersionId) {
      return NextResponse.json({ error: 'framework_source_id invalido o sin version asociada' }, { status: 400 });
    }

    if (mode === 'top20') {
      const viewObligations = await prisma.$queryRaw(Prisma.sql`
        SELECT DISTINCT obligation_id, obligation_code, obligation_title
        FROM corpus._score_v_cre_structural_controls_explain_v1
      `);

      const viewRisks = await prisma.$queryRaw(Prisma.sql`
        SELECT DISTINCT v.risk_id, v.risk_code, v.risk_title, r.description
        FROM corpus._score_v_cre_structural_controls_explain_v1 v
        LEFT JOIN graph.risk r ON r.id = v.risk_id
      `);

      const viewControls = await prisma.$queryRaw(Prisma.sql`
        SELECT DISTINCT v.control_id, v.control_code, c.name, c.description
        FROM corpus._score_v_cre_structural_controls_explain_v1 v
        LEFT JOIN graph.control c ON c.id = v.control_id
      `);

      const viewPayload = {
        obligations: (viewObligations as any[]).map((o, idx) => ({
          id: o.obligation_id,
          code: o.obligation_code,
          title: o.obligation_title,
          score: 0,
          rank: idx + 1,
          reasons: ['structural_view'],
        })),
        risks: (viewRisks as any[]).map((r, idx) => ({
          id: r.risk_id,
          code: r.risk_code,
          name: r.risk_title,
          description: r.description,
          score: 0,
          rank: idx + 1,
          reasons: ['structural_view'],
        })),
        controls: (viewControls as any[]).map((c, idx) => ({
          id: c.control_id,
          code: c.control_code,
          name: c.name,
          description: c.description,
          score: 0,
          rank: idx + 1,
          reasons: ['structural_view'],
        })),
        tests: [] as any[],
      };

      if (
        viewPayload.obligations.length ||
        viewPayload.risks.length ||
        viewPayload.controls.length
      ) {
        const run = await prisma.$transaction(async (tx) => {
          const runDraft = draftId
            ? await tx.run_draft.update({
                where: { id: draftId },
                data: {
                  company_id: companyId,
                  framework_version_id: frameworkVersionId,
                  period_start: new Date(periodStart),
                  period_end: new Date(periodEnd),
                  mode,
                  updated_at: new Date(),
                },
              })
            : await tx.run_draft.create({
                data: {
                  company_id: companyId,
                  framework_version_id: frameworkVersionId,
                  period_start: new Date(periodStart),
                  period_end: new Date(periodEnd),
                  mode,
                },
              });

          await Promise.all([
            tx.run_obligation_draft.deleteMany({ where: { run_id: runDraft.id } }),
            tx.run_risk_draft.deleteMany({ where: { run_id: runDraft.id } }),
            tx.run_control_draft.deleteMany({ where: { run_id: runDraft.id } }),
            tx.run_test_draft.deleteMany({ where: { run_id: runDraft.id } }),
          ]);

          if (viewPayload.obligations.length) {
            await tx.run_obligation_draft.createMany({
              data: viewPayload.obligations.map((o) => ({
                run_id: runDraft.id,
                obligation_id: o.id,
                score: o.score,
                rank: o.rank,
                reasons: o.reasons,
              })),
            });
          }
          if (viewPayload.risks.length) {
            await tx.run_risk_draft.createMany({
              data: viewPayload.risks.map((r) => ({
                run_id: runDraft.id,
                risk_id: r.id,
                score: r.score,
                rank: r.rank,
                reasons: r.reasons,
              })),
            });
          }
          if (viewPayload.controls.length) {
            await tx.run_control_draft.createMany({
              data: viewPayload.controls.map((c) => ({
                run_id: runDraft.id,
                control_id: c.id,
                score: c.score,
                rank: c.rank,
                reasons: c.reasons,
              })),
            });
          }

          return runDraft;
        });

        return NextResponse.json({
          draftId: run.id,
          selection: viewPayload,
        });
      }
    }

    const obligations = (await prisma.$queryRaw(Prisma.sql`
      SELECT
        de.id,
        de.code,
        COALESCE(de.title, de.name, de.code) AS title,
        mde.domain_id,
        COALESCE(de.criticality, 3)::int AS criticality,
        COALESCE(de.evidence_strength, 3)::int AS evidence_strength,
        COALESCE(de.is_hard_gate, false) AS is_hard_gate
      FROM graph.domain_elements de
      JOIN graph.map_domain_element mde
        ON mde.element_id = de.id
      JOIN graph.domain d
        ON d.id = mde.domain_id
      WHERE de.element_type = 'OBLIGATION'
        AND COALESCE(de.obligation_status, 'active') = 'active'
        AND d.framework_version_id = ${frameworkVersionId}::uuid
      ORDER BY de.code
    `)) as Array<{
      id: string;
      code: string;
      title: string;
      domain_id: string;
      criticality: number;
      evidence_strength: number;
      is_hard_gate: boolean;
    }>;

    const obligationIds = obligations.map((o) => o.id);
    const obligationCodes = obligations.map((o) => o.code);

    const [obligationRisks, obligationControls, obligationGraph] = await Promise.all([
      obligationIds.length > 0
        ? prisma.$queryRaw(Prisma.sql`
            SELECT element_id AS obligation_id, risk_id, link_strength
            FROM graph.map_domain_elements_risk
            WHERE element_id IN (${Prisma.join(obligationIds.map((id) => Prisma.sql`${id}::uuid`))})
          `)
        : Promise.resolve([]),
      obligationIds.length > 0
        ? prisma.$queryRaw(Prisma.sql`
            SELECT element_id AS obligation_id, control_id
            FROM graph.map_domain_elements_control
            WHERE element_id IN (${Prisma.join(obligationIds.map((id) => Prisma.sql`${id}::uuid`))})
          `)
        : Promise.resolve([]),
      prisma.obligation_graph.findMany({
        where: {
          parent_obligation_code: { in: obligationCodes },
        },
      }),
    ]) as [
      Array<{ obligation_id: string; risk_id: string; link_strength: number }>,
      Array<{ obligation_id: string; control_id: string }>,
      any[]
    ];

    const controlIds = unique(obligationControls.map((c) => c.control_id));
    const controls = controlIds.length > 0
      ? ((await prisma.$queryRaw(Prisma.sql`
          SELECT id, code, name, description, is_hard_gate, evidence_required
          FROM graph.control
          WHERE status = 'active'
            AND id IN (${Prisma.join(controlIds.map((id) => Prisma.sql`${id}::uuid`))})
        `)) as Array<{
          id: string;
          code: string;
          name: string;
          description: string | null;
          is_hard_gate: boolean;
          evidence_required: boolean;
        }>)
      : [];

    let riskControls = controlIds.length > 0
      ? ((await prisma.$queryRaw(Prisma.sql`
          SELECT control_id, risk_id, mitigation_strength
          FROM graph.map_risk_control
          WHERE framework_version_id = ${frameworkVersionId}::uuid
            AND control_id IN (${Prisma.join(controlIds.map((id) => Prisma.sql`${id}::uuid`))})
        `)) as Array<{ control_id: string; risk_id: string; mitigation_strength: number }>)
      : [];

    if (riskControls.length === 0) {
      riskControls = controlIds.length > 0
        ? ((await prisma.$queryRaw(Prisma.sql`
            SELECT control_id, risk_id, mitigation_strength
            FROM graph.map_risk_control
            WHERE control_id IN (${Prisma.join(controlIds.map((id) => Prisma.sql`${id}::uuid`))})
          `)) as Array<{ control_id: string; risk_id: string; mitigation_strength: number }>)
        : [];
    }

    const riskIdsFromObligations = obligationRisks.map((r) => r.risk_id);
    const riskIdsFromControls = riskControls.map((r) => r.risk_id);
    const riskIds = unique([...riskIdsFromObligations, ...riskIdsFromControls]);

    const risks = riskIds.length > 0
      ? ((await prisma.$queryRaw(Prisma.sql`
          SELECT id, code, name, description, risk_layer_id
          FROM graph.risk
          WHERE id IN (${Prisma.join(riskIds.map((id) => Prisma.sql`${id}::uuid`))})
        `)) as Array<{
          id: string;
          code: string;
          name: string;
          description: string | null;
          risk_layer_id: number;
        }>)
      : [];

    const riskMap = new Map<
      string,
      { id: string; code: string; name: string; description: string | null; risk_layer_id: number }
    >(risks.map((r) => [r.id, r]));

    const controlTests = await prisma.old_corpus_test_control_procedure.findMany({
      where: {
        control_id: { in: controlIds },
      },
      select: { control_id: true, test_id: true },
    });

    const testIds = unique(controlTests.map((t) => t.test_id));
    const tests = await prisma.old_corpus_test.findMany({
      where: { id: { in: testIds }, status: 'active' },
      select: { id: true, code: true, name: true, severity_if_fail: true },
    });

    const riskByObligation = new Map<string, typeof obligationRisks>();
    obligationRisks.forEach((r) => {
      const list = riskByObligation.get(r.obligation_id) || [];
      list.push(r);
      riskByObligation.set(r.obligation_id, list);
    });

    const controlByObligation = new Map<string, typeof obligationControls>();
    obligationControls.forEach((c) => {
      const list = controlByObligation.get(c.obligation_id) || [];
      list.push(c);
      controlByObligation.set(c.obligation_id, list);
    });

    const riskByControl = new Map<string, typeof riskControls>();
    riskControls.forEach((c) => {
      const list = riskByControl.get(c.control_id) || [];
      list.push(c);
      riskByControl.set(c.control_id, list);
    });

    const dependencyMap = new Map<string, typeof obligationGraph>();
    const parents = new Set<string>();
    const children = new Set<string>();
    obligationGraph.forEach((d) => {
      parents.add(d.parent_obligation_code);
      children.add(d.child_obligation_code);
      const list = dependencyMap.get(d.parent_obligation_code) || [];
      list.push(d);
      dependencyMap.set(d.parent_obligation_code, list);
    });

    const rootCodes = new Set(Array.from(parents).filter((code) => !children.has(code)));

    const obligationScores = obligations.map((o) => {
      const risksForObligation = riskByObligation.get(o.id) || [];
      const controlsForObligation = controlByObligation.get(o.id) || [];
      const deps = dependencyMap.get(o.code) || [];

      const intrinsic =
        (o.criticality || 1) +
        (o.evidence_strength || 1) +
        (o.is_hard_gate ? 5 : 0);

      const dependencyScore = deps.reduce((sum, d) => {
        return sum + toNumber(d.dependency_strength) * toNumber(d.propagation_multiplier || 1);
      }, 0) + (deps.some((d) => d.collapse_trigger) ? 5 : 0) + (rootCodes.has(o.code) ? 3 : 0);

      const riskScore = risksForObligation.reduce((sum, r) => {
        const risk = riskMap.get(r.risk_id);
        const layerWeight = risk ? 1 + Math.max(0, (risk.risk_layer_id || 1) - 1) * 0.5 : 1;
        return sum + (r.link_strength || 1) * layerWeight;
      }, 0);

      const controlCoverage = controlsForObligation.length;

      const score =
        0.30 * intrinsic +
        0.25 * dependencyScore +
        0.20 * riskScore +
        0.15 * controlCoverage +
        0.10 * (o.is_hard_gate ? 1 : 0);

      const reasons = [] as string[];
      if (o.is_hard_gate) reasons.push('hard_gate');
      if (rootCodes.has(o.code)) reasons.push('dependency_root');
      if (deps.some((d) => d.collapse_trigger)) reasons.push('collapse_trigger');
      if (riskScore > 0) reasons.push('risk_linked');
      if (controlCoverage > 0) reasons.push('control_covered');

      return { ...o, selectorScore: score, reasons };
    });

    const maxPerDomain = Math.ceil(20 * 0.35);
    const domainCounts = new Map<string, number>();

    const mandatory = new Set<string>();
    obligationScores.forEach((o) => {
      const deps = dependencyMap.get(o.code) || [];
      if (o.is_hard_gate || deps.some((d) => d.collapse_trigger)) {
        mandatory.add(o.id);
      }
    });

    const sorted = [...obligationScores].sort((a, b) => b.selectorScore - a.selectorScore);
    const selectedObligations: typeof obligationScores = [];

    for (const o of sorted) {
      if (selectedObligations.length >= 20 && !mandatory.has(o.id)) continue;
      const count = domainCounts.get(o.domain_id) || 0;
      if (count >= maxPerDomain && !mandatory.has(o.id)) continue;
      if (!selectedObligations.find((x) => x.id === o.id)) {
        selectedObligations.push(o);
        domainCounts.set(o.domain_id, count + 1);
      }
      if (selectedObligations.length >= 20 && mandatory.size === 0) break;
    }

    if (selectedObligations.length < 20) {
      for (const o of sorted) {
        if (selectedObligations.length >= 20) break;
        if (!selectedObligations.find((x) => x.id === o.id)) {
          selectedObligations.push(o);
        }
      }
    }

    const selectionObligations = mode === 'all' ? obligationScores : selectedObligations;
    const selectedObligationIds = new Set(selectionObligations.map((o) => o.id));

    const selectedControlIds = new Set(
      obligationControls
        .filter((c) => selectedObligationIds.has(c.obligation_id))
        .map((c) => c.control_id)
    );

    const selectedRiskIds = new Set([
      ...obligationRisks
        .filter((r) => selectedObligationIds.has(r.obligation_id))
        .map((r) => r.risk_id),
      ...riskControls
        .filter((rc) => selectedControlIds.has(rc.control_id))
        .map((rc) => rc.risk_id),
    ]);


    const controlScores = controls
      .filter((c) => selectedControlIds.has(c.id))
      .map((control) => {
        const obligationsCovered = obligationControls.filter(
          (c) => c.control_id === control.id && selectedObligationIds.has(c.obligation_id)
        );
        const risksCovered = (riskByControl.get(control.id) || []).filter((r) => selectedRiskIds.has(r.risk_id));

        const obligationCoverageScore = obligationsCovered.length;
        const riskMitigationScore = risksCovered.reduce((s, r) => s + (r.mitigation_strength || 1), 0);
        const hardGateBonus = control.is_hard_gate ? 5 : 0;
        const evidenceBonus = control.evidence_required ? 2 : 0;

        const score =
          0.35 * obligationCoverageScore +
          0.30 * riskMitigationScore +
          0.20 * obligationsCovered.length +
          0.10 * hardGateBonus +
          0.05 * evidenceBonus;

        const reasons = [] as string[];
        if (control.is_hard_gate) reasons.push('hard_gate');
        if (control.evidence_required) reasons.push('evidence_required');
        if (obligationsCovered.length >= 2) reasons.push('covers_multiple_obligations');
        if (riskMitigationScore > 0) reasons.push('risk_mitigation');

        return { ...control, selectorScore: score, reasons };
      });

    const controlScoresSorted = [...controlScores].sort((a, b) => b.selectorScore - a.selectorScore);
    const percentileIndex = Math.floor(controlScoresSorted.length * 0.2);
    const percentileThreshold = controlScoresSorted[percentileIndex]?.selectorScore ?? 0;

    const selectedControlsRaw = mode === 'all'
      ? controlScoresSorted
      : controlScoresSorted.filter((c) =>
          c.selectorScore >= percentileThreshold || c.reasons.includes('covers_multiple_obligations')
        ).slice(0, 15);

    const selectedControls = [...selectedControlsRaw].sort((a, b) =>
      String(a.code || '').localeCompare(String(b.code || ''), 'es', { sensitivity: 'base' })
    );

    const selectedControlIdsFinal = new Set(selectedControls.map((c) => c.id));

    const selectedRisks = risks
      .filter((r) => selectedRiskIds.has(r.id))
      .map((risk) => ({
        ...risk,
        selectorScore: (risk.risk_layer_id || 1) * 1.0,
        reasons: ['linked_to_obligations'],
      }));

    const testScores = tests
      .filter((t) => {
        const links = controlTests.filter((c) => c.test_id === t.id && selectedControlIdsFinal.has(c.control_id));
        return links.length > 0;
      })
      .map((test) => {
        const links = controlTests.filter((c) => c.test_id === test.id && selectedControlIdsFinal.has(c.control_id));
        const coverageScore = links.length;
        const criticalExposure = links.reduce((sum, link) => {
          const ctrl = selectedControls.find((c) => c.id === link.control_id);
          return sum + (ctrl?.selectorScore || 0);
        }, 0);
        const severityBonus = (test.severity_if_fail || 1) >= 4 ? 5 : 1;
        const score = 0.40 * coverageScore + 0.25 * criticalExposure + 0.20 * severityBonus + 0.15 * (coverageScore === 1 ? 2 : 1);
        const reasons = [] as string[];
        if (coverageScore >= 2) reasons.push('covers_multiple_controls');
        if ((test.severity_if_fail || 1) >= 4) reasons.push('high_severity');
        return { ...test, selectorScore: score, reasons };
      });

    const selectedTests = mode === 'all'
      ? testScores
      : [...testScores].sort((a, b) => b.selectorScore - a.selectorScore).slice(0, 12);

    const payload = {
      obligations: selectionObligations.map((o, idx) => ({
        id: o.id,
        code: o.code,
        title: o.title,
        score: o.selectorScore,
        rank: idx + 1,
        reasons: o.reasons,
      })),
      risks: selectedRisks.map((r, idx) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        description: r.description,
        score: r.selectorScore,
        rank: idx + 1,
        reasons: r.reasons,
      })),
      controls: selectedControls.map((c, idx) => ({
        id: c.id,
        code: c.code,
        name: c.name,
        description: c.description,
        score: c.selectorScore,
        rank: idx + 1,
        reasons: c.reasons,
      })),
      tests: selectedTests.map((t, idx) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        score: t.selectorScore,
        rank: idx + 1,
        reasons: t.reasons,
      })),
    };

    const run = await prisma.$transaction(async (tx) => {
      const runDraft = draftId
        ? await tx.run_draft.update({
            where: { id: draftId },
            data: {
              company_id: companyId,
              framework_version_id: frameworkVersionId,
              period_start: new Date(periodStart),
              period_end: new Date(periodEnd),
              mode,
              updated_at: new Date(),
            },
          })
        : await tx.run_draft.create({
            data: {
              company_id: companyId,
              framework_version_id: frameworkVersionId,
              period_start: new Date(periodStart),
              period_end: new Date(periodEnd),
              mode,
            },
          });

      await Promise.all([
        tx.run_obligation_draft.deleteMany({ where: { run_id: runDraft.id } }),
        tx.run_risk_draft.deleteMany({ where: { run_id: runDraft.id } }),
        tx.run_control_draft.deleteMany({ where: { run_id: runDraft.id } }),
        tx.run_test_draft.deleteMany({ where: { run_id: runDraft.id } }),
      ]);

      if (payload.obligations.length) {
        await tx.run_obligation_draft.createMany({
          data: payload.obligations.map((o) => ({
            run_id: runDraft.id,
            obligation_id: o.id,
            score: o.score,
            rank: o.rank,
            reasons: o.reasons,
          })),
        });
      }
      if (payload.risks.length) {
        await tx.run_risk_draft.createMany({
          data: payload.risks.map((r) => ({
            run_id: runDraft.id,
            risk_id: r.id,
            score: r.score,
            rank: r.rank,
            reasons: r.reasons,
          })),
        });
      }
      if (payload.controls.length) {
        await tx.run_control_draft.createMany({
          data: payload.controls.map((c) => ({
            run_id: runDraft.id,
            control_id: c.id,
            score: c.score,
            rank: c.rank,
            reasons: c.reasons,
          })),
        });
      }
      if (payload.tests.length) {
        await tx.run_test_draft.createMany({
          data: payload.tests.map((t) => ({
            run_id: runDraft.id,
            test_id: t.id,
            score: t.score,
            rank: t.rank,
            reasons: t.reasons,
          })),
        });
      }

      return runDraft;
    });

    return NextResponse.json({
      draftId: run.id,
      selection: payload,
    });
  } catch (error: any) {
    console.error('Error selecting score scope:', error);
    return NextResponse.json({ error: 'Failed to build selection' }, { status: 500 });
  }
}

