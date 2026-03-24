import { NextResponse } from 'next/server';
export async function GET() {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const rows = await prisma.$queryRaw<
      { id: string; name: string; code: string | null }[]
    >`
      SELECT id, name, code
      FROM graph.domain
      ORDER BY name ASC
    `;
    return NextResponse.json(rows || []);
  } catch (error: any) {
    console.error('Error fetching domains:', error);
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
}
