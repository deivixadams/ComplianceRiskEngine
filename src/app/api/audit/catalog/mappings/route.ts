import { NextResponse } from 'next/server';

/**
 * Returns the domain element ↔ risk mapping table
 * Used by the Corpus explorer for bidirectional cascading.
 */
export async function GET() {
  try {
    const prisma = (await import('@/lib/prisma')).default;

    const rows = await prisma.$queryRaw<
      { element_id: string; risk_id: string }[]
    >`
      SELECT element_id, risk_id
      FROM graph.map_domain_elements_risk
      ORDER BY element_id, risk_id
    `;

    return NextResponse.json(rows || []);
  } catch (error: any) {
    console.error('Error fetching element-risk mappings:', error);
    return NextResponse.json({ error: 'Failed to fetch mappings' }, { status: 500 });
  }
}

