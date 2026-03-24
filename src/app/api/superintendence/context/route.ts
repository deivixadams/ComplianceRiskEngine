import { NextResponse } from 'next/server';
export async function GET(request: Request) {
  try {
    const prisma = (await import('@/lib/prisma')).default;
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const queryOrEmpty = async <T,>(query: Promise<T>): Promise<T | any[]> => {
      try {
        return await query;
      } catch (error: any) {
        if (error?.code === 'P2010' || error?.meta?.code === '42P01') {
          return [];
        }
        throw error;
      }
    };

    const rdRows = await queryOrEmpty(prisma.$queryRaw<
      { id: string; name: string; code: string }[]
    >`
      SELECT id, name, code
      FROM graph.jurisdiction
      WHERE code = 'DO' OR name ILIKE '%dominicana%'
      ORDER BY name ASC
      LIMIT 1
    `);

    const rd = Array.isArray(rdRows) ? rdRows[0] ?? null : null;

    if (companyId) {
      const sources = await queryOrEmpty(prisma.$queryRaw<
        { id: string; citation: string | null; framework_version_id: string | null }[]
      >`
        SELECT id, citation, framework_version_id
        FROM corpus.framework_source
        ORDER BY created_at DESC NULLS LAST, id DESC
        LIMIT 1
      `);

      const source = Array.isArray(sources) ? sources[0] ?? null : null;
      if (!source) {
        return NextResponse.json({ found: false });
      }

      return NextResponse.json({
        found: true,
        jurisdictionId: rd?.id ?? null,
        frameworkSourceId: source.id,
        frameworkVersionId: source.framework_version_id ?? null,
      });
    }

    const companies = await queryOrEmpty(prisma.$queryRaw`
      SELECT id, name, code
      FROM corpus.company
      ORDER BY name ASC
    `) as any[];
    const jurisdictions = rd ? [rd] : [];
    const frameworks: any[] = [];
    const frameworkSourcesRaw = await queryOrEmpty(prisma.$queryRaw`
      SELECT id, citation, framework_version_id
      FROM corpus.framework_source
      ORDER BY created_at DESC NULLS LAST, id DESC
    `);
    const frameworkSources = (frameworkSourcesRaw as any[]).map((v) => ({
      id: v.id,
      citation: v.citation,
      frameworkVersionId: v.framework_version_id,
      frameworkId: null,
    }));

    const frameworkVersionsRaw: any[] = [];
    const frameworkVersions = (frameworkVersionsRaw as any[]).map((v) => ({
      id: v.id,
      version: v.version,
      frameworkId: v.framework_id,
    }));

    return NextResponse.json({
      companies,
      jurisdictions,
      frameworks,
      frameworkSources,
      frameworkVersions,
    });
  } catch (error: any) {
    console.error('Error fetching superintendence context:', error);
    return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
  }
}
