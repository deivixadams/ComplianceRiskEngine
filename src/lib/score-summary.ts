import { Prisma, PrismaClient } from '@prisma/client';

type DimensionStatus = 'cumple' | 'parcial' | 'no_cumple';

const DEFAULT_WF = 0.14;
const DEFAULT_WO = 0.26;
const DEFAULT_ALPHA = 0.35;
const DEFAULT_BETA = 0.1;
const DEFAULT_GAMMA = 0.06;

function toNumber(value: Prisma.Decimal | number | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp01(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function normalizeStatus(value: unknown): DimensionStatus | null {
  if (!value) return null;
  const text = String(value).toLowerCase().trim();
  if (text.includes('no')) return 'no_cumple';
  if (text.includes('parcial')) return 'parcial';
  if (text.includes('cumple')) return 'cumple';
  return null;
}

function statusToValue(status: DimensionStatus | null): number | null {
  if (!status) return null;
  if (status === 'cumple') return 1;
  if (status === 'parcial') return 0.5;
  return 0;
}

type SummaryControlItem = {
  control_id: string;
  code: string;
  name: string;
  required_test: boolean | null;
  status: DimensionStatus;
  effectiveness: number;
};

type SummaryPayload = {
  runId: string;
  isIncomplete: boolean;
  evaluatedCount: number;
  totalCount: number;
  parameters: {
    profile: { id: string; code: string; name: string | null } | null;
    values: Array<{ code: string; name: string | null; numeric_value: number | null }>;
  };
  controls: {
    evaluated: SummaryControlItem[];
    passed: SummaryControlItem[];
    partial: SummaryControlItem[];
    failed: Array<
      SummaryControlItem & {
        risks: Array<{ control_id: string; risk_id: string; risk_code: string; risk_name: string }>;
      }
    >;
  };
  control_scores: Array<{
    control_id: string;
    control_code: string;
    control_name: string;
    effectiveness: number;
  }>;
  score: {
    final_score: number;
    base_exposure: number;
    concentration_index_h: number;
    concentration_factor: number;
    concentrated_exposure: number;
    propagation_exposure: number;
    final_exposure: number;
  };
  debug: {
    gamma: number;
    trigger: number;
    uncontrolled_obligations: Array<{ code: string; exposure: number }>;
  };
};

export type ScoreSummaryComputation = {
  payload: SummaryPayload;
  controlEffectiveness: Record<string, number>;
  obligationEffectiveness: Record<string, number>;
};

function computeControlFromEvaluation(params: {
  evaluation: any;
  requireOperation: boolean;
  wF: number;
  wO: number;
}): SummaryControlItem | null {
  const evaluation = params.evaluation?.dimensions;
  const existencia = normalizeStatus(evaluation?.existencia);
  const formalizacion = normalizeStatus(evaluation?.formalizacion);
  const operacion = normalizeStatus(evaluation?.operacion);

  const requiredStatuses = params.requireOperation
    ? [existencia, formalizacion, operacion]
    : [existencia, formalizacion];

  if (requiredStatuses.some((status) => status === null)) {
    return null;
  }

  const E = statusToValue(existencia) ?? 0;
  const F = statusToValue(formalizacion) ?? 0;
  const O = params.requireOperation ? statusToValue(operacion) ?? 0 : 1;

  let effectiveness = 0;
  if (E === 0) {
    effectiveness = 0;
  } else {
    const numer = params.requireOperation
      ? params.wF * F + params.wO * O
      : params.wF * F;
    const denom = params.requireOperation
      ? params.wF + params.wO
      : params.wF;
    effectiveness = clamp01(denom > 0 ? E * numer / denom : E * ((F + O) / 2));
  }

  const hasNo = requiredStatuses.some((status) => status === 'no_cumple');
  const hasPartial = requiredStatuses.some((status) => status === 'parcial');
  const status = (hasNo ? 'no_cumple' : hasPartial ? 'parcial' : 'cumple') as DimensionStatus;

  return {
    control_id: '',
    code: '',
    name: '',
    required_test: params.requireOperation,
    status,
    effectiveness,
  };
}

export async function buildScoreSummary(
  prisma: PrismaClient,
  runId: string,
  options?: { persistControlScores?: boolean }
): Promise<ScoreSummaryComputation> {
  const run = await prisma.run_draft.findUnique({
    where: { id: runId },
    select: { id: true, framework_version_id: true },
  });

  if (!run) {
    throw new Error('Run not found');
  }

  const profileRows = (await prisma.$queryRaw(Prisma.sql`
    SELECT id, code, name
    FROM params.profile
    WHERE is_active = true
    LIMIT 1
  `)) as Array<{ id: string; code: string; name: string | null }>;
  const profile = profileRows[0] || null;

  const parameterRows = profile
    ? ((await prisma.$queryRaw(Prisma.sql`
        SELECT pd.code, pd.name, ppv.numeric_value
        FROM params.profile_parameter_value ppv
        JOIN params.parameter_definition pd
          ON pd.id = ppv.parameter_definition_id
        WHERE ppv.profile_id = ${profile.id}::uuid
        ORDER BY pd.sort_order NULLS LAST, pd.code
      `)) as Array<{ code: string; name: string | null; numeric_value: number | null }>)
    : [];

  const paramMap = new Map<string, number>();
  parameterRows.forEach((row) => {
    const value = toNumber(row.numeric_value);
    if (value !== null) {
      paramMap.set(String(row.code).toLowerCase(), value);
    }
  });

  const wF = paramMap.get('w_f') ?? DEFAULT_WF;
  const wO = paramMap.get('w_o') ?? DEFAULT_WO;
  const alpha = paramMap.get('alpha') ?? DEFAULT_ALPHA;
  const beta = paramMap.get('beta') ?? DEFAULT_BETA;
  const gamma = DEFAULT_GAMMA;
  const trigger =
    paramMap.get('t_trigger') ??
    paramMap.get('trigger') ??
    paramMap.get('t_trigger_value') ??
    0;

  const controls = (await prisma.$queryRaw(Prisma.sql`
    SELECT
      rcd.control_id,
      c.code,
      c.name,
      c.required_test,
      rcd.reasons
    FROM score.run_control_draft rcd
    JOIN corpus.control c
      ON c.id = rcd.control_id
    WHERE rcd.run_id = ${runId}::uuid
    ORDER BY c.code
  `)) as Array<{
    control_id: string;
    code: string;
    name: string;
    required_test: boolean | null;
    reasons: any;
  }>;

  const totalCount = controls.length;
  const evaluated: SummaryControlItem[] = [];
  const passed: SummaryControlItem[] = [];
  const partial: SummaryControlItem[] = [];
  const failed: SummaryControlItem[] = [];

  const controlEffectiveness = new Map<string, number>();

  for (const control of controls) {
    const derived = computeControlFromEvaluation({
      evaluation: control.reasons?.evaluation_4d,
      requireOperation: control.required_test !== false,
      wF,
      wO,
    });

    if (!derived) {
      continue;
    }

    const item: SummaryControlItem = {
      ...derived,
      control_id: control.control_id,
      code: control.code,
      name: control.name,
      required_test: control.required_test,
    };

    evaluated.push(item);
    controlEffectiveness.set(control.control_id, item.effectiveness);
    if (item.status === 'cumple') passed.push(item);
    if (item.status === 'parcial') partial.push(item);
    if (item.status === 'no_cumple') failed.push(item);
  }

  if (options?.persistControlScores && evaluated.length > 0) {
    await prisma.$transaction(
      evaluated.map((row) =>
        prisma.run_control_draft.update({
          where: { run_id_control_id: { run_id: runId, control_id: row.control_id } },
          data: { score: row.effectiveness },
        })
      )
    );
  }

  let failedRisks: Array<{ control_id: string; risk_id: string; risk_code: string; risk_name: string }> = [];
  if (failed.length > 0) {
    const failedIds = failed.map((row) => row.control_id);
    const scopedRisks = await prisma.$queryRaw(Prisma.sql`
      SELECT
        m.control_id,
        r.id AS risk_id,
        r.code AS risk_code,
        r.name AS risk_name
      FROM corpus.map_risk_control m
      JOIN corpus.risk r
        ON r.id = m.risk_id
      WHERE m.control_id IN (${Prisma.join(failedIds.map((id) => Prisma.sql`${id}::uuid`))})
        AND m.framework_version_id = ${run.framework_version_id}::uuid
    `);

    failedRisks = (scopedRisks as any[]).map((row) => ({
      control_id: row.control_id,
      risk_id: row.risk_id,
      risk_code: row.risk_code,
      risk_name: row.risk_name,
    }));

    if (failedRisks.length === 0) {
      const fallbackRisks = await prisma.$queryRaw(Prisma.sql`
        SELECT
          m.control_id,
          r.id AS risk_id,
          r.code AS risk_code,
          r.name AS risk_name
        FROM corpus.map_risk_control m
        JOIN corpus.risk r
          ON r.id = m.risk_id
        WHERE m.control_id IN (${Prisma.join(failedIds.map((id) => Prisma.sql`${id}::uuid`))})
      `);
      failedRisks = (fallbackRisks as any[]).map((row) => ({
        control_id: row.control_id,
        risk_id: row.risk_id,
        risk_code: row.risk_code,
        risk_name: row.risk_name,
      }));
    }
  }

  const obligations = await prisma.run_obligation_draft.findMany({
    where: { run_id: runId },
    select: {
      obligation_id: true,
      score: true,
      obligation: {
        select: {
          id: true,
          code: true,
          title: true,
          domain_id: true,
          criticality: true,
          evidence_strength: true,
          is_hard_gate: true,
        },
      },
    },
  });

  const obligationIds = obligations.map((row) => row.obligation_id);
  const evaluatedCount = evaluated.length;
  const isIncomplete = evaluatedCount < totalCount;

  if (evaluatedCount === 0) {
    return {
      payload: {
        runId,
        isIncomplete,
        evaluatedCount,
        totalCount,
        parameters: {
          profile,
          values: parameterRows.map((row) => ({
            code: row.code,
            name: row.name,
            numeric_value: row.numeric_value === null ? null : Number(row.numeric_value),
          })),
        },
        controls: {
          evaluated,
          passed,
          partial,
          failed: [],
        },
        control_scores: [],
        score: {
          final_score: 0,
          base_exposure: 0,
          concentration_index_h: 0,
          concentration_factor: 0,
          concentrated_exposure: 0,
          propagation_exposure: 0,
          final_exposure: 0,
        },
        debug: {
          gamma,
          trigger,
          uncontrolled_obligations: [],
        },
      },
      controlEffectiveness: {},
      obligationEffectiveness: {},
    };
  }

  const obligationControlLinks = await prisma.map_obligation_control.findMany({
    where: {
      obligation_id: { in: obligationIds },
    },
    select: {
      obligation_id: true,
      control_id: true,
    },
  });

  const controlLinksByObligation = new Map<string, string[]>();
  for (const link of obligationControlLinks) {
    const list = controlLinksByObligation.get(link.obligation_id) ?? [];
    list.push(link.control_id);
    controlLinksByObligation.set(link.obligation_id, list);
  }

  const obligationResults = obligations.map((row) => {
    const links = controlLinksByObligation.get(row.obligation_id) ?? [];
    const maxControl = links.reduce((max, controlId) => {
      const val = controlEffectiveness.get(controlId);
      if (val === undefined) return max;
      return Math.max(max, val);
    }, 0);
    const effectiveness = clamp01(maxControl);
    const fragility = clamp01(1 - effectiveness);
    const baseWeightRaw =
      (row.obligation.criticality ?? 0) +
      (row.obligation.evidence_strength ?? 0) +
      (row.obligation.is_hard_gate ? 2 : 0);
    const baseWeight = Math.max(1, toNumber(row.score) ?? baseWeightRaw);
    const exposure = baseWeight * fragility;
    return {
      obligation_id: row.obligation.id,
      obligation_code: row.obligation.code,
      domain_id: row.obligation.domain_id,
      effectiveness,
      fragility,
      exposure,
      criticality: row.obligation.criticality ?? 3,
    };
  });

  const obligationEffectiveness = Object.fromEntries(
    obligationResults.map((row) => [row.obligation_id, row.effectiveness])
  );

  const baseExposure = obligationResults.reduce((acc, row) => acc + row.exposure, 0);

  const domainMap = new Map<string, { obligations: typeof obligationResults; v_d: number }>();

  obligationResults.forEach((row) => {
    const list = domainMap.get(row.domain_id)?.obligations ?? [];
    list.push(row);
    domainMap.set(row.domain_id, { obligations: list, v_d: 0 });
  });

  domainMap.forEach((entry, domainId) => {
    const weights = entry.obligations.map((row) => {
      if (row.criticality === 1) return 1.5;
      if (row.criticality === 2) return 1.2;
      return 1.0;
    });
    const xValues = entry.obligations.map((row, idx) => Math.min(row.fragility * weights[idx], 1));
    const baseFragility = xValues.reduce((acc, x) => acc * (1 - x), 1);
    const fragilityValue = 1 - baseFragility;
    const sumX = xValues.reduce((acc, x) => acc + x, 0);
    const hhi = sumX > 0
      ? xValues.reduce((acc, x) => acc + Math.pow(x / sumX, 2), 0)
      : 0;
    const v_d = Math.min(fragilityValue * (1 + 0.35 * hhi), 1);
    domainMap.set(domainId, { obligations: entry.obligations, v_d });
  });

  const domainEntries = Array.from(domainMap.entries()).map(([domain_id, entry]) => ({
    domain_id,
    v_d: entry.v_d,
  }));

  const sumV = domainEntries.reduce((acc, row) => acc + row.v_d, 0);
  const concentrationIndex = sumV > 0
    ? domainEntries.reduce((acc, row) => acc + Math.pow(row.v_d / sumV, 2), 0)
    : 0;
  const concentrationFactor = 1 + alpha * concentrationIndex;
  const concentratedExposure = baseExposure * concentrationFactor;

  const domainIds = domainEntries.map((row) => row.domain_id);
  const dependencyRows = domainIds.length
    ? ((await prisma.$queryRaw(Prisma.sql`
        SELECT
          from_domain_id,
          to_domain_id,
          influence_weight
        FROM corpus.domain_dependency_matrix
        WHERE is_active = true
          AND from_domain_id IN (${Prisma.join(domainIds.map((id) => Prisma.sql`${id}::uuid`))})
          AND to_domain_id IN (${Prisma.join(domainIds.map((id) => Prisma.sql`${id}::uuid`))})
      `)) as Array<{
        from_domain_id: string;
        to_domain_id: string;
        influence_weight: Prisma.Decimal | number | null;
      }>)
    : [];

  const vMap = new Map(domainEntries.map((row) => [row.domain_id, row.v_d]));
  const depSum = dependencyRows.reduce((acc, row) => {
    const from = vMap.get(row.from_domain_id) ?? 0;
    const to = vMap.get(row.to_domain_id) ?? 0;
    return acc + (toNumber(row.influence_weight) ?? 0) * from * to;
  }, 0);
  const propagationExposure = beta * depSum;
  const finalExposure = Math.max(concentratedExposure + propagationExposure, trigger);
  const finalScore = 100 * Math.exp(-gamma * finalExposure);

  return {
    payload: {
      runId,
      isIncomplete,
      evaluatedCount,
      totalCount,
      parameters: {
        profile,
        values: parameterRows.map((row) => ({
          code: row.code,
          name: row.name,
          numeric_value: row.numeric_value === null ? null : Number(row.numeric_value),
        })),
      },
      controls: {
        evaluated,
        passed,
        partial,
        failed: failed.map((row) => ({
          ...row,
          risks: failedRisks.filter((risk) => risk.control_id === row.control_id),
        })),
      },
      control_scores: evaluated.map((row) => ({
        control_id: row.control_id,
        control_code: row.code,
        control_name: row.name,
        effectiveness: row.effectiveness,
      })),
      score: {
        final_score: finalScore,
        base_exposure: baseExposure,
        concentration_index_h: concentrationIndex,
        concentration_factor: concentrationFactor,
        concentrated_exposure: concentratedExposure,
        propagation_exposure: propagationExposure,
        final_exposure: finalExposure,
      },
      debug: {
        gamma,
        trigger,
        uncontrolled_obligations: obligationResults
          .filter((row) => row.exposure > 0)
          .map((row) => ({ code: row.obligation_code, exposure: row.exposure })),
      },
    },
    controlEffectiveness: Object.fromEntries(controlEffectiveness.entries()),
    obligationEffectiveness,
  };
}
