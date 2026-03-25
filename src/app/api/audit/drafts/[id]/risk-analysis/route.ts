import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth-server';
import prisma from '@/lib/prisma';

type DraftRecord = {
  id: string;
  scope_config?: {
    selected_reino_id?: string;
    selected_domain_id?: string;
    domain_ids?: string[];
  } | null;
};

type ScopeSelection = {
  selectedReinoId: string | null;
  domainIds: string[];
};

type RowMode = 'SYSTEM' | 'CUSTOM';

type RiskAnalysisRow = {
  rowId: string;
  rowMode: RowMode;
  domainId: string;
  riskId: string;
  riskCode: string | null;
  riskName: string | null;
  riskOrigen: string | null;
  elementId: string | null;
  elementCode: string | null;
  elementName: string | null;
  customElementName?: string | null;
  probability: number | null;
  impact: number | null;
  connectivity: number | null;
  cascade: number | null;
  kFactor: number;
  baseScore: number | null;
  riskScore: number | null;
  deltaScore: number | null;
  mitigatingControlId: string | null;
  mitigatingControlCode: string | null;
  mitigatingControlName: string | null;
  mitigatingControlDescription: string | null;
  mitigationStrength: number | null;
  mitigationLevel: string | null;
  scenario: string | null;
  source: string | null;
  analysisNotes: string | null;
  hasRealData: boolean;
  isMissingRequiredData: boolean;
  isOverridden: boolean;
};

type RiskCatalogOption = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  baseValue: number;
  sortOrder: number;
};

type BaselineRow = {
  domain_id: string;
  risk_id: string;
  risk_code: string | null;
  risk_name: string | null;
  risk_origen: string | null;
  element_id: string;
  element_code: string | null;
  element_name: string | null;
  probability: Prisma.Decimal | number | null;
  impact: Prisma.Decimal | number | null;
  connectivity: number | null;
  cascade: Prisma.Decimal | number | null;
  k_factor: Prisma.Decimal | number | null;
  base_score: Prisma.Decimal | number | null;
  risk_score: Prisma.Decimal | number | null;
  delta_score: Prisma.Decimal | number | null;
  mitigating_control_id: string | null;
  mitigating_control_code: string | null;
  mitigating_control_name: string | null;
  mitigating_control_description: string | null;
  mitigation_strength: number | null;
  mitigation_level: string | null;
  scenario: string | null;
  source: string | null;
  analysis_notes: string | null;
  has_real_data: boolean;
  is_missing_required_data: boolean;
};

type CatalogRow = {
  id: number;
  code: string;
  name: string;
  description: string | null;
  base_value: Prisma.Decimal | number;
  sort_order: number;
};

type DraftSavedRow = {
  id: string;
  domain_id: string | null;
  risk_id: string;
  element_id: string | null;
  custom_element_name: string | null;
  row_mode: string;
  mitigating_control_id: string | null;
  mitigation_strength: number | null;
  mitigation_level: string | null;
  probability: Prisma.Decimal | number | null;
  impact: Prisma.Decimal | number | null;
  connectivity: number | null;
  cascade: Prisma.Decimal | number | null;
  k_factor: Prisma.Decimal | number | null;
  scenario: string | null;
  source: string | null;
  analysis_notes: string | null;
};

type OptionRow = {
  id: string;
  code: string | null;
  name: string;
};

type ColumnRow = {
  column_name: string;
};

type PutBodyRow = {
  rowId?: string;
  rowMode: RowMode;
  riskId: string;
  elementId?: string | null;
  customElementName?: string | null;
  mitigatingControlId?: string | null;
  probability?: number | null;
  impact?: number | null;
  connectivity?: number | null;
  cascade?: number | null;
  kFactor?: number | null;
  scenario?: string | null;
  source?: string | null;
  analysisNotes?: string | null;
};

type PutBody = {
  rows?: PutBodyRow[];
};

type RiskControlLinkRow = {
  risk_id: string;
  control_id: string;
  mitigation_strength: number | null;
  effect_type: string | null;
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
  const _unusedCascade = cascade;
  const _unusedKFactor = kFactor;
  void _unusedCascade;
  void _unusedKFactor;
  const baseScore = round6(probability * impact);
  const riskScore = round6(baseScore);
  const deltaScore = 0;
  return { baseScore, riskScore, deltaScore };
}

function computeMitigatedScores(probability: number, impact: number, mitigationStrength: number | null | undefined) {
  const inherent = round6(probability * impact);
  const strength = mitigationStrength && mitigationStrength > 0 ? mitigationStrength : 1;
  const residual = round6(inherent / strength);
  const reduction = round6(inherent - residual);
  return { inherent, residual, reduction };
}

function extractScopeSelection(draft: DraftRecord | null): ScopeSelection {
  const selectedReino = draft?.scope_config?.selected_reino_id;
  const selectedReinoId = typeof selectedReino === 'string' && selectedReino.length > 0
    ? selectedReino
    : null;

  const domainIds = draft?.scope_config?.domain_ids;
  if (selectedReinoId) {
    return {
      selectedReinoId,
      domainIds: Array.isArray(domainIds) ? domainIds : []
    };
  }

  const selectedDomain = draft?.scope_config?.selected_domain_id;
  if (typeof selectedDomain === 'string' && selectedDomain.length > 0) {
    return { selectedReinoId, domainIds: [selectedDomain] };
  }

  if (Array.isArray(domainIds) && domainIds.length > 0) {
    return { selectedReinoId, domainIds };
  }

  return { selectedReinoId, domainIds: [] };
}

async function getAuthorizedDraft(draftId: string, tenantId: string): Promise<DraftRecord | null> {
  const draft = await prisma.corpus.assessment_draft.findFirst({
    where: { id: draftId, tenant_id: tenantId },
    select: { id: true, scope_config: true }
  });
  return draft as DraftRecord | null;
}

function mapCatalog(rows: CatalogRow[]): RiskCatalogOption[] {
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    name: row.name,
    description: row.description ?? null,
    baseValue: round4(toNumber(row.base_value)),
    sortOrder: row.sort_order
  }));
}

function isPresentNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

