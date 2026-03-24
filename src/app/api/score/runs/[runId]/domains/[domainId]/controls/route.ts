import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

type DimensionStatus = 'Not evaluated' | 'Partial' | 'Evaluated';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ runId: string; domainId: string }> }
) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { runId, domainId } = await params;

    if (!runId || !domainId) {
      return NextResponse.json({ error: 'Missing runId/domainId' }, { status: 400 });
    }

    const run = await prisma.run_draft.findUnique({
      where: { id: runId },
      select: { id: true },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const rows = await prisma.$queryRaw(Prisma.sql`
      WITH selected_obligations AS (
        SELECT obligation_id
        FROM score.run_obligation_draft
        WHERE run_id = ${runId}::uuid
      ),
      domain_controls AS (
        SELECT DISTINCT moc.control_id
        FROM graph.map_domain_elements_control moc
        JOIN selected_obligations so
          ON so.obligation_id = moc.element_id
        JOIN graph.map_domain_element mde
          ON mde.element_id = moc.element_id
        WHERE mde.domain_id = ${domainId}::uuid
      )
      SELECT
        c.id AS control_id,
        c.code AS control_code,
        c.name AS control_name,
        c.description AS control_description,
        c.control_objective,
        c.owner_role,
        v.dimension,
        v.test_id,
        v.is_key,
        v.required,
        r.passed,
        r.score
      FROM domain_controls dc
      JOIN graph.control c
        ON c.id = dc.control_id
      LEFT JOIN corpus.controltest_graph_view v
        ON v.control_id = c.id
      LEFT JOIN score.score_test_result_draft r
        ON r.run_id = ${runId}::uuid
       AND r.control_id = c.id
       AND r.test_id = v.test_id
       AND r.dimension = v.dimension
      ORDER BY c.code, v.dimension, v.test_id
    `);

    const evidenceRows = await prisma.$queryRaw(Prisma.sql`
      SELECT control_id, COUNT(*)::int AS evidence_count
      FROM score.evidence_score_draft
      WHERE run_id = ${runId}::uuid
      GROUP BY control_id
    `);

    const evidenceByControl = new Map<string, number>(
      (evidenceRows as any[]).map((row) => [row.control_id, Number(row.evidence_count || 0)])
    );

    const controlsMap = new Map<string, any>();

    (rows as any[]).forEach((row) => {
      const controlId = row.control_id;
      if (!controlsMap.has(controlId)) {
        controlsMap.set(controlId, {
          id: controlId,
          code: row.control_code,
          name: row.control_name,
          description: row.control_description,
          objective: row.control_objective,
          owner: row.owner_role,
          dimensions: new Map<string, { total: number; done: number; gateFailed: boolean }>(),
          testsTotal: 0,
          testsDone: 0,
          evidenceCount: evidenceByControl.get(controlId) || 0,
        });
      }

      const entry = controlsMap.get(controlId);
      if (!row.dimension || !row.test_id) return;

      entry.testsTotal += 1;
      if (row.score !== null || row.passed !== null) entry.testsDone += 1;

      if (!entry.dimensions.has(row.dimension)) {
        entry.dimensions.set(row.dimension, { total: 0, done: 0, gateFailed: false });
      }
      const dim = entry.dimensions.get(row.dimension);
      dim.total += 1;
      if (row.score !== null || row.passed !== null) dim.done += 1;
      if (row.is_key && row.passed === false) dim.gateFailed = true;
    });

    const controls = Array.from(controlsMap.values()).map((control) => {
      const dimensionStatuses: Record<string, DimensionStatus> = {};
      let gateFailed = false;
      let anyDone = false;
      let allEvaluated = true;

      for (const [dimension, dim] of control.dimensions.entries()) {
        if (dim.gateFailed) gateFailed = true;
        if (dim.done > 0) anyDone = true;
        if (dim.done < dim.total) allEvaluated = false;

        let status: DimensionStatus = 'Not evaluated';
        if (dim.done === dim.total && dim.total > 0) status = 'Evaluated';
        else if (dim.done > 0) status = 'Partial';
        dimensionStatuses[dimension] = status;
      }

      let status = 'Not evaluated';
      if (gateFailed) status = 'Gate failed';
      else if (allEvaluated && control.testsTotal > 0) status = 'Evaluated';
      else if (anyDone) status = 'Partial';

      return {
        id: control.id,
        code: control.code,
        name: control.name,
        description: control.description,
        objective: control.objective,
        owner: control.owner,
        testsTotal: control.testsTotal,
        testsDone: control.testsDone,
        evidenceCount: control.evidenceCount,
        dimensionStatuses,
        status,
      };
    });

    return NextResponse.json({ runId, domainId, controls });
  } catch (error: any) {
    console.error('Error loading domain controls:', error);
    return NextResponse.json({ error: 'Failed to load controls' }, { status: 500 });
  }
}

