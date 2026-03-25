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

    const jurisdictionsRaw = await queryOrEmpty(prisma.$queryRaw`
      SELECT id, name, code
      FROM graph.jurisdiction
      ORDER BY name ASC
    `);
    const jurisdictions = Array.isArray(jurisdictionsRaw) ? jurisdictionsRaw : [];

    const frameworksRaw = await queryOrEmpty(prisma.$queryRaw`
      SELECT id, code, name, jurisdiction_id
      FROM "_DONOTUSE_".corpus_framework
      WHERE COALESCE(status, 'active') = 'active'
      ORDER BY name ASC
    `);
    const frameworks = Array.isArray(frameworksRaw)
      ? frameworksRaw.map((f: any) => ({
          id: f.id,
          code: f.code,
          name: f.name,
          jurisdictionId: f.jurisdiction_id,
        }))
      : [];

    const frameworkVersionsRaw = await queryOrEmpty(prisma.$queryRaw`
      SELECT
        fv.id,
        fv.framework_id,
        fv.version,
        fv.effective_date,
        fv.created_at
      FROM corpus.framework_version fv
      WHERE COALESCE(fv.status, 'active') = 'active'
      ORDER BY COALESCE(fv.effective_date, fv.created_at::date) DESC, fv.created_at DESC
    `);
    const frameworkVersions = Array.isArray(frameworkVersionsRaw)
      ? frameworkVersionsRaw.map((v: any) => ({
          id: v.id,
          version: v.version,
          frameworkId: v.framework_id,
          effectiveDate: v.effective_date,
        }))
      : [];

    if (companyId) {
      const generalJurisdictionRows = await queryOrEmpty(prisma.$queryRaw`
        SELECT id
        FROM graph.jurisdiction
        WHERE code = 'GEN'
        LIMIT 1
      `);
      const generalJurisdiction = Array.isArray(generalJurisdictionRows) ? generalJurisdictionRows[0] ?? null : null;

      const companyRows = await queryOrEmpty(prisma.$queryRaw`
        SELECT id, jurisdiction_id
        FROM corpus.company
        WHERE id = ${companyId}::uuid
        LIMIT 1
      `);
      const company = Array.isArray(companyRows) ? companyRows[0] ?? null : null;
      if (!company) {
        return NextResponse.json({ found: false });
      }

      const companyFrameworkRows = await queryOrEmpty(prisma.$queryRaw`
        SELECT
          fv.id AS framework_version_id,
          fv.framework_id
        FROM corpus.framework_version fv
        JOIN "_DONOTUSE_".corpus_framework f
          ON f.id = fv.framework_id
        WHERE COALESCE(fv.status, 'active') = 'active'
          AND COALESCE(f.status, 'active') = 'active'
          AND (
            ${company.jurisdiction_id}::uuid IS NULL
            OR f.jurisdiction_id = ${company.jurisdiction_id}::uuid
            OR (
              ${generalJurisdiction?.id ?? null}::uuid IS NOT NULL
              AND f.jurisdiction_id = ${generalJurisdiction?.id ?? null}::uuid
            )
          )
        ORDER BY COALESCE(fv.effective_date, fv.created_at::date) DESC, fv.created_at DESC
        LIMIT 1
      `);

      const companyFramework = Array.isArray(companyFrameworkRows) ? companyFrameworkRows[0] ?? null : null;
      if (!companyFramework) {
        return NextResponse.json({
          found: false,
          jurisdictionId: company.jurisdiction_id ?? null,
        });
      }

      return NextResponse.json({
        found: true,
        jurisdictionId: company.jurisdiction_id ?? null,
        frameworkVersionId: companyFramework.framework_version_id ?? null,
        frameworkId: companyFramework.framework_id ?? null,
      });
    }

    const companies = await queryOrEmpty(prisma.$queryRaw`
      SELECT id, name, code
      FROM corpus.company
      ORDER BY name ASC
    `) as any[];

    return NextResponse.json({
      companies,
      jurisdictions,
      frameworks,
      frameworkSources: [],
      frameworkVersions,
    });
  } catch (error: any) {
    console.error('Error fetching superintendence context:', error);
    return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
  }
}
