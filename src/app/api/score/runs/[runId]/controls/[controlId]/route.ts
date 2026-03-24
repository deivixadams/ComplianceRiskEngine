import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

function keepFirstSentences(items: string[], maxSentences = 3): string[] {
  const normalized = items.map((v) => String(v || '').trim()).filter(Boolean);
  if (normalized.length === 0) return [];

  const joined = normalized.join(' ');
  const sentences =
    joined
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((s) => s.trim())
      .filter(Boolean) ?? [];

  if (sentences.length >= maxSentences) {
    return sentences.slice(0, maxSentences);
  }

  return normalized.slice(0, maxSentences);
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ runId: string; controlId: string }> }
) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { runId, controlId } = await params;

    if (!runId || !controlId) {
      return NextResponse.json({ error: 'Missing runId/controlId' }, { status: 400 });
    }

    const controlRows = await prisma.$queryRaw<Array<{
      id: string;
      code: string;
      name: string;
      description: string | null;
      control_objective: string | null;
      owner_role: string | null;
      evidence_required: boolean | null;
    }>>(Prisma.sql`
      SELECT
        id,
        code,
        name,
        description,
        control_objective,
        owner_role,
        evidence_required
      FROM graph.control
      WHERE id = ${controlId}::uuid
      LIMIT 1
    `);
    const control = controlRows[0] ?? null;

    if (!control) {
      return NextResponse.json({ error: 'Control not found' }, { status: 404 });
    }

    const dimensionModel = await prisma.$queryRaw(Prisma.sql`
      SELECT
        dimension,
        weight,
        is_gate,
        min_dimension_score
      FROM corpus.control_dimension_model
      ORDER BY dimension
    `);

    let criteriaByDimension: Record<string, string[]> = {};
    let dimensionTestCounts: Record<string, number> = {};
    const testSeen = new Set<string>();

    const relationRows = await prisma.$queryRaw<
      Array<{
        ctdm_rel: string | null;
        ctv_rel: string | null;
      }>
    >(Prisma.sql`
      SELECT
        to_regclass('corpus.controltest_dimension_model')::text AS ctdm_rel,
        to_regclass('corpus.controltest_graph_view')::text AS ctv_rel
    `);
    const hasControltestDimensionModel = Boolean(relationRows[0]?.ctdm_rel);
    const hasControltestGraphView = Boolean(relationRows[0]?.ctv_rel);

    if (hasControltestDimensionModel) {
      const criteriaRows = await prisma.$queryRaw(Prisma.sql`
        SELECT
          cdm.dimension,
          cdm.evidence_min_spec,
          cdt.id AS control_dimension_test_id,
          tcat.code AS test_code,
          tcat.title AS test_title,
          tcat.procedure_text,
          tre.required,
          tre.window_days,
          ec.name AS evidence_name
        FROM corpus.controltest_dimension_model cdm
        LEFT JOIN corpus.controltest_dimension_test cdt
          ON cdt.control_dimension_id = cdm.id
          AND cdt.is_active = true
        LEFT JOIN corpus.controltest_test_catalog tcat
          ON tcat.id = cdt.test_id
        LEFT JOIN corpus.controltest_required_evidence tre
          ON tre.control_dimension_test_id = cdt.id
        LEFT JOIN corpus.controltest_evidence_catalog ec
          ON ec.id = tre.evidence_id
        WHERE cdm.control_id = ${controlId}::uuid
          AND cdm.is_active = true
          AND (cdm.effective_to IS NULL OR cdm.effective_to > NOW())
        ORDER BY cdm.dimension, tcat.code
      `);

      (criteriaRows as any[]).forEach((row) => {
        const dimension = String(row.dimension || '');
        if (!criteriaByDimension[dimension]) criteriaByDimension[dimension] = [];
        dimensionTestCounts[dimension] = (dimensionTestCounts[dimension] || 0) + (row.control_dimension_test_id ? 1 : 0);
        if (row.evidence_min_spec) {
          const spec = String(row.evidence_min_spec);
          if (!criteriaByDimension[dimension].includes(spec)) {
            criteriaByDimension[dimension].push(spec);
          }
        }
        if (row.test_code || row.test_title) {
          const key = `${dimension}:${row.test_code || ''}:${row.test_title || ''}`;
          if (!testSeen.has(key)) {
            testSeen.add(key);
            const meta: string[] = [];
            if (row.required) meta.push('evidencia requerida');
            if (row.evidence_name) meta.push(String(row.evidence_name));
            if (row.window_days) meta.push(`ventana ${row.window_days} dias`);
            const labelBase = row.procedure_text
              ? String(row.procedure_text)
              : row.test_title
                ? `${row.test_code} — ${row.test_title}`
                : `${row.test_code || 'Test'}`;
            const line = meta.length ? `${labelBase} (${meta.join(', ')})` : labelBase;
            criteriaByDimension[dimension].push(line);
          }
        }
      });
    }

    const evaluatorRows = await prisma.$queryRaw(Prisma.sql`
      SELECT
        cdm.dimension,
        cec.evaluation_guidance,
        cec.pass_criteria,
        cec.fail_criteria,
        cec.evaluator_steps,
        cec.evidence_min_spec,
        cec.sample_guidance,
        cec.notes
      FROM corpus.control_evaluation_catalog cec
      JOIN corpus.control_dimension_model cdm
        ON cdm.id = cec.dimension_id
      WHERE cec.control_id = ${controlId}::uuid
        AND cec.is_active = true
        AND (cec.effective_to IS NULL OR cec.effective_to > NOW())
      ORDER BY cdm.dimension
    `);

    (evaluatorRows as any[]).forEach((row) => {
      const dimension = String(row.dimension || '');
      if (!criteriaByDimension[dimension]) criteriaByDimension[dimension] = [];
      const addLine = (line: unknown) => {
        const value = String(line || '').trim();
        if (!value) return;
        if (!criteriaByDimension[dimension].includes(value)) {
          criteriaByDimension[dimension].push(value);
        }
      };
      addLine(row.evaluation_guidance);
      addLine(row.evidence_min_spec);
      addLine(row.sample_guidance);
      addLine(row.pass_criteria ? `Criterio de cumplimiento: ${String(row.pass_criteria).trim()}` : '');
      addLine(row.fail_criteria ? `Criterio de no cumplimiento: ${String(row.fail_criteria).trim()}` : '');
      addLine(row.notes);
      const steps = String(row.evaluator_steps || '')
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      steps.forEach(addLine);
    });

    const tests = hasControltestGraphView
      ? await prisma.$queryRaw(Prisma.sql`
          SELECT
            control_id,
            dimension,
            test_id,
            test_code,
            test_title,
            test_weight,
            is_key,
            evidence_type,
            evidence_name,
            required,
            min_quantity,
            window_days
          FROM corpus.controltest_graph_view
          WHERE control_id = ${controlId}::uuid
          ORDER BY dimension, test_code
        `)
      : [];

    const results = await prisma.score_test_result_draft.findMany({
      where: { run_id: runId, control_id: controlId },
    });

    const evidenceTable = await prisma.$queryRaw<Array<{ rel: string | null }>>(Prisma.sql`
      SELECT to_regclass('score.evidence_score_draft')::text AS rel
    `);
    const hasEvidenceTable = Boolean(evidenceTable[0]?.rel);

    const evidence = hasEvidenceTable
      ? await prisma.evidence_score_draft.findMany({
          where: { run_id: runId, control_id: controlId },
          orderBy: { uploaded_at: 'desc' },
        })
      : [];

    Object.keys(criteriaByDimension).forEach((dimension) => {
      criteriaByDimension[dimension] = keepFirstSentences(criteriaByDimension[dimension] || [], 3);
    });

    return NextResponse.json({
      runId,
      control,
      dimensionModel,
      tests,
      results,
      evidence,
      criteriaByDimension,
      dimensionTestCounts,
    });
  } catch (error: any) {
    console.error('Error loading control evaluation:', error);
    return NextResponse.json({ error: 'Failed to load control evaluation' }, { status: 500 });
  }
}
