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
      select: { id: true },
    });

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    const controls = await prisma.$queryRaw(Prisma.sql`
      SELECT
        c.id,
        c.code,
        c.name,
        c.description,
        c.control_objective,
        c.owner_role,
        c.required_test,
        c.rationale,
        c.status,
        ctt.code AS control_type_code,
        rcd.reasons
      FROM score.run_control_draft rcd
      JOIN graph.control c
        ON c.id = rcd.control_id
      LEFT JOIN catalogos.corpus_catalog_control_type ctt
        ON ctt.id = c.control_type_id
      WHERE rcd.run_id = ${runId}::uuid
      ORDER BY c.code
    `);

    const normalized = (controls as any[]).map((row) => {
      const reasons = row.reasons;
      const evaluation = reasons && typeof reasons === 'object' ? reasons.evaluation_4d || null : null;
      const rationale = row.rationale && typeof row.rationale === 'object' ? row.rationale : null;
      const failureMode =
        rationale?.failure_mode ??
        rationale?.failureMode ??
        rationale?.failure ??
        null;
      const systemicEffect =
        rationale?.systemic_effect ??
        rationale?.systemicEffect ??
        null;
      const dependencyLogic =
        rationale?.dependency_logic ??
        rationale?.dependencyLogic ??
        null;
      const failureModeLabel =
        typeof failureMode === 'string'
          ? failureMode
          : failureMode && typeof failureMode === 'object'
            ? failureMode.label || failureMode.name || JSON.stringify(failureMode)
            : null;
      const systemicEffectLabel =
        typeof systemicEffect === 'string'
          ? systemicEffect
          : systemicEffect && typeof systemicEffect === 'object'
            ? systemicEffect.label || systemicEffect.name || JSON.stringify(systemicEffect)
            : null;
      const dependencyLogicLabel =
        typeof dependencyLogic === 'string'
          ? dependencyLogic
          : dependencyLogic && typeof dependencyLogic === 'object'
            ? dependencyLogic.label || dependencyLogic.name || JSON.stringify(dependencyLogic)
            : null;
      const status = typeof row.status === 'string' ? row.status : null;
      const isActive = status ? status.toLowerCase() === 'active' : false;
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        description: row.description,
        control_objective: row.control_objective,
        failure_mode: failureModeLabel,
        systemic_effect: systemicEffectLabel,
        dependency_logic: dependencyLogicLabel,
        owner_role: row.owner_role,
        required_test: typeof row.required_test === 'boolean' ? row.required_test : null,
        is_active: isActive,
        control_type_code: row.control_type_code,
        evaluation_4d: evaluation,
      };
    });

    return NextResponse.json({ runId, controls: normalized });
  } catch (error: any) {
    console.error('Error loading run controls:', error);
    return NextResponse.json({ error: 'Failed to load controls' }, { status: 500 });
  }
}

