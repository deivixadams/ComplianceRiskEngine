import { NextResponse } from 'next/server';
type Payload = {
  domainIds?: string[];
  obligationIds?: string[];
};

export async function POST(request: Request) {
  try {
    const { domainIds = [], obligationIds = [] } = (await request.json()) as Payload;

    let resolvedObligationIds = obligationIds;
    if (resolvedObligationIds.length === 0 && domainIds.length > 0) {
      const prisma = (await import('@/lib/prisma')).default;
      const obligations = await prisma.$queryRaw<{ id: string }[]>`
        SELECT de.id
        FROM graph.domain_elements de
        JOIN graph.map_domain_element mde
          ON mde.element_id = de.id
        WHERE de.element_type = 'OBLIGATION'
          AND mde.domain_id = ANY(${domainIds}::uuid[])
      `;
      resolvedObligationIds = (obligations || []).map((o) => o.id);
    }

    const obligationCount = resolvedObligationIds.length;

    let riskCount = 0;
    let controlCount = 0;
    if (resolvedObligationIds.length > 0) {
      const prisma = (await import('@/lib/prisma')).default;
      const risks = await prisma.$queryRaw<{ risk_id: string }[]>`
        SELECT DISTINCT mrc.risk_id
        FROM graph.map_domain_elements_control moc
        JOIN graph.map_risk_control mrc ON mrc.control_id = moc.control_id
        WHERE moc.element_id = ANY(${resolvedObligationIds}::uuid[])
      `;
      riskCount = (risks || []).length;

      const controls = await prisma.$queryRaw<{ control_id: string }[]>`
        SELECT DISTINCT control_id
        FROM graph.map_domain_elements_control
        WHERE element_id = ANY(${resolvedObligationIds}::uuid[])
      `;
      controlCount = new Set((controls || []).map((c) => c.control_id)).size;
    }

    return NextResponse.json({
      obligationCount,
      riskCount,
      controlCount,
      testCount: 0,
    });
  } catch (error: any) {
    console.error('Error deriving scope:', error);
    return NextResponse.json({ error: 'Failed to derive scope' }, { status: 500 });
  }
}

