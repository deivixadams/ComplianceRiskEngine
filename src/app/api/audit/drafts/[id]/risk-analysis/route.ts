import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-server';
import prisma from '@/lib/prisma';

type DraftRecord = {
  id: string;
  scope_config?: {
    obligation_ids?: string[];
  } | null;
};

type RiskAnalysisRow = {
  riskId: string;
  riskCode: string | null;
  riskName: string | null;
  riskOrigen: string | null;
  elementId: string;
  elementCode: string | null;
  elementName: string | null;
  probability: number;
  impact: number;
  connectivity: number;
  cascade: number;
  kFactor: number;
  baseScore: number;
  riskScore: number;
  deltaScore: number;
  scenario: string | null;
  source: string | null;
  analysisNotes: string | null;
  isOverridden: boolean;
};

type BaselineRow = {
  risk_id: string;
  risk_code: string | null;
  risk_name: string | null;
  risk_origen: string | null;
  element_id: string;
  element_code: string | null;
  element_name: string | null;
  probability: Prisma.Decimal | number;
  impact: Prisma.Decimal | number;
  connectivity: number;
  cascade: Prisma.Decimal | number;
  k_factor: Prisma.Decimal | number;
  scenario: string | null;
  source: string | null;
  analysis_notes: string | null;
};

type OverrideRow = {
  risk_id: string;
  element_id: string;
  probability: Prisma.Decimal | number;
  impact: Prisma.Decimal | number;
  connectivity: number;
  cascade: Prisma.Decimal | number;
  k_factor: Prisma.Decimal | number;
  scenario: string | null;
  source: string | null;
  analysis_notes: string | null;
};

type PutBody = {
  rows?: Array<{
    riskId: string;
    elementId: string;
    probability: number;
    impact: number;
    connectivity: number;
    cascade: number;
    kFactor: number;
    scenario?: string | null;
    source?: string | null;
    analysisNotes?: string | null;
  }>;
};

