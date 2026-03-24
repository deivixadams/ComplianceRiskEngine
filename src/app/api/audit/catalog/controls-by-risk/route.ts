import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

type Payload = {
  riskIds?: string[];
};

export async function POST(request: Request) {
  try {
    const { riskIds = [] } = (await request.json()) as Payload;
    if (riskIds.length === 0) {
      return NextResponse.json({ byRisk: {} });
    }

    const prisma = (await import('@/lib/prisma')).default;
    const rows = await prisma.$queryRaw(Prisma.sql`
      SELECT
        mrc.risk_id,
        c.id AS control_id,
        c.name,
        c.description,
        c.control_objective,
        c.rationale,
        mrc.coverage_notes
      FROM graph.map_risk_control mrc
      JOIN graph.control c ON c.id = mrc.control_id
      WHERE mrc.risk_id = ANY(${riskIds}::uuid[])
      ORDER BY mrc.risk_id, c.name ASC
    `);

    const byRisk: Record<string, {
      id: string;
      name: string;
      description?: string | null;
      controlObjective?: string | null;
      failureMode?: string | null;
      designIntent?: string | null;
      coverageNotes?: string | null;
    }[]> = {};

    (rows || []).forEach((row: any) => {
      if (!byRisk[row.risk_id]) {
        byRisk[row.risk_id] = [];
      }

      // rationale can be a JSON object or a string
      let failureMode: string | null = null;
      let designIntent: string | null = null;
      const rat = row.rationale;
      if (rat && typeof rat === 'object') {
        failureMode = rat.failure_mode ?? null;
        designIntent = rat.design_intent ?? null;
      } else if (typeof rat === 'string') {
        try {
          const parsed = JSON.parse(rat);
          failureMode = parsed.failure_mode ?? null;
          designIntent = parsed.design_intent ?? null;
        } catch {
          failureMode = rat; // plain string
        }
      }

      byRisk[row.risk_id].push({
        id: row.control_id,
        name: row.name,
        description: row.description,
        controlObjective: row.control_objective,
        failureMode,
        designIntent,
        coverageNotes: row.coverage_notes
      });
    });

    return NextResponse.json({ byRisk });
  } catch (error: any) {
    console.error('Error fetching controls by risk:', error);
    return NextResponse.json({ error: 'Failed to fetch controls' }, { status: 500 });
  }
}

