import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainIds = searchParams.getAll('domain_id');

    const prisma = (await import('@/lib/prisma')).default;

    const obligations = domainIds.length > 0
      ? await prisma.$queryRaw<
          { id: string; title: string; code: string | null; domain_id: string }[]
        >`
          SELECT
            de.id,
            COALESCE(de.title, de.name, de.code) AS title,
            de.code,
            mde.domain_id
          FROM graph.domain_elements de
          JOIN graph.map_domain_element mde
            ON mde.element_id = de.id
          WHERE de.element_type = 'OBLIGATION'
            AND mde.domain_id = ANY(${domainIds}::uuid[])
          ORDER BY title ASC
        `
      : await prisma.$queryRaw<
          { id: string; title: string; code: string | null; domain_id: string }[]
        >`
          SELECT
            de.id,
            COALESCE(de.title, de.name, de.code) AS title,
            de.code,
            mde.domain_id
          FROM graph.domain_elements de
          JOIN graph.map_domain_element mde
            ON mde.element_id = de.id
          WHERE de.element_type = 'OBLIGATION'
          ORDER BY title ASC
        `;

    const normalized = (obligations || []).map((o) => ({
      id: o.id,
      title: o.title,
      code: o.code,
      domainId: o.domain_id,
    }));
    return NextResponse.json(normalized);
  } catch (error: any) {
    console.error('Error fetching obligations:', error);
    return NextResponse.json({ error: 'Failed to fetch obligations' }, { status: 500 });
  }
}