const toNumber = (value: Prisma.Decimal | number | string | null | undefined, fallback = 0) => {
  if (value === null || value === undefined) return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const round4 = (value: number) => Math.round(value * 10000) / 10000;
const round6 = (value: number) => Math.round(value * 1_000_000) / 1_000_000;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function computeScores(probability: number, impact: number, cascade: number, kFactor: number) {
  const baseScore = round6(probability * impact);
  const riskScore = round6((probability * impact) * (1 + (kFactor * cascade)));
  const deltaScore = round6(riskScore - baseScore);
  return { baseScore, riskScore, deltaScore };
}

async function getAuthorizedDraft(draftId: string, tenantId: string): Promise<DraftRecord | null> {
  const draft = await prisma.corpus.assessment_draft.findFirst({
    where: { id: draftId, tenant_id: tenantId },
    select: { id: true, scope_config: true }
  });
  return draft as DraftRecord | null;
}

function extractElementIds(draft: DraftRecord | null): string[] {
  const ids = draft?.scope_config?.obligation_ids;
  if (!Array.isArray(ids)) return [];
  return ids.filter((id): id is string => typeof id === 'string' && id.length > 0);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const draft = await getAuthorizedDraft(id, auth.tenantId);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const elementIds = extractElementIds(draft);

    const filterSql = elementIds.length > 0
      ? Prisma.sql`va.element_id = ANY(${elementIds}::uuid[])`
      : Prisma.sql`va.risk_origen = 'AML'`;

    const baselineRows = (await prisma.$queryRaw(Prisma.sql`
      SELECT
        va.risk_id,
        va.risk_code,
        va.risk_name,
        va.risk_origen,
        va.element_id,
        va.element_code,
        va.element_name,
        va.probability,
        va.impact,
        va.connectivity,
        va.cascade,
        va.k_factor,
        va.scenario,
        va.source,
        va.analysis_notes
      FROM graph.v_risk_analyst va
      WHERE ${filterSql}
      ORDER BY va.element_name ASC, va.risk_name ASC
    `)) as BaselineRow[];

    const overrideRows = (await prisma.$queryRaw(Prisma.sql`
      SELECT
        ovr.risk_id,
        ovr.element_id,
        ovr.probability,
        ovr.impact,
        ovr.connectivity,
        ovr.cascade,
        ovr.k_factor,
        ovr.scenario,
        ovr.source,
        ovr.analysis_notes
      FROM graph.audit_draft_risk_analysis ovr
      WHERE ovr.draft_id = ${id}::uuid
    `)) as OverrideRow[];

    const overrideMap = new Map<string, OverrideRow>();
    overrideRows.forEach((row) => {
      overrideMap.set(`${row.risk_id}::${row.element_id}`, row);
    });

    const rows: RiskAnalysisRow[] = baselineRows.map((row) => {
      const key = `${row.risk_id}::${row.element_id}`;
      const override = overrideMap.get(key);

      const probability = round4(toNumber(override?.probability ?? row.probability));
      const impact = round4(toNumber(override?.impact ?? row.impact));
      const cascade = round4(toNumber(override?.cascade ?? row.cascade));
      const kFactor = round4(toNumber(override?.k_factor ?? row.k_factor, 1));
      const connectivity = Math.round(toNumber(override?.connectivity ?? row.connectivity, 1));
      const { baseScore, riskScore, deltaScore } = computeScores(probability, impact, cascade, kFactor);

      return {
        riskId: row.risk_id,
        riskCode: row.risk_code,
        riskName: row.risk_name,
        riskOrigen: row.risk_origen,
        elementId: row.element_id,
        elementCode: row.element_code,
        elementName: row.element_name,
        probability,
        impact,
        connectivity,
        cascade,
        kFactor,
        baseScore,
        riskScore,
        deltaScore,
        scenario: override?.scenario ?? row.scenario ?? null,
        source: override?.source ?? row.source ?? null,
        analysisNotes: override?.analysis_notes ?? row.analysis_notes ?? null,
        isOverridden: Boolean(override)
      };
    });

    return NextResponse.json({
      rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Error loading risk analysis draft rows:', error);
    return NextResponse.json({ error: 'Failed to load risk analysis rows' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthContext();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const draft = await getAuthorizedDraft(id, auth.tenantId);
    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    const body = (await request.json()) as PutBody;
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    await prisma.$executeRaw`
      DELETE FROM graph.audit_draft_risk_analysis
      WHERE draft_id = ${id}::uuid
    `;

    let inserted = 0;
    if (rows.length > 0) {
      await prisma.$transaction(
        rows.map((row) => {
          const probability = round4(Math.max(0, toNumber(row.probability, 0)));
          const impact = round4(Math.max(0, toNumber(row.impact, 0)));
          const connectivity = clamp(Math.round(toNumber(row.connectivity, 1)), 1, 5);
          const cascade = round4(clamp(toNumber(row.cascade, 0), 0, 1));
          const kFactor = round4(Math.max(0, toNumber(row.kFactor, 1)));
          const scenario = row.scenario?.trim() || null;
          const source = row.source?.trim() || null;
          const analysisNotes = row.analysisNotes?.trim() || null;

          inserted += 1;

          return prisma.$executeRaw`
            INSERT INTO graph.audit_draft_risk_analysis (
              draft_id,
              risk_id,
              element_id,
              probability,
              impact,
              connectivity,
              cascade,
              k_factor,
              analysis_notes,
              source,
              scenario,
              updated_at
            )
            VALUES (
              ${id}::uuid,
              ${row.riskId}::uuid,
              ${row.elementId}::uuid,
              ${probability},
              ${impact},
              ${connectivity},
              ${cascade},
              ${kFactor},
              ${analysisNotes},
              ${source},
              ${scenario},
              now()
            )
          `;
        })
      );
    }

    return NextResponse.json({ ok: true, count: inserted });
  } catch (error) {
    console.error('Error saving risk analysis draft rows:', error);
    return NextResponse.json({ error: 'Failed to save risk analysis rows' }, { status: 500 });
  }
}
