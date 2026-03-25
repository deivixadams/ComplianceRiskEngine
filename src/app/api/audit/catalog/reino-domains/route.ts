import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { searchParams } = new URL(request.url);
    const reinoId = searchParams.get('reino_id');
    if (!reinoId) {
      return NextResponse.json({ error: 'reino_id is required' }, { status: 400 });
    }

    const rows = await prisma.$queryRaw<
      { domain_id: string }[]
    >`
      SELECT DISTINCT mrd.domain_id
      FROM graph.map_reino_domain mrd
      WHERE mrd.reino_id = ${reinoId}::uuid
      ORDER BY mrd.domain_id
    `;

    return NextResponse.json((rows || []).map((r) => r.domain_id));
  } catch (error: any) {
    console.error('Error fetching reino domains:', error);
    return NextResponse.json({ error: 'Failed to fetch reino domains' }, { status: 500 });
  }
}

