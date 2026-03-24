import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { runId } = await params;

    if (!runId) {
      return NextResponse.json({ error: 'Missing runId' }, { status: 400 });
    }

    const run = await prisma.run_draft.findUnique({
      where: { id: runId },
      select: { id: true, framework_version_id: true },
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
      domain_obligations AS (
        SELECT mde.domain_id, so.obligation_id
        FROM selected_obligations so
        JOIN graph.map_domain_element mde
          ON mde.element_id = so.obligation_id
      ),
      domain_controls AS (
        SELECT DISTINCT dob.domain_id, moc.control_id
        FROM domain_obligations dob
        JOIN graph.map_domain_elements_control moc
          ON moc.element_id = dob.obligation_id
      ),
      control_eval AS (
        SELECT DISTINCT control_id
        FROM score.score_test_result_draft
        WHERE run_id = ${runId}::uuid
      )
      SELECT
        d.id AS domain_id,
        d.code AS domain_code,
        d.name AS domain_name,
        COUNT(DISTINCT dob.obligation_id) AS obligations,
        COUNT(DISTINCT dc.control_id) AS controls,
        COUNT(DISTINCT ce.control_id) AS evaluated_controls
      FROM graph.domain d
      LEFT JOIN domain_obligations dob ON dob.domain_id = d.id
      LEFT JOIN domain_controls dc ON dc.domain_id = d.id
      LEFT JOIN control_eval ce ON ce.control_id = dc.control_id
      WHERE d.framework_version_id = ${run.framework_version_id}::uuid
      GROUP BY d.id, d.code, d.name
      ORDER BY d.code
    `);

    const domains = (rows as any[]).map((row) => {
      const controls = Number(row.controls || 0);
      const evaluated = Number(row.evaluated_controls || 0);
      const pending = Math.max(controls - evaluated, 0);
      const ratio = controls > 0 ? evaluated / controls : 0;
      return {
        domainId: row.domain_id,
        code: row.domain_code,
        name: row.domain_name,
        obligations: Number(row.obligations || 0),
        controls,
        evaluated,
        pending,
        progress: ratio,
      };
    });

    return NextResponse.json({ runId, domains });
  } catch (error: any) {
    console.error('Error loading score domains:', error);
    return NextResponse.json({ error: 'Failed to load domains' }, { status: 500 });
  }
}

