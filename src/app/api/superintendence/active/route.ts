import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    if (!companyId) {
      return NextResponse.json({ error: 'Missing company_id' }, { status: 400 });
    }

    let rows: {
      jurisdiction_id: string;
      jurisdiction_name: string;
      framework_id: string;
      framework_name: string;
      framework_version_id: string;
      framework_version: string | null;
    }[] = [];

    try {
      rows = await prisma.$queryRaw`
        SELECT
          s.jurisdiction_id,
          j.name as jurisdiction_name,
          s.framework_id,
          f.name as framework_name,
          s.framework_version_id,
          v.version as framework_version
        FROM corpus.corpus.superintendence s
        JOIN graph.jurisdiction j ON j.id = s.jurisdiction_id
        JOIN pendiente.corpus_framework f ON f.id = s.framework_id
        JOIN corpus._Delete_framework_version v ON v.id = s.framework_version_id
        WHERE s.company_id = ${companyId}
          AND s.is_active = true
        LIMIT 1
      `;
    } catch {
      return NextResponse.json({ found: false });
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ found: false });
    }

    const row = rows[0];
    return NextResponse.json({
      found: true,
      jurisdictionId: row.jurisdiction_id,
      jurisdictionName: row.jurisdiction_name,
      frameworkId: row.framework_id,
      frameworkName: row.framework_name,
      frameworkVersionId: row.framework_version_id,
      frameworkVersion: row.framework_version,
    });
  } catch (error: any) {
    console.error('Error fetching active superintendence profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}