async function getColumns(schema: string, relation: string): Promise<Set<string>> {
  const rows = (await prisma.$queryRaw(Prisma.sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_schema = ${schema}
      AND table_name = ${relation}
  `)) as ColumnRow[];
  return new Set((rows || []).map((row) => row.column_name));
}

async function resolveDomainIds(selection: ScopeSelection): Promise<string[]> {
  if (selection.selectedReinoId) {
    const rows = (await prisma.$queryRaw(Prisma.sql`
      SELECT DISTINCT mrd.domain_id
      FROM graph.map_reino_domain mrd
      WHERE mrd.reino_id = ${selection.selectedReinoId}::uuid
      ORDER BY mrd.domain_id
    `)) as { domain_id: string }[];
    const domainIds = (rows || []).map((row) => row.domain_id).filter(Boolean);
    if (domainIds.length > 0) return domainIds;
  }

  return selection.domainIds;
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

    const selection = extractScopeSelection(draft);
    const selectedDomainIds = await resolveDomainIds(selection);
    if (selectedDomainIds.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar un reino con dominios configurados en el Paso 1 (Acta).' }, { status: 400 });
    }
    const primaryDomainId = selectedDomainIds[0] ?? null;

    const [viewColumns, draftColumns] = await Promise.all([
      getColumns('graph', 'v_risk_analyst'),
      getColumns('graph', 'audit_draft_risk_analysis')
    ]);

    const viewHasDomainId = viewColumns.has('domain_id');
    const viewHasCompletenessFlags = viewColumns.has('has_real_data') && viewColumns.has('is_missing_required_data');

    const baselineRowsRaw = viewHasDomainId
      ? await prisma.$queryRaw(Prisma.sql`
          SELECT
            va.domain_id,
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
            va.base_score,
            va.risk_score,
            va.delta_score,
            va.mitigating_control_id,
            va.mitigating_control_code,
            va.mitigating_control_name,
            COALESCE(mc.description, va.mitigating_rationale, va.mitigating_coverage_notes) AS mitigating_control_description,
            va.mitigation_strength,
            va.mitigation_level,
            va.scenario,
            va.source,
            va.analysis_notes,
            ${
              viewHasCompletenessFlags
                ? Prisma.sql`va.has_real_data`
                : Prisma.sql`(va.probability IS NOT NULL AND va.impact IS NOT NULL AND va.connectivity IS NOT NULL AND va.cascade IS NOT NULL) AS has_real_data`
            },
            ${
              viewHasCompletenessFlags
                ? Prisma.sql`va.is_missing_required_data`
                : Prisma.sql`NOT (va.probability IS NOT NULL AND va.impact IS NOT NULL AND va.connectivity IS NOT NULL AND va.cascade IS NOT NULL) AS is_missing_required_data`
            }
          FROM graph.v_risk_analyst va
          LEFT JOIN graph.control mc
            ON mc.id = va.mitigating_control_id
          WHERE va.domain_id = ANY(${selectedDomainIds}::uuid[])
          ORDER BY va.element_name ASC, va.risk_name ASC
        `)
      : await prisma.$queryRaw(Prisma.sql`
          WITH base_pairs AS (
            SELECT DISTINCT mer.risk_id, mer.element_id
            FROM graph.map_domain_elements_risk mer
            JOIN graph.map_domain_element mde
              ON mde.element_id = mer.element_id
            WHERE mde.domain_id = ANY(${selectedDomainIds}::uuid[])
          )
          SELECT
            mde.domain_id,
            bp.risk_id,
            r.code AS risk_code,
            r.name AS risk_name,
            r.risk_origen,
            bp.element_id,
            de.code AS element_code,
            COALESCE(de.title, de.name, de.code) AS element_name,
            ra.probability,
            ra.impact,
            ra.connectivity,
            ra.cascade,
            COALESCE(ra.k_factor, 1) AS k_factor,
            CASE
              WHEN ra.probability IS NOT NULL AND ra.impact IS NOT NULL
                THEN (ra.probability * ra.impact)::numeric(18,6)
              ELSE NULL
            END AS base_score,
            CASE
              WHEN ra.probability IS NOT NULL AND ra.impact IS NOT NULL AND ra.cascade IS NOT NULL
                THEN ((ra.probability * ra.impact) * (1 + (COALESCE(ra.k_factor, 1) * ra.cascade)))::numeric(18,6)
              ELSE NULL
            END AS risk_score,
            CASE
              WHEN ra.probability IS NOT NULL AND ra.impact IS NOT NULL AND ra.cascade IS NOT NULL
                THEN (((ra.probability * ra.impact) * (1 + (COALESCE(ra.k_factor, 1) * ra.cascade))) - (ra.probability * ra.impact))::numeric(18,6)
              ELSE NULL
            END AS delta_score,
            COALESCE(ra.mitigating_control_id, mrc_best.control_id) AS mitigating_control_id,
            mrc_best.control_code AS mitigating_control_code,
            mrc_best.control_name AS mitigating_control_name,
            mrc_best.control_description AS mitigating_control_description,
            COALESCE(ra.mitigation_strength, mrc_best.mitigation_strength) AS mitigation_strength,
            COALESCE(
              upper(ra.mitigation_level),
              CASE
                WHEN COALESCE(ra.mitigation_strength, mrc_best.mitigation_strength) IS NULL THEN NULL
                WHEN COALESCE(ra.mitigation_strength, mrc_best.mitigation_strength) >= 4 THEN 'TOTAL'
                ELSE 'PARCIAL'
              END
            ) AS mitigation_level,
            ra.scenario,
            ra.source,
            ra.analysis_notes,
            (ra.probability IS NOT NULL AND ra.impact IS NOT NULL AND ra.connectivity IS NOT NULL AND ra.cascade IS NOT NULL) AS has_real_data,
            NOT (ra.probability IS NOT NULL AND ra.impact IS NOT NULL AND ra.connectivity IS NOT NULL AND ra.cascade IS NOT NULL) AS is_missing_required_data
          FROM base_pairs bp
          JOIN graph.risk r
            ON r.id = bp.risk_id
          JOIN graph.domain_elements de
            ON de.id = bp.element_id
          JOIN graph.map_domain_element mde
            ON mde.element_id = bp.element_id
          LEFT JOIN graph.risk_analyst ra
            ON ra.risk_id = bp.risk_id
           AND ra.element_id = bp.element_id
          LEFT JOIN LATERAL (
            SELECT
              mrc.control_id,
              c.code AS control_code,
              c.name AS control_name,
              c.description AS control_description,
              mrc.mitigation_strength
            FROM graph.map_risk_control mrc
            JOIN graph.control c
              ON c.id = mrc.control_id
            WHERE mrc.risk_id = bp.risk_id
            ORDER BY
              mrc.mitigation_strength DESC,
              CASE lower(mrc.effect_type)
                WHEN 'preventive' THEN 1
                WHEN 'detective' THEN 2
                WHEN 'corrective' THEN 3
                ELSE 9
              END,
              c.code
            LIMIT 1
          ) mrc_best ON true
          ORDER BY element_name ASC, risk_name ASC
        `);

    const [probabilityRows, impactRows, elementOptions, controlOptions, riskControlLinksRaw] = await Promise.all([
      prisma.$queryRaw(Prisma.sql`
        SELECT id, code, name, description, base_value, sort_order
        FROM catalogos.corpus_catalog_probability
        WHERE is_active = true
        ORDER BY sort_order ASC, id ASC
      `),
      prisma.$queryRaw(Prisma.sql`
        SELECT id, code, name, description, base_value, sort_order
        FROM catalogos.corpus_catalog_impact
        WHERE is_active = true
        ORDER BY sort_order ASC, id ASC
      `),
      prisma.$queryRaw(Prisma.sql`
        SELECT
          de.id,
          de.code,
          COALESCE(de.title, de.name, de.code) AS name
        FROM graph.domain_elements de
        JOIN graph.map_domain_element mde
          ON mde.element_id = de.id
        WHERE mde.domain_id = ANY(${selectedDomainIds}::uuid[])
          AND de.element_type = 'OBLIGATION'
        ORDER BY name ASC
      `),
      prisma.$queryRaw(Prisma.sql`
        WITH domain_risks AS (
          SELECT DISTINCT mer.risk_id
          FROM graph.map_domain_elements_risk mer
          JOIN graph.map_domain_element mde
            ON mde.element_id = mer.element_id
          WHERE mde.domain_id = ANY(${selectedDomainIds}::uuid[])
        )
        SELECT DISTINCT
          c.id,
          c.code,
          c.name
        FROM graph.control c
        LEFT JOIN graph.map_domain_elements_control mdc
          ON mdc.control_id = c.id
        LEFT JOIN graph.map_domain_element mde
          ON mde.element_id = mdc.element_id
        LEFT JOIN graph.map_risk_control mrc
          ON mrc.control_id = c.id
        LEFT JOIN domain_risks dr
          ON dr.risk_id = mrc.risk_id
        WHERE mde.domain_id = ANY(${selectedDomainIds}::uuid[])
           OR dr.risk_id IS NOT NULL
        ORDER BY c.name ASC
      `),
      prisma.$queryRaw(Prisma.sql`
        SELECT DISTINCT
          mrc.risk_id,
          mrc.control_id,
          mrc.mitigation_strength,
          mrc.effect_type
        FROM graph.map_risk_control mrc
        JOIN graph.map_domain_elements_risk mer
          ON mer.risk_id = mrc.risk_id
        JOIN graph.map_domain_element mde
          ON mde.element_id = mer.element_id
        WHERE mde.domain_id = ANY(${selectedDomainIds}::uuid[])
      `)
    ]);

    const riskOptions = viewHasDomainId
      ? await prisma.$queryRaw(Prisma.sql`
        SELECT DISTINCT
          r.id,
          r.code,
          r.name
        FROM graph.v_risk_analyst va
        JOIN graph.risk r
          ON r.id = va.risk_id
        WHERE va.domain_id = ANY(${selectedDomainIds}::uuid[])
        ORDER BY r.name ASC
      `)
      : await prisma.$queryRaw(Prisma.sql`
        SELECT DISTINCT
          r.id,
          r.code,
          r.name
        FROM graph.map_domain_elements_risk mer
        JOIN graph.map_domain_element mde
          ON mde.element_id = mer.element_id
        JOIN graph.risk r
          ON r.id = mer.risk_id
        WHERE mde.domain_id = ANY(${selectedDomainIds}::uuid[])
        ORDER BY r.name ASC
      `);

    const baselineRows = (baselineRowsRaw || []) as BaselineRow[];

    const hasDraftV2Shape =
      draftColumns.has('id') &&
      draftColumns.has('domain_id') &&
      draftColumns.has('custom_element_name') &&
      draftColumns.has('row_mode');
    const draftHasMitigationColumns =
      draftColumns.has('mitigating_control_id') &&
      draftColumns.has('mitigation_strength') &&
      draftColumns.has('mitigation_level');

    let savedRows: DraftSavedRow[] = [];
    if (hasDraftV2Shape) {
      savedRows = (await prisma.$queryRaw(Prisma.sql`
        SELECT
          ara.id,
          ara.domain_id,
          ara.risk_id,
          ara.element_id,
          ara.custom_element_name,
          ara.row_mode,
          ${
            draftHasMitigationColumns
              ? Prisma.sql`ara.mitigating_control_id`
              : Prisma.sql`NULL::uuid AS mitigating_control_id`
          },
          ${
            draftHasMitigationColumns
              ? Prisma.sql`ara.mitigation_strength`
              : Prisma.sql`NULL::smallint AS mitigation_strength`
          },
          ${
            draftHasMitigationColumns
              ? Prisma.sql`ara.mitigation_level`
              : Prisma.sql`NULL::text AS mitigation_level`
          },
          ara.probability,
          ara.impact,
          ara.connectivity,
          ara.cascade,
          ara.k_factor,
          ara.scenario,
          ara.source,
          ara.analysis_notes
        FROM graph.audit_draft_risk_analysis ara
        WHERE ara.draft_id = ${id}::uuid
          AND (ara.domain_id = ANY(${selectedDomainIds}::uuid[]) OR ara.domain_id IS NULL)
        ORDER BY ara.updated_at DESC, ara.created_at DESC
      `)) as DraftSavedRow[];
    } else {
      savedRows = (await prisma.$queryRaw(Prisma.sql`
        SELECT
          ('legacy:' || ara.risk_id::text || ':' || ara.element_id::text) AS id,
          NULL::uuid AS domain_id,
          ara.risk_id,
          ara.element_id,
          NULL::text AS custom_element_name,
          'SYSTEM'::text AS row_mode,
          NULL::uuid AS mitigating_control_id,
          NULL::smallint AS mitigation_strength,
          NULL::text AS mitigation_level,
          ara.probability,
          ara.impact,
          ara.connectivity,
          ara.cascade,
          ara.k_factor,
          ara.scenario,
          ara.source,
          ara.analysis_notes
        FROM graph.audit_draft_risk_analysis ara
        WHERE ara.draft_id = ${id}::uuid
          AND EXISTS (
            SELECT 1
            FROM graph.map_domain_element mde
            WHERE mde.element_id = ara.element_id
              AND mde.domain_id = ANY(${selectedDomainIds}::uuid[])
          )
      `)) as DraftSavedRow[];
    }

    const probabilityCatalog = mapCatalog((probabilityRows || []) as CatalogRow[]);
    const impactCatalog = mapCatalog((impactRows || []) as CatalogRow[]);
    const elementOptionRows = (elementOptions || []) as OptionRow[];
    const riskOptionRows = (riskOptions || []) as OptionRow[];
    const controlOptionRows = (controlOptions || []) as OptionRow[];
    const riskControlLinks = (riskControlLinksRaw || []) as RiskControlLinkRow[];

    const baselineMap = new Map<string, BaselineRow>();
    baselineRows.forEach((row) => {
      baselineMap.set(`${row.risk_id}::${row.element_id}`, row);
    });

    const riskOptionMap = new Map<string, OptionRow>();
    riskOptionRows.forEach((r) => riskOptionMap.set(r.id, r));
    const elementOptionMap = new Map<string, OptionRow>();
    elementOptionRows.forEach((e) => elementOptionMap.set(e.id, e));
    const controlOptionMap = new Map<string, OptionRow>();
    controlOptionRows.forEach((c) => controlOptionMap.set(c.id, c));
    const riskControlStrengthMap = new Map<string, number>();
    const bestRiskControlMap = new Map<string, RiskControlLinkRow>();
    riskControlLinks.forEach((link) => {
      const strength = link.mitigation_strength == null ? 1 : Math.max(1, Math.round(toNumber(link.mitigation_strength, 1)));
      riskControlStrengthMap.set(`${link.risk_id}::${link.control_id}`, strength);
      const current = bestRiskControlMap.get(link.risk_id);
      const currentStrength = current?.mitigation_strength == null ? 0 : Math.round(toNumber(current.mitigation_strength, 0));
      if (!current || strength > currentStrength) {
        bestRiskControlMap.set(link.risk_id, { ...link, mitigation_strength: strength });
      }
    });

    const rows: RiskAnalysisRow[] = [];

    if (savedRows.length > 0) {
      for (const saved of savedRows) {
        const rowMode = (String(saved.row_mode).toUpperCase() === 'CUSTOM' ? 'CUSTOM' : 'SYSTEM') as RowMode;

        if (rowMode === 'CUSTOM') {
          const probability = saved.probability == null ? null : round4(toNumber(saved.probability));
          const impact = saved.impact == null ? null : round4(toNumber(saved.impact));
          const connectivity = saved.connectivity == null ? null : Math.round(toNumber(saved.connectivity));
          const cascade = saved.cascade == null ? null : round4(toNumber(saved.cascade));
          const kFactor = saved.k_factor == null ? 1 : round4(toNumber(saved.k_factor, 1));
          const fallbackControl = bestRiskControlMap.get(saved.risk_id);
          const selectedControlId = saved.mitigating_control_id ?? fallbackControl?.control_id ?? null;
          const selectedControlMeta = selectedControlId ? controlOptionMap.get(selectedControlId) : null;
          const selectedStrength = selectedControlId
            ? (saved.mitigation_strength == null
              ? (riskControlStrengthMap.get(`${saved.risk_id}::${selectedControlId}`) ?? 1)
              : Math.max(1, Math.round(toNumber(saved.mitigation_strength, 1))))
            : null;
          const selectedLevel = selectedStrength == null
            ? null
            : ((saved.mitigation_level || (selectedStrength >= 4 ? 'TOTAL' : 'PARCIAL')) as string).toUpperCase();
          const hasRealData =
            isPresentNumber(probability) &&
            isPresentNumber(impact) &&
            isPresentNumber(connectivity) &&
            isPresentNumber(cascade);

          let baseScore: number | null = null;
          let riskScore: number | null = null;
          let deltaScore: number | null = null;
          if (hasRealData) {
            const scores = computeMitigatedScores(probability!, impact!, selectedStrength);
            baseScore = scores.inherent;
            riskScore = scores.residual;
            deltaScore = scores.reduction;
          }

          const riskMeta = riskOptionMap.get(saved.risk_id);
          rows.push({
            rowId: saved.id,
            rowMode: 'CUSTOM',
            domainId: primaryDomainId ?? '',
            riskId: saved.risk_id,
            riskCode: riskMeta?.code ?? null,
            riskName: riskMeta?.name ?? null,
            riskOrigen: null,
            elementId: null,
            elementCode: null,
            elementName: saved.custom_element_name ?? 'Elemento nuevo',
            customElementName: saved.custom_element_name,
            probability,
            impact,
            connectivity,
            cascade,
            kFactor,
            baseScore,
            riskScore,
            deltaScore,
            mitigatingControlId: selectedControlId,
            mitigatingControlCode: selectedControlMeta?.code ?? null,
            mitigatingControlName: selectedControlMeta?.name ?? null,
            mitigatingControlDescription: null,
            mitigationStrength: selectedStrength,
            mitigationLevel: selectedLevel,
            scenario: saved.scenario ?? null,
            source: saved.source ?? null,
            analysisNotes: saved.analysis_notes ?? null,
            hasRealData,
            isMissingRequiredData: !hasRealData,
            isOverridden: true
          });
          continue;
        }

        const key = `${saved.risk_id}::${saved.element_id}`;
        const baseline = saved.element_id ? baselineMap.get(key) : null;

        if (!baseline) {
          const riskMeta = riskOptionMap.get(saved.risk_id);
          const elementMeta = saved.element_id ? elementOptionMap.get(saved.element_id) : null;
          rows.push({
            rowId: saved.id,
            rowMode: 'SYSTEM',
            domainId: primaryDomainId ?? '',
            riskId: saved.risk_id,
            riskCode: riskMeta?.code ?? null,
            riskName: riskMeta?.name ?? null,
            riskOrigen: null,
            elementId: saved.element_id,
            elementCode: elementMeta?.code ?? null,
            elementName: elementMeta?.name ?? null,
            customElementName: null,
            probability: null,
            impact: null,
            connectivity: null,
            cascade: null,
            kFactor: 1,
            baseScore: null,
            riskScore: null,
            deltaScore: null,
            mitigatingControlId: null,
            mitigatingControlCode: null,
            mitigatingControlName: null,
            mitigatingControlDescription: null,
            mitigationStrength: null,
            mitigationLevel: null,
            scenario: saved.scenario ?? null,
            source: saved.source ?? null,
            analysisNotes: saved.analysis_notes ?? null,
          hasRealData: false,
            isMissingRequiredData: true,
            isOverridden: true
          });
          continue;
        }

        rows.push({
          rowId: saved.id,
          rowMode: 'SYSTEM',
          domainId: baseline.domain_id ?? primaryDomainId ?? '',
          riskId: baseline.risk_id,
          riskCode: baseline.risk_code,
          riskName: baseline.risk_name,
          riskOrigen: baseline.risk_origen,
          elementId: baseline.element_id,
          elementCode: baseline.element_code,
          elementName: baseline.element_name,
          customElementName: null,
          probability: saved.probability == null
            ? (baseline.probability == null ? null : round4(toNumber(baseline.probability)))
            : round4(toNumber(saved.probability)),
          impact: saved.impact == null
            ? (baseline.impact == null ? null : round4(toNumber(baseline.impact)))
            : round4(toNumber(saved.impact)),
          connectivity: saved.connectivity == null
            ? (baseline.connectivity == null ? null : Math.round(toNumber(baseline.connectivity)))
            : Math.round(toNumber(saved.connectivity)),
          cascade: saved.cascade == null
            ? (baseline.cascade == null ? null : round4(toNumber(baseline.cascade)))
            : round4(toNumber(saved.cascade)),
          kFactor: saved.k_factor == null
            ? (baseline.k_factor == null ? 1 : round4(toNumber(baseline.k_factor, 1)))
            : round4(toNumber(saved.k_factor, 1)),
          baseScore: (() => {
            const p = saved.probability == null
              ? (baseline.probability == null ? null : round4(toNumber(baseline.probability)))
              : round4(toNumber(saved.probability));
            const i = saved.impact == null
              ? (baseline.impact == null ? null : round4(toNumber(baseline.impact)))
              : round4(toNumber(saved.impact));
            const selectedControlId = saved.mitigating_control_id ?? baseline.mitigating_control_id;
            const selectedStrength = selectedControlId
              ? (saved.mitigation_strength == null
                ? (riskControlStrengthMap.get(`${baseline.risk_id}::${selectedControlId}`) ?? (baseline.mitigation_strength == null ? 1 : Math.round(toNumber(baseline.mitigation_strength, 1))))
                : Math.max(1, Math.round(toNumber(saved.mitigation_strength, 1))))
              : (baseline.mitigation_strength == null ? 1 : Math.round(toNumber(baseline.mitigation_strength, 1)));
            if (!isPresentNumber(p) || !isPresentNumber(i)) return null;
            return computeMitigatedScores(p, i, selectedStrength).inherent;
          })(),
          riskScore: (() => {
            const p = saved.probability == null
              ? (baseline.probability == null ? null : round4(toNumber(baseline.probability)))
              : round4(toNumber(saved.probability));
            const i = saved.impact == null
              ? (baseline.impact == null ? null : round4(toNumber(baseline.impact)))
              : round4(toNumber(saved.impact));
            const selectedControlId = saved.mitigating_control_id ?? baseline.mitigating_control_id;
            const selectedStrength = selectedControlId
              ? (saved.mitigation_strength == null
                ? (riskControlStrengthMap.get(`${baseline.risk_id}::${selectedControlId}`) ?? (baseline.mitigation_strength == null ? 1 : Math.round(toNumber(baseline.mitigation_strength, 1))))
                : Math.max(1, Math.round(toNumber(saved.mitigation_strength, 1))))
              : (baseline.mitigation_strength == null ? 1 : Math.round(toNumber(baseline.mitigation_strength, 1)));
            if (!isPresentNumber(p) || !isPresentNumber(i)) return null;
            return computeMitigatedScores(p, i, selectedStrength).residual;
          })(),
          deltaScore: (() => {
            const p = saved.probability == null
              ? (baseline.probability == null ? null : round4(toNumber(baseline.probability)))
              : round4(toNumber(saved.probability));
            const i = saved.impact == null
              ? (baseline.impact == null ? null : round4(toNumber(baseline.impact)))
              : round4(toNumber(saved.impact));
            const selectedControlId = saved.mitigating_control_id ?? baseline.mitigating_control_id;
            const selectedStrength = selectedControlId
              ? (saved.mitigation_strength == null
                ? (riskControlStrengthMap.get(`${baseline.risk_id}::${selectedControlId}`) ?? (baseline.mitigation_strength == null ? 1 : Math.round(toNumber(baseline.mitigation_strength, 1))))
                : Math.max(1, Math.round(toNumber(saved.mitigation_strength, 1))))
              : (baseline.mitigation_strength == null ? 1 : Math.round(toNumber(baseline.mitigation_strength, 1)));
            if (!isPresentNumber(p) || !isPresentNumber(i)) return null;
            return computeMitigatedScores(p, i, selectedStrength).reduction;
          })(),
          mitigatingControlId: (() => saved.mitigating_control_id ?? baseline.mitigating_control_id)(),
          mitigatingControlCode: (() => {
            const selectedControlId = saved.mitigating_control_id ?? baseline.mitigating_control_id;
            if (!selectedControlId) return null;
            return controlOptionMap.get(selectedControlId)?.code ?? baseline.mitigating_control_code;
          })(),
          mitigatingControlName: (() => {
            const selectedControlId = saved.mitigating_control_id ?? baseline.mitigating_control_id;
            if (!selectedControlId) return null;
            return controlOptionMap.get(selectedControlId)?.name ?? baseline.mitigating_control_name;
          })(),
          mitigatingControlDescription: baseline.mitigating_control_description,
          mitigationStrength: (() => {
            const selectedControlId = saved.mitigating_control_id ?? baseline.mitigating_control_id;
            if (!selectedControlId) return null;
            return saved.mitigation_strength == null
              ? (riskControlStrengthMap.get(`${baseline.risk_id}::${selectedControlId}`) ?? (baseline.mitigation_strength == null ? 1 : Math.round(toNumber(baseline.mitigation_strength))))
              : Math.max(1, Math.round(toNumber(saved.mitigation_strength, 1)));
          })(),
          mitigationLevel: (() => {
            const strength = saved.mitigation_strength == null
              ? (baseline.mitigation_strength == null ? null : Math.round(toNumber(baseline.mitigation_strength)))
              : Math.max(1, Math.round(toNumber(saved.mitigation_strength, 1)));
            if (saved.mitigation_level) return String(saved.mitigation_level).toUpperCase();
            if (strength == null) return baseline.mitigation_level;
            return strength >= 4 ? 'TOTAL' : 'PARCIAL';
          })(),
          scenario: saved.scenario ?? baseline.scenario ?? null,
          source: saved.source ?? baseline.source ?? null,
          analysisNotes: saved.analysis_notes ?? baseline.analysis_notes ?? null,
          hasRealData: true,
          isMissingRequiredData: false,
          isOverridden: true
        });
      }
    }

    return NextResponse.json({
      domainId: primaryDomainId,
      reinoId: selection.selectedReinoId,
      rows,
      count: rows.length,
      probabilityCatalog,
      impactCatalog,
      elementOptions: elementOptionRows,
      riskOptions: riskOptionRows,
      controlOptions: controlOptionRows,
      riskControlLinks: riskControlLinks.map((link) => ({
        riskId: link.risk_id,
        controlId: link.control_id,
        mitigationStrength: link.mitigation_strength == null ? null : Math.max(1, Math.round(toNumber(link.mitigation_strength, 1))),
        effectType: link.effect_type
      })),
      systemPairs: baselineRows.map((row) => ({
        domainId: row.domain_id,
        riskId: row.risk_id,
        elementId: row.element_id,
        probability: row.probability == null ? null : round4(toNumber(row.probability)),
        impact: row.impact == null ? null : round4(toNumber(row.impact)),
        connectivity: row.connectivity == null ? null : Math.round(toNumber(row.connectivity)),
        cascade: row.cascade == null ? null : round4(toNumber(row.cascade)),
        kFactor: row.k_factor == null ? 1 : round4(toNumber(row.k_factor, 1)),
        baseScore: row.probability == null || row.impact == null
          ? null
          : computeMitigatedScores(round4(toNumber(row.probability)), round4(toNumber(row.impact)), row.mitigation_strength).inherent,
        riskScore: row.probability == null || row.impact == null
          ? null
          : computeMitigatedScores(round4(toNumber(row.probability)), round4(toNumber(row.impact)), row.mitigation_strength).residual,
        deltaScore: row.probability == null || row.impact == null
          ? null
          : computeMitigatedScores(round4(toNumber(row.probability)), round4(toNumber(row.impact)), row.mitigation_strength).reduction,
        mitigatingControlId: row.mitigating_control_id,
        mitigatingControlCode: row.mitigating_control_code,
        mitigatingControlName: row.mitigating_control_name,
        mitigatingControlDescription: row.mitigating_control_description,
        mitigationStrength: row.mitigation_strength == null ? null : Math.round(toNumber(row.mitigation_strength)),
        mitigationLevel: row.mitigation_level,
        hasRealData: Boolean(row.has_real_data),
        isMissingRequiredData: Boolean(row.is_missing_required_data)
      }))
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

    const selection = extractScopeSelection(draft);
    const selectedDomainIds = await resolveDomainIds(selection);
    if (selectedDomainIds.length === 0) {
      return NextResponse.json({ error: 'Debe seleccionar un reino con dominios configurados en el Paso 1 (Acta).' }, { status: 400 });
    }

    const body = (await request.json()) as PutBody;
    const rows = Array.isArray(body?.rows) ? body.rows : [];

    const [viewColumns, draftColumns] = await Promise.all([
      getColumns('graph', 'v_risk_analyst'),
      getColumns('graph', 'audit_draft_risk_analysis')
    ]);

    const viewHasDomainId = viewColumns.has('domain_id');
    const viewHasCompletenessFlags = viewColumns.has('has_real_data') && viewColumns.has('is_missing_required_data');

    const baselineRowsRaw = viewHasDomainId
      ? await prisma.$queryRaw(Prisma.sql`
          SELECT
            va.domain_id,
            va.risk_id,
            va.element_id,
            va.probability,
            va.impact,
            va.connectivity,
            va.cascade,
            va.k_factor,
            va.scenario,
            va.source,
            va.analysis_notes,
            ${
              viewHasCompletenessFlags
                ? Prisma.sql`va.has_real_data`
                : Prisma.sql`(va.probability IS NOT NULL AND va.impact IS NOT NULL AND va.connectivity IS NOT NULL AND va.cascade IS NOT NULL) AS has_real_data`
            },
            ${
              viewHasCompletenessFlags
                ? Prisma.sql`va.is_missing_required_data`
                : Prisma.sql`NOT (va.probability IS NOT NULL AND va.impact IS NOT NULL AND va.connectivity IS NOT NULL AND va.cascade IS NOT NULL) AS is_missing_required_data`
            }
          FROM graph.v_risk_analyst va
          WHERE va.domain_id = ANY(${selectedDomainIds}::uuid[])
        `)
      : await prisma.$queryRaw(Prisma.sql`
          WITH base_pairs AS (
            SELECT DISTINCT mer.risk_id, mer.element_id
            FROM graph.map_domain_elements_risk mer
            JOIN graph.map_domain_element mde
              ON mde.element_id = mer.element_id
            WHERE mde.domain_id = ANY(${selectedDomainIds}::uuid[])
          )
          SELECT
            mde.domain_id,
            bp.risk_id,
            bp.element_id,
            ra.probability,
            ra.impact,
            ra.connectivity,
            ra.cascade,
            COALESCE(ra.k_factor, 1) AS k_factor,
            ra.scenario,
            ra.source,
            ra.analysis_notes,
            (ra.probability IS NOT NULL AND ra.impact IS NOT NULL AND ra.connectivity IS NOT NULL AND ra.cascade IS NOT NULL) AS has_real_data,
            NOT (ra.probability IS NOT NULL AND ra.impact IS NOT NULL AND ra.connectivity IS NOT NULL AND ra.cascade IS NOT NULL) AS is_missing_required_data
          FROM base_pairs bp
          JOIN graph.map_domain_element mde
            ON mde.element_id = bp.element_id
          LEFT JOIN graph.risk_analyst ra
            ON ra.risk_id = bp.risk_id
           AND ra.element_id = bp.element_id
        `);

    const [probabilityRowsRaw, impactRowsRaw, controlOptionsRaw, riskControlLinksRaw] = await Promise.all([
      prisma.$queryRaw(Prisma.sql`
        SELECT id, code, name, description, base_value, sort_order
        FROM catalogos.corpus_catalog_probability
        WHERE is_active = true
      `),
      prisma.$queryRaw(Prisma.sql`
        SELECT id, code, name, description, base_value, sort_order
        FROM catalogos.corpus_catalog_impact
        WHERE is_active = true
      `),
      prisma.$queryRaw(Prisma.sql`
        WITH domain_risks AS (
          SELECT DISTINCT mer.risk_id
          FROM graph.map_domain_elements_risk mer
          JOIN graph.map_domain_element mde
            ON mde.element_id = mer.element_id
          WHERE mde.domain_id = ANY(${selectedDomainIds}::uuid[])
        )
        SELECT DISTINCT
          c.id,
          c.code,
          c.name
        FROM graph.control c
        LEFT JOIN graph.map_domain_elements_control mdc
          ON mdc.control_id = c.id
        LEFT JOIN graph.map_domain_element mde
          ON mde.element_id = mdc.element_id
        LEFT JOIN graph.map_risk_control mrc
          ON mrc.control_id = c.id
        LEFT JOIN domain_risks dr
          ON dr.risk_id = mrc.risk_id
        WHERE mde.domain_id = ANY(${selectedDomainIds}::uuid[])
           OR dr.risk_id IS NOT NULL
      `),
      prisma.$queryRaw(Prisma.sql`
        SELECT DISTINCT
          mrc.risk_id,
          mrc.control_id,
          mrc.mitigation_strength,
          mrc.effect_type
        FROM graph.map_risk_control mrc
        JOIN graph.map_domain_elements_risk mer
          ON mer.risk_id = mrc.risk_id
        JOIN graph.map_domain_element mde
          ON mde.element_id = mer.element_id
        WHERE mde.domain_id = ANY(${selectedDomainIds}::uuid[])
      `)
    ]);

    const riskOptionsRaw = viewHasDomainId
      ? await prisma.$queryRaw(Prisma.sql`
          SELECT DISTINCT va.risk_id AS id
          FROM graph.v_risk_analyst va
          WHERE va.domain_id = ANY(${selectedDomainIds}::uuid[])
        `)
      : await prisma.$queryRaw(Prisma.sql`
          SELECT DISTINCT mer.risk_id AS id
          FROM graph.map_domain_elements_risk mer
          JOIN graph.map_domain_element mde
            ON mde.element_id = mer.element_id
          WHERE mde.domain_id = ANY(${selectedDomainIds}::uuid[])
        `);

    const baselineRows = (baselineRowsRaw || []) as BaselineRow[];
    const probabilityRows = mapCatalog((probabilityRowsRaw || []) as CatalogRow[]);
    const impactRows = mapCatalog((impactRowsRaw || []) as CatalogRow[]);
    const riskRows = (riskOptionsRaw || []) as { id: string }[];
    const controlRows = (controlOptionsRaw || []) as OptionRow[];
    const riskControlLinks = (riskControlLinksRaw || []) as RiskControlLinkRow[];

    const probabilitySet = new Set(probabilityRows.map((row) => row.baseValue));
    const impactSet = new Set(impactRows.map((row) => row.baseValue));
    const riskSet = new Set(riskRows.map((row) => row.id));
    const controlSet = new Set(controlRows.map((row) => row.id));
    const riskControlStrengthMap = new Map<string, number>();
    riskControlLinks.forEach((link) => {
      const strength = link.mitigation_strength == null ? 1 : Math.max(1, Math.round(toNumber(link.mitigation_strength, 1)));
      riskControlStrengthMap.set(`${link.risk_id}::${link.control_id}`, strength);
    });

    const baselineByPair = new Map<string, BaselineRow>();
    baselineRows.forEach((row) => {
      baselineByPair.set(`${row.risk_id}::${row.element_id}`, row);
    });

    const validatedRows: Array<{
      rowMode: RowMode;
      domainId: string | null;
      riskId: string;
      elementId: string | null;
      customElementName: string | null;
      mitigatingControlId: string | null;
      mitigationStrength: number | null;
      mitigationLevel: string | null;
      probability: number;
      impact: number;
      connectivity: number;
      cascade: number;
      kFactor: number;
      scenario: string | null;
      source: string | null;
      analysisNotes: string | null;
    }> = [];

    const duplicateGuard = new Set<string>();

    for (const row of rows) {
      const rowMode: RowMode = row.rowMode === 'CUSTOM' ? 'CUSTOM' : 'SYSTEM';
      const riskId = String(row.riskId || '').trim();
      if (!riskId || !riskSet.has(riskId)) {
        return NextResponse.json({ error: 'Riesgo invalido para el dominio seleccionado.' }, { status: 400 });
      }

      if (rowMode === 'SYSTEM') {
        const elementId = String(row.elementId || '').trim();
        if (!elementId) {
          return NextResponse.json({ error: 'Elemento requerido para filas del sistema.' }, { status: 400 });
        }

        const baseline = baselineByPair.get(`${riskId}::${elementId}`);
        if (!baseline) {
          return NextResponse.json({ error: 'La combinacion riesgo-elemento no pertenece al dominio seleccionado.' }, { status: 400 });
        }

        const probability = round4(toNumber(row.probability, Number.NaN));
        const impact = round4(toNumber(row.impact, Number.NaN));
        const connectivity = Math.round(toNumber(row.connectivity, baseline.connectivity == null ? 1 : toNumber(baseline.connectivity)));
        const cascade = round4(toNumber(row.cascade, baseline.cascade == null ? 0 : toNumber(baseline.cascade)));
        const kFactor = round4(Math.max(0, toNumber(row.kFactor, 1)));
        const requestedControlId = row.mitigatingControlId ? String(row.mitigatingControlId).trim() : '';
        const mitigatingControlId = requestedControlId || baseline.mitigating_control_id || null;

        if (!Number.isFinite(probability) || !probabilitySet.has(probability)) {
          return NextResponse.json({ error: 'Probabilidad invalida para fila SYSTEM.' }, { status: 400 });
        }
        if (!Number.isFinite(impact) || !impactSet.has(impact)) {
          return NextResponse.json({ error: 'Impacto invalido para fila SYSTEM.' }, { status: 400 });
        }
        if (mitigatingControlId && !controlSet.has(mitigatingControlId)) {
          return NextResponse.json({ error: 'Control mitigante invalido para el dominio seleccionado.' }, { status: 400 });
        }
        const safeConnectivity = Number.isFinite(connectivity) ? clamp(connectivity, 1, 5) : 1;
        const safeCascade = Number.isFinite(cascade) ? clamp(cascade, 0, 1) : 0;
        const mitigationStrength = mitigatingControlId
          ? (riskControlStrengthMap.get(`${riskId}::${mitigatingControlId}`) ?? 1)
          : null;
        const mitigationLevel = mitigationStrength == null ? null : (mitigationStrength >= 4 ? 'TOTAL' : 'PARCIAL');

        const dedupeKey = `SYSTEM::${riskId}::${elementId}`;
        if (duplicateGuard.has(dedupeKey)) {
          return NextResponse.json({ error: 'Hay filas duplicadas para el mismo riesgo-elemento.' }, { status: 400 });
        }
        duplicateGuard.add(dedupeKey);

        validatedRows.push({
          rowMode: 'SYSTEM',
          domainId: baseline.domain_id,
          riskId,
          elementId,
          customElementName: null,
          mitigatingControlId,
          mitigationStrength,
          mitigationLevel,
          probability,
          impact,
          connectivity: safeConnectivity,
          cascade: safeCascade,
          kFactor,
          scenario: row.scenario?.trim() ?? baseline.scenario ?? null,
          source: row.source?.trim() ?? baseline.source ?? null,
          analysisNotes: row.analysisNotes?.trim() ?? baseline.analysis_notes ?? null
        });
        continue;
      }

      const customElementName = String(row.customElementName || '').trim();
      if (!customElementName) {
        return NextResponse.json({ error: 'Nombre de elemento nuevo requerido para filas CUSTOM.' }, { status: 400 });
      }

      const probability = round4(toNumber(row.probability, Number.NaN));
      const impact = round4(toNumber(row.impact, Number.NaN));
      const connectivity = Math.round(toNumber(row.connectivity, 1));
      const cascade = round4(toNumber(row.cascade, 0));
      const kFactor = round4(Math.max(0, toNumber(row.kFactor, 1)));
      const requestedControlId = row.mitigatingControlId ? String(row.mitigatingControlId).trim() : '';
      const mitigatingControlId = requestedControlId || null;

      if (!Number.isFinite(probability) || !probabilitySet.has(probability)) {
        return NextResponse.json({ error: 'Probabilidad invalida para fila CUSTOM.' }, { status: 400 });
      }
      if (!Number.isFinite(impact) || !impactSet.has(impact)) {
        return NextResponse.json({ error: 'Impacto invalido para fila CUSTOM.' }, { status: 400 });
      }
      if (mitigatingControlId && !controlSet.has(mitigatingControlId)) {
        return NextResponse.json({ error: 'Control mitigante invalido para fila CUSTOM.' }, { status: 400 });
      }
      const safeConnectivity = Number.isFinite(connectivity) ? clamp(connectivity, 1, 5) : 1;
      const safeCascade = Number.isFinite(cascade) ? clamp(cascade, 0, 1) : 0;
      const mitigationStrength = mitigatingControlId
        ? (riskControlStrengthMap.get(`${riskId}::${mitigatingControlId}`) ?? 1)
        : null;
      const mitigationLevel = mitigationStrength == null ? null : (mitigationStrength >= 4 ? 'TOTAL' : 'PARCIAL');

      const dedupeKey = `CUSTOM::${riskId}::${customElementName.toLowerCase()}`;
      if (duplicateGuard.has(dedupeKey)) {
        return NextResponse.json({ error: 'Hay filas CUSTOM duplicadas para el mismo riesgo/elemento.' }, { status: 400 });
      }
      duplicateGuard.add(dedupeKey);

        validatedRows.push({
          rowMode: 'CUSTOM',
          domainId: null,
          riskId,
          elementId: null,
        customElementName,
        mitigatingControlId,
        mitigationStrength,
        mitigationLevel,
        probability,
        impact,
        connectivity: safeConnectivity,
        cascade: safeCascade,
        kFactor,
        scenario: row.scenario?.trim() || null,
        source: row.source?.trim() || null,
        analysisNotes: row.analysisNotes?.trim() || null
      });
    }

    const hasDraftV2Shape =
      draftColumns.has('id') &&
      draftColumns.has('domain_id') &&
      draftColumns.has('custom_element_name') &&
      draftColumns.has('row_mode');
    const draftHasMitigationColumns =
      draftColumns.has('mitigating_control_id') &&
      draftColumns.has('mitigation_strength') &&
      draftColumns.has('mitigation_level');

    await prisma.$executeRaw`
        DELETE FROM graph.audit_draft_risk_analysis
        WHERE draft_id = ${id}::uuid
      `;

    if (validatedRows.length > 0) {
      if (!hasDraftV2Shape && validatedRows.some((row) => row.rowMode === 'CUSTOM')) {
        return NextResponse.json(
          { error: 'La base actual no soporta elementos CUSTOM en borrador de riesgo. Ejecuta la migracion de graph.audit_draft_risk_analysis.' },
          { status: 400 }
        );
      }

      await prisma.$transaction(
        validatedRows.map((row) => {
          const elementId = row.elementId;
          if (hasDraftV2Shape) {
            return prisma.$executeRaw`
              INSERT INTO graph.audit_draft_risk_analysis (
                draft_id,
                domain_id,
                risk_id,
                element_id,
                custom_element_name,
                row_mode,
                probability,
                impact,
                connectivity,
                cascade,
                k_factor,
                ${draftHasMitigationColumns ? Prisma.sql`mitigating_control_id,` : Prisma.sql``}
                ${draftHasMitigationColumns ? Prisma.sql`mitigation_strength,` : Prisma.sql``}
                ${draftHasMitigationColumns ? Prisma.sql`mitigation_level,` : Prisma.sql``}
                analysis_notes,
                source,
                scenario,
                updated_at
              )
              VALUES (
                ${id}::uuid,
                ${row.domainId}::uuid,
                ${row.riskId}::uuid,
                ${elementId}::uuid,
                ${row.customElementName},
                ${row.rowMode},
                ${row.probability},
                ${row.impact},
                ${row.connectivity},
                ${row.cascade},
                ${row.kFactor},
                ${draftHasMitigationColumns ? Prisma.sql`${row.mitigatingControlId}::uuid,` : Prisma.sql``}
                ${draftHasMitigationColumns ? Prisma.sql`${row.mitigationStrength},` : Prisma.sql``}
                ${draftHasMitigationColumns ? Prisma.sql`${row.mitigationLevel},` : Prisma.sql``}
                ${row.analysisNotes},
                ${row.source},
                ${row.scenario},
                now()
              )
            `;
          }
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
              ${elementId}::uuid,
              ${row.probability},
              ${row.impact},
              ${row.connectivity},
              ${row.cascade},
              ${row.kFactor},
              ${row.analysisNotes},
              ${row.source},
              ${row.scenario},
              now()
            )
          `;
        })
      );
    }

    return NextResponse.json({ ok: true, count: validatedRows.length, domainIds: selectedDomainIds, reinoId: selection.selectedReinoId ?? null });
  } catch (error) {
    console.error('Error saving risk analysis draft rows:', error);
    return NextResponse.json({ error: 'Failed to save risk analysis rows' }, { status: 500 });
  }
}
