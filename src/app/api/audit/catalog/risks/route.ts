import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';

type RiskRow = {
  id: string;
  code: string | null;
  name: string;
  description: string | null;
  status: string;
  risk_type: string | null;
  risk_type_name: string | null;
  risk_layer_name: string | null;
  domain_ids: string[] | null;
};

type Payload = {
  domainIds?: string[];
  obligationIds?: string[];
  riskIds?: string[];
};

async function fetchRisks(domainIds: string[], obligationIds: string[], riskIds: string[]) {
  const prisma = (await import('@/lib/prisma')).default;
  const filters: Prisma.Sql[] = [];

  if (riskIds.length > 0) {
    filters.push(Prisma.sql`r.id = ANY(${riskIds}::uuid[])`);
  } else if (obligationIds.length > 0) {
    filters.push(Prisma.sql`moc.element_id = ANY(${obligationIds}::uuid[])`);
  } else if (domainIds.length > 0) {
    filters.push(Prisma.sql`mde.domain_id = ANY(${domainIds}::uuid[])`);
  }

  const whereSql = filters.length
    ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`
    : Prisma.sql``;

  const rows = await prisma.$queryRaw(Prisma.sql`
    SELECT
      r.id,
      r.code,
      r.name,
      r.description,
      r.status,
      r.risk_type,
      rt.name AS risk_type_name,
      rl.name AS risk_layer_name,
      COALESCE(
        array_agg(DISTINCT mde.domain_id) FILTER (WHERE mde.domain_id IS NOT NULL),
        ARRAY[]::uuid[]
      ) AS domain_ids
    FROM graph.risk r
    LEFT JOIN catalogos.corpus_catalog_risk_type rt ON rt.id = r.risk_type_id
    LEFT JOIN catalogos.corpus_catalog_risk_layer rl ON rl.id = r.risk_layer_id
    LEFT JOIN graph.map_risk_control mrc ON mrc.risk_id = r.id
    LEFT JOIN graph.map_domain_elements_control moc ON moc.control_id = mrc.control_id
    LEFT JOIN graph.map_domain_element mde ON mde.element_id = moc.element_id
    ${whereSql}
    GROUP BY r.id, r.code, r.name, r.description, r.status, r.risk_type, rt.name, rl.name
    ORDER BY r.name ASC
  `);

  return (rows || []).map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description,
    status: row.status,
    riskTypeName: row.risk_type_name ?? row.risk_type ?? null,
    riskLayerName: row.risk_layer_name ?? null,
    domainIds: row.domain_ids ?? []
  }));
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainIds = searchParams.getAll('domain_id');
    const obligationIds = searchParams.getAll('obligation_id');
    const riskIds = searchParams.getAll('risk_id');

    const normalized = await fetchRisks(domainIds, obligationIds, riskIds);
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error('Error fetching risks:', error);
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { domainIds = [], obligationIds = [], riskIds = [] } = (await request.json()) as Payload;
    const normalized = await fetchRisks(domainIds, obligationIds, riskIds);
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error('Error fetching risks:', error);
    return NextResponse.json({ error: 'Failed to fetch risks' }, { status: 500 });
  }
}

