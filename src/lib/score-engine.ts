export type StructuralLevel = 'EXISTENTIAL' | 'CRITICAL' | 'ROBUSTNESS' | 'SUPPORT';

export type CreScoreEngineInput = {
  controls: Array<{
    id: string;
    code: string;
    rationale: {
      risk_weight: number;
      structural_level: StructuralLevel;
      cascade_factor: number;
      is_dependency_root: boolean;
      failure_mode?: string;
      design_intent?: string;
    };
  }>;
  obligations: Array<{
    id: string;
    code: string;
    title: string;
    risk_weight: number;
  }>;
  map_domain_elements_control: Array<{
    obligation_id: string;
    control_id: string;
    mitigation_weight: number;
    min_coverage_threshold: number | null;
  }>;
  assessments: Array<{
    control_id: string;
    existence_score: number;
    formalization_score: number;
    operating_score: number;
    evidence_gate_passed: boolean;
    existence_gate_passed: boolean;
  }>;
  obligation_domain_map: Array<{
    obligation_id: string;
    domain_id: string;
  }>;
};

export type CreScoreEngineOutput = {
  control_effectiveness: Record<string, number>;
  obligation_effectiveness: Record<string, number>;
  score_breakdown: {
    base_exposure: number;
    concentration_index: number;
    concentration_factor: number;
    concentrated_exposure: number;
    propagation_exposure: number;
    final_exposure: number;
    final_score_0_100: number;
  };
};

type ScoreBand =
  | 'CRITICO'
  | 'FRAGIL'
  | 'EN_RIESGO'
  | 'ESTABLE'
  | 'ROBUSTO';

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function safeNumber(value: number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (!Number.isFinite(value)) return 0;
  return value;
}

export function runCreScoreEngine(input: CreScoreEngineInput): CreScoreEngineOutput {
  const controlEffectiveness: Record<string, number> = {};

  input.assessments.forEach((row) => {
    const existence = clamp01(safeNumber(row.existence_score));
    const formalization = clamp01(safeNumber(row.formalization_score));
    const operating = clamp01(safeNumber(row.operating_score));

    let effectiveness = 0;
    if (!row.existence_gate_passed || !row.evidence_gate_passed) {
      effectiveness = 0;
    } else if (existence === 0) {
      effectiveness = 0;
    } else {
      effectiveness = clamp01(existence * ((formalization + operating) / 2));
    }

    controlEffectiveness[row.control_id] = effectiveness;
  });

  const obligationEffectiveness: Record<string, number> = {};
  const obligationExposure: Array<{ obligation_id: string; exposure: number; fragility: number; domain_id: string }> = [];

  const controlsByObligation = new Map<string, string[]>();
  input.map_domain_elements_control.forEach((link) => {
    const list = controlsByObligation.get(link.obligation_id) ?? [];
    list.push(link.control_id);
    controlsByObligation.set(link.obligation_id, list);
  });

  const domainByObligation = new Map<string, string>();
  input.obligation_domain_map.forEach((row) => {
    domainByObligation.set(row.obligation_id, row.domain_id);
  });

  input.obligations.forEach((obligation) => {
    const controlIds = controlsByObligation.get(obligation.id) ?? [];
    const maxEffectiveness = controlIds.reduce((acc, controlId) => {
      const val = controlEffectiveness[controlId] ?? 0;
      return Math.max(acc, val);
    }, 0);
    const effectiveness = clamp01(maxEffectiveness);
    obligationEffectiveness[obligation.id] = effectiveness;
    const fragility = clamp01(1 - effectiveness);
    const exposure = safeNumber(obligation.risk_weight) * fragility;
    obligationExposure.push({
      obligation_id: obligation.id,
      exposure,
      fragility,
      domain_id: domainByObligation.get(obligation.id) || 'unknown',
    });
  });

  const baseExposure = obligationExposure.reduce((acc, row) => acc + row.exposure, 0);

  const domainMap = new Map<string, Array<{ fragility: number }>>();
  obligationExposure.forEach((row) => {
    const list = domainMap.get(row.domain_id) ?? [];
    list.push({ fragility: row.fragility });
    domainMap.set(row.domain_id, list);
  });

  const domainEntries = Array.from(domainMap.entries()).map(([domain_id, list]) => {
    const avgFragility =
      list.length > 0
        ? list.reduce((acc, row) => acc + row.fragility, 0) / list.length
        : 0;
    return { domain_id, v_d: clamp01(avgFragility) };
  });

  const sumV = domainEntries.reduce((acc, row) => acc + row.v_d, 0);
  const concentrationIndex = sumV > 0
    ? domainEntries.reduce((acc, row) => acc + Math.pow(row.v_d / sumV, 2), 0)
    : 0;
  const concentrationFactor = 1 + 0.35 * concentrationIndex;
  const concentratedExposure = baseExposure * concentrationFactor;

  const propagationExposure = 0;
  const finalExposure = concentratedExposure + propagationExposure;
  const finalScore = 100 * Math.exp(-0.06 * finalExposure);

  return {
    control_effectiveness: controlEffectiveness,
    obligation_effectiveness: obligationEffectiveness,
    score_breakdown: {
      base_exposure: baseExposure,
      concentration_index: concentrationIndex,
      concentration_factor: concentrationFactor,
      concentrated_exposure: concentratedExposure,
      propagation_exposure: propagationExposure,
      final_exposure: finalExposure,
      final_score_0_100: finalScore,
    },
  };
}

export function classifyCreScore(score: number): ScoreBand {
  const value = Number(score);
  if (!Number.isFinite(value)) return 'FRAGIL';
  if (value < 30) return 'CRITICO';
  if (value < 50) return 'FRAGIL';
  if (value < 70) return 'EN_RIESGO';
  if (value < 85) return 'ESTABLE';
  return 'ROBUSTO';
}
