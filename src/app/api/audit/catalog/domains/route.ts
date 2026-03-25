import { NextResponse } from 'next/server';
export async function GET() {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    let rows: { id: string; name: string; code: string | null }[] = [];
    try {
      rows = await prisma.$queryRaw<
        { id: string; name: string; code: string | null }[]
      >`
        SELECT DISTINCT r.id, r.name, r.code
        FROM graph._reino r
        JOIN graph.map_reino_domain mrd
          ON mrd.reino_id = r.id
        ORDER BY r.name ASC
      `;
    } catch (error: any) {
      if (error?.code !== 'P2010' && error?.meta?.code !== '42P01') throw error;
      rows = await prisma.$queryRaw<
        { id: string; name: string; code: string | null }[]
      >`
        SELECT DISTINCT r.id, r.name, r.code
        FROM graph.reino r
        JOIN graph.map_reino_domain mrd
          ON mrd.reino_id = r.id
        ORDER BY r.name ASC
      `;
    }
    return NextResponse.json(rows || []);
  } catch (error: any) {
    console.error('Error fetching reinos:', error);
    return NextResponse.json({ error: 'Failed to fetch reinos' }, { status: 500 });
  }
}
