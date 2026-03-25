'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Eraser, Flame, Plus, Sparkles } from 'lucide-react';
import styles from './RiskAnalysisStep.module.css';
import RiskHeatmapModal from './RiskHeatmapModal';

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

type SelectOption = {
  id: string;
  code: string | null;
  name: string;
};

type RiskControlLink = {
  riskId: string;
  controlId: string;
  mitigationStrength: number | null;
  effectType: string | null;
};

type SystemPair = {
  domainId: string;
  riskId: string;
  elementId: string;
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
  hasRealData: boolean;
  isMissingRequiredData: boolean;
};

type SaveRow = {
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

type ComposerState = {
  mode: RowMode;
  elementId: string;
  riskId: string;
  customElementName: string;
  mitigatingControlId: string;
  probability: number | null;
  impact: number | null;
  connectivity: number | null;
  cascade: number | null;
  kFactor: number;
  source: string | null;
  scenario: string | null;
};

type RiskAnalysisStepProps = {
  draftId: string | null;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

const round4 = (value: number) => Math.round(value * 10000) / 10000;
const round6 = (value: number) => Math.round(value * 1_000_000) / 1_000_000;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const computeInherentRisk = (probability: number | null, impact: number | null) => {
  if (probability == null || impact == null) return null;
  return round6(probability * impact);
};

const computeResidualRisk = (
  probability: number | null,
  impact: number | null,
  mitigationStrength: number | null | undefined
) => {
  const inherent = computeInherentRisk(probability, impact);
  if (inherent == null) return null;
  const strength = mitigationStrength && mitigationStrength > 0 ? mitigationStrength : 1;
  return round6(inherent / strength);
};

const createSystemComposer = (): ComposerState => ({
  mode: 'SYSTEM',
  elementId: '',
  riskId: '',
  customElementName: '',
  mitigatingControlId: '',
  probability: null,
  impact: null,
  connectivity: null,
  cascade: null,
  kFactor: 1,
  source: null,
  scenario: null
});

const createCustomComposer = (riskId = '', probability: number | null = null, impact: number | null = null): ComposerState => ({
  mode: 'CUSTOM',
  elementId: '',
  riskId,
  customElementName: '',
  mitigatingControlId: '',
  probability,
  impact,
  connectivity: 1,
  cascade: 0,
  kFactor: 1,
  source: 'draft_custom_element',
  scenario: 'manual_custom'
});

const toSavePayload = (rows: RiskAnalysisRow[]): SaveRow[] =>
  rows.map((row) => ({
    rowId: row.rowId,
    rowMode: row.rowMode,
    riskId: row.riskId,
    elementId: row.elementId,
    customElementName: row.customElementName ?? null,
    mitigatingControlId: row.mitigatingControlId ?? null,
    probability: row.probability,
    impact: row.impact,
    connectivity: row.connectivity,
    cascade: row.cascade,
    kFactor: row.kFactor,
    scenario: row.scenario?.trim() || null,
    source: row.source?.trim() || null,
    analysisNotes: row.analysisNotes?.trim() || null
  }));

function hasCompleteData(row: RiskAnalysisRow): boolean {
  const hasNumbers =
    row.probability !== null &&
    row.impact !== null;

  if (row.rowMode === 'SYSTEM') {
    return Boolean(row.elementId) && Boolean(row.riskId) && hasNumbers;
  }

  return Boolean(row.riskId) && Boolean((row.customElementName || '').trim()) && hasNumbers;
}

function sortPairsByRiskScore(pairs: SystemPair[]) {
  return [...pairs].sort((a, b) => {
    const scoreA = a.riskScore ?? -1;
    const scoreB = b.riskScore ?? -1;
    return scoreB - scoreA;
  });
}

export default function RiskAnalysisStep({ draftId, onBack, onNext, onSave }: RiskAnalysisStepProps) {
  const [rows, setRows] = useState<RiskAnalysisRow[]>([]);
  const [domainId, setDomainId] = useState<string | null>(null);
  const [probabilityCatalog, setProbabilityCatalog] = useState<RiskCatalogOption[]>([]);
  const [impactCatalog, setImpactCatalog] = useState<RiskCatalogOption[]>([]);
  const [elementOptions, setElementOptions] = useState<SelectOption[]>([]);
  const [riskOptions, setRiskOptions] = useState<SelectOption[]>([]);
  const [controlOptions, setControlOptions] = useState<SelectOption[]>([]);
  const [riskControlLinks, setRiskControlLinks] = useState<RiskControlLink[]>([]);
  const [systemPairs, setSystemPairs] = useState<SystemPair[]>([]);
  const [composer, setComposer] = useState<ComposerState>(createSystemComposer);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);

  const pairMap = useMemo(() => {
    const map = new Map<string, SystemPair>();
    systemPairs.forEach((pair) => {
      map.set(`${pair.riskId}::${pair.elementId}`, pair);
    });
    return map;
  }, [systemPairs]);

  const pairsByElement = useMemo(() => {
    const map = new Map<string, SystemPair[]>();
    systemPairs.forEach((pair) => {
      const current = map.get(pair.elementId) ?? [];
      current.push(pair);
      map.set(pair.elementId, current);
    });
    map.forEach((pairs, key) => {
      map.set(key, sortPairsByRiskScore(pairs));
    });
    return map;
  }, [systemPairs]);

  const selectedElementPairs = useMemo(() => {
    if (composer.mode !== 'SYSTEM' || !composer.elementId) return [];
    return pairsByElement.get(composer.elementId) ?? [];
  }, [composer.mode, composer.elementId, pairsByElement]);

  const controlsByRisk = useMemo(() => {
    const map = new Map<string, string[]>();
    riskControlLinks.forEach((link) => {
      const current = map.get(link.riskId) ?? [];
      if (!current.includes(link.controlId)) current.push(link.controlId);
      map.set(link.riskId, current);
    });
    return map;
  }, [riskControlLinks]);

  const elementMap = useMemo(() => {
    const map = new Map<string, SelectOption>();
    elementOptions.forEach((element) => map.set(element.id, element));
    return map;
  }, [elementOptions]);

  const riskMap = useMemo(() => {
    const map = new Map<string, SelectOption>();
    riskOptions.forEach((risk) => map.set(risk.id, risk));
    return map;
  }, [riskOptions]);

  const controlMap = useMemo(() => {
    const map = new Map<string, SelectOption>();
    controlOptions.forEach((control) => map.set(control.id, control));
    return map;
  }, [controlOptions]);

  const riskControlStrengthMap = useMemo(() => {
    const map = new Map<string, number>();
    riskControlLinks.forEach((link) => {
      map.set(`${link.riskId}::${link.controlId}`, link.mitigationStrength == null ? 1 : Math.max(1, Math.round(link.mitigationStrength)));
    });
    return map;
  }, [riskControlLinks]);

  const composerControlOptions = useMemo(() => {
    if (!composer.riskId) return controlOptions;
    const scopedControlIds = controlsByRisk.get(composer.riskId) ?? [];
    if (scopedControlIds.length === 0) return controlOptions;
    return scopedControlIds
      .map((controlId) => controlMap.get(controlId))
      .filter((opt): opt is SelectOption => Boolean(opt));
  }, [composer.riskId, controlsByRisk, controlMap, controlOptions]);

  const getControlOptionsForRisk = useCallback((riskId: string) => {
    const scopedControlIds = controlsByRisk.get(riskId) ?? [];
    if (scopedControlIds.length === 0) return controlOptions;
    return scopedControlIds
      .map((controlId) => controlMap.get(controlId))
      .filter((opt): opt is SelectOption => Boolean(opt));
  }, [controlsByRisk, controlMap, controlOptions]);

  const composerInherentRisk = useMemo(
    () => computeInherentRisk(composer.probability, composer.impact),
    [composer.probability, composer.impact]
  );

  const composerMitigationStrength = useMemo(() => {
    if (!composer.riskId) return null;
    const selectedControlId = composer.mitigatingControlId || '';
    if (!selectedControlId) return null;
    return riskControlStrengthMap.get(`${composer.riskId}::${selectedControlId}`) ?? 1;
  }, [composer.riskId, composer.mitigatingControlId, riskControlStrengthMap]);

  const composerResidualRisk = useMemo(
    () => computeResidualRisk(composer.probability, composer.impact, composerMitigationStrength),
    [composer.probability, composer.impact, composerMitigationStrength]
  );

  const loadRows = useCallback(async () => {
    if (!draftId) {
      setRows([]);
      setDomainId(null);
      setProbabilityCatalog([]);
      setImpactCatalog([]);
      setElementOptions([]);
      setRiskOptions([]);
      setControlOptions([]);
      setRiskControlLinks([]);
      setSystemPairs([]);
      setComposer(createSystemComposer());
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/audit/drafts/${draftId}/risk-analysis`, { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el analisis de riesgo.');

      setDomainId(data?.domainId || null);
      setProbabilityCatalog(Array.isArray(data?.probabilityCatalog) ? data.probabilityCatalog : []);
      setImpactCatalog(Array.isArray(data?.impactCatalog) ? data.impactCatalog : []);
      setElementOptions(Array.isArray(data?.elementOptions) ? data.elementOptions : []);
      setRiskOptions(Array.isArray(data?.riskOptions) ? data.riskOptions : []);
      setControlOptions(Array.isArray(data?.controlOptions) ? data.controlOptions : []);
      setRiskControlLinks(Array.isArray(data?.riskControlLinks) ? data.riskControlLinks : []);
      setSystemPairs(Array.isArray(data?.systemPairs) ? data.systemPairs : []);
      setRows(Array.isArray(data?.rows) ? data.rows : []);

      setComposer(createSystemComposer());
    } catch (err: any) {
      setError(err?.message || 'Error cargando analisis de riesgo.');
      setRows([]);
      setDomainId(null);
      setProbabilityCatalog([]);
      setImpactCatalog([]);
      setElementOptions([]);
      setRiskOptions([]);
      setControlOptions([]);
      setRiskControlLinks([]);
      setSystemPairs([]);
      setComposer(createSystemComposer());
    } finally {
      setLoading(false);
    }
  }, [draftId]);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const persist = useCallback(async () => {
    if (!draftId) return false;
    setSaving(true);
    setError(null);
    try {
      await fetch('/api/auth/csrf');
      const res = await fetch(`/api/audit/drafts/${draftId}/risk-analysis`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: toSavePayload(rows) })
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error || 'No se pudo guardar el analisis de riesgo.');
      }
      return true;
    } catch (err: any) {
      setError(err?.message || 'Error guardando analisis de riesgo.');
      return false;
    } finally {
      setSaving(false);
    }
  }, [draftId, rows]);

  const applyPairToComposer = useCallback((pair: SystemPair) => {
    setComposer((prev) => ({
      ...prev,
      mode: 'SYSTEM',
      elementId: pair.elementId,
      riskId: pair.riskId,
      mitigatingControlId: pair.mitigatingControlId || '',
      probability: pair.probability,
      impact: pair.impact,
      connectivity: pair.connectivity,
      cascade: pair.cascade,
      kFactor: pair.kFactor,
      source: null,
      scenario: null
    }));
  }, []);

  const handleComposerElementChange = useCallback((elementId: string) => {
    if (!elementId) {
      setComposer(createSystemComposer());
      return;
    }
    const pairs = sortPairsByRiskScore(pairsByElement.get(elementId) ?? []);
    if (pairs.length === 0) {
      setComposer((prev) => ({ ...prev, mode: 'SYSTEM', elementId, riskId: '', mitigatingControlId: '', probability: null, impact: null, connectivity: null, cascade: null, kFactor: 1 }));
      return;
    }
    applyPairToComposer(pairs[0]);
  }, [applyPairToComposer, pairsByElement]);

  const handleComposerRiskChange = useCallback((riskId: string) => {
    if (composer.mode !== 'SYSTEM') {
      if (!riskId) {
        setComposer((prev) => ({ ...prev, riskId: '', mitigatingControlId: '' }));
        return;
      }

      const seededPair = sortPairsByRiskScore(systemPairs.filter((pair) => pair.riskId === riskId))[0];
      if (!seededPair) {
        setComposer((prev) => ({ ...prev, riskId, mitigatingControlId: '' }));
        return;
      }

      setComposer((prev) => ({
        ...prev,
        riskId,
        mitigatingControlId: seededPair.mitigatingControlId || '',
        probability: seededPair.probability,
        impact: seededPair.impact,
        connectivity: seededPair.connectivity,
        cascade: seededPair.cascade,
        kFactor: seededPair.kFactor
      }));
      return;
    }
    if (!composer.elementId || !riskId) {
      setComposer((prev) => ({ ...prev, riskId, mitigatingControlId: '' }));
      return;
    }
    const pair = pairMap.get(`${riskId}::${composer.elementId}`);
    if (!pair) {
      setComposer((prev) => ({ ...prev, riskId, mitigatingControlId: '', probability: null, impact: null, connectivity: null, cascade: null, kFactor: 1 }));
      return;
    }
    applyPairToComposer(pair);
  }, [applyPairToComposer, composer.elementId, composer.mode, pairMap, systemPairs]);

  const handleComposerControlChange = useCallback((controlId: string) => {
    setComposer((prev) => ({ ...prev, mitigatingControlId: controlId }));
  }, []);

  const handleComposerNumericChange = (field: 'probability' | 'impact' | 'connectivity' | 'cascade', rawValue: string) => {
    const num = Number(rawValue);
    if (!Number.isFinite(num)) {
      setComposer((prev) => ({ ...prev, [field]: null }));
      return;
    }

    if (field === 'probability' || field === 'impact') {
      setComposer((prev) => ({ ...prev, [field]: round4(clamp(num, 1, 5)) }));
      return;
    }

    if (field === 'connectivity') {
      setComposer((prev) => ({ ...prev, connectivity: clamp(Math.round(num), 1, 5) }));
      return;
    }

    setComposer((prev) => ({ ...prev, cascade: round4(clamp(num, 0, 1)) }));
  };

  const updateRow = (rowId: string, patch: Partial<RiskAnalysisRow>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.rowId !== rowId) return row;
        const next = { ...row, ...patch, isOverridden: true };

        const probability = next.probability == null ? null : round4(clamp(Number(next.probability) || 1, 1, 5));
        const impact = next.impact == null ? null : round4(clamp(Number(next.impact) || 1, 1, 5));
        const connectivity = next.connectivity == null ? null : clamp(Math.round(Number(next.connectivity) || 1), 1, 5);
        const cascade = next.cascade == null ? null : round4(clamp(Number(next.cascade) || 0, 0, 1));
        const kFactor = round4(Math.max(0, Number(next.kFactor) || 1));
        const controlId = next.mitigatingControlId || null;
        const controlMeta = controlId ? controlMap.get(controlId) : null;
        const mitigationStrength = controlId ? (riskControlStrengthMap.get(`${next.riskId}::${controlId}`) ?? 1) : null;
        const mitigationLevel = mitigationStrength == null ? null : (mitigationStrength >= 4 ? 'TOTAL' : 'PARCIAL');

        const baseScore = computeInherentRisk(probability, impact);
        const riskScore = computeResidualRisk(probability, impact, mitigationStrength);
        const deltaScore = baseScore == null || riskScore == null ? null : round6(baseScore - riskScore);
        const hasRealData = Boolean(probability !== null && impact !== null);

        return {
          ...next,
          probability,
          impact,
          connectivity,
          cascade,
          kFactor,
          baseScore,
          riskScore,
          deltaScore,
          mitigatingControlId: controlId,
          mitigatingControlCode: controlMeta?.code ?? null,
          mitigatingControlName: controlMeta?.name ?? null,
          mitigationStrength,
          mitigationLevel,
          hasRealData,
          isMissingRequiredData: !hasCompleteData({ ...next, probability, impact, connectivity, cascade, kFactor, baseScore, riskScore, deltaScore, hasRealData })
        };
      })
    );
  };

  const removeRow = (rowId: string) => {
    setRows((prev) => prev.filter((row) => row.rowId !== rowId));
  };

  const startCustomComposer = () => {
    const defaultProbability = probabilityCatalog[0]?.baseValue ?? null;
    const defaultImpact = impactCatalog[0]?.baseValue ?? null;
    const defaultRisk = riskOptions[0]?.id ?? '';
    const defaultControlId = defaultRisk ? (getControlOptionsForRisk(defaultRisk)[0]?.id ?? '') : '';
    setComposer({ ...createCustomComposer(defaultRisk, defaultProbability, defaultImpact), mitigatingControlId: defaultControlId });
    setError(null);
  };

  const clearComposer = () => {
    setComposer(createSystemComposer());
    setError(null);
  };

  const addComposerToGrid = () => {
    setError(null);

    if (composer.mode === 'SYSTEM') {
      const elementId = composer.elementId;
      const riskId = composer.riskId;

      if (!elementId || !riskId) {
        setError('Selecciona un elemento y su riesgo asociado antes de agregar.');
        return;
      }
      if (composer.probability == null || composer.impact == null) {
        setError('Completa Probabilidad e Impacto antes de agregar.');
        return;
      }

      const element = elementMap.get(elementId);
      const risk = riskMap.get(riskId);
      const selectedControlId = composer.mitigatingControlId
        || pairMap.get(`${riskId}::${elementId}`)?.mitigatingControlId
        || getControlOptionsForRisk(riskId)[0]?.id
        || '';

      if (
        rows.some(
          (row) =>
            row.rowMode === 'SYSTEM' &&
            row.elementId === elementId &&
            row.riskId === riskId &&
            (row.mitigatingControlId ?? '') === selectedControlId
        )
      ) {
        setError('Ese elemento con el mismo riesgo y control ya existe en el grid.');
        return;
      }

      const selectedControlMeta = selectedControlId ? controlMap.get(selectedControlId) : null;
      const selectedStrength = selectedControlId ? (riskControlStrengthMap.get(`${riskId}::${selectedControlId}`) ?? 1) : null;
      const baseScore = computeInherentRisk(composer.probability, composer.impact);
      const riskScore = computeResidualRisk(composer.probability, composer.impact, selectedStrength);
      const deltaScore = baseScore == null || riskScore == null ? null : round6(baseScore - riskScore);

      const newRow: RiskAnalysisRow = {
        rowId: `system:${riskId}:${elementId}:${crypto.randomUUID()}`,
        rowMode: 'SYSTEM',
        domainId: domainId || '',
        riskId,
        riskCode: risk?.code ?? null,
        riskName: risk?.name ?? null,
        riskOrigen: null,
        elementId,
        elementCode: element?.code ?? null,
        elementName: element?.name ?? null,
        customElementName: null,
        probability: composer.probability,
        impact: composer.impact,
        connectivity: composer.connectivity,
        cascade: composer.cascade,
        kFactor: composer.kFactor,
        baseScore,
        riskScore,
        deltaScore,
        mitigatingControlId: selectedControlId || null,
        mitigatingControlCode: selectedControlMeta?.code ?? null,
        mitigatingControlName: selectedControlMeta?.name ?? null,
        mitigatingControlDescription: null,
        mitigationStrength: selectedStrength,
        mitigationLevel: selectedStrength == null ? null : (selectedStrength >= 4 ? 'TOTAL' : 'PARCIAL'),
        scenario: composer.scenario,
        source: composer.source,
        analysisNotes: null,
        hasRealData: true,
        isMissingRequiredData: false,
        isOverridden: true
      };

      setRows((prev) => [...prev, newRow]);
      setComposer(createSystemComposer());
      return;
    }

    const customElementName = composer.customElementName.trim();
    if (!customElementName || !composer.riskId) {
      setError('Para modo nuevo debes definir elemento y riesgo.');
      return;
    }
    if (composer.probability == null || composer.impact == null) {
      setError('Completa Probabilidad e Impacto antes de agregar.');
      return;
    }

    const risk = riskMap.get(composer.riskId);
    const selectedControlId = composer.mitigatingControlId || getControlOptionsForRisk(composer.riskId)[0]?.id || '';

    if (
      rows.some(
        (row) =>
          row.rowMode === 'CUSTOM' &&
          (row.customElementName || '').trim().toLowerCase() === customElementName.toLowerCase() &&
          row.riskId === composer.riskId &&
          (row.mitigatingControlId ?? '') === selectedControlId
      )
    ) {
      setError('Ese elemento nuevo con el mismo riesgo y control ya existe en el grid.');
      return;
    }

    const selectedControlMeta = selectedControlId ? controlMap.get(selectedControlId) : null;
    const selectedStrength = selectedControlId ? (riskControlStrengthMap.get(`${composer.riskId}::${selectedControlId}`) ?? 1) : null;
    const baseScore = computeInherentRisk(composer.probability, composer.impact);
    const riskScore = computeResidualRisk(composer.probability, composer.impact, selectedStrength);
    const deltaScore = baseScore == null || riskScore == null ? null : round6(baseScore - riskScore);

    const newRow: RiskAnalysisRow = {
      rowId: `custom:${crypto.randomUUID()}`,
      rowMode: 'CUSTOM',
      domainId: domainId || '',
      riskId: composer.riskId,
      riskCode: risk?.code ?? null,
      riskName: risk?.name ?? null,
      riskOrigen: null,
      elementId: null,
      elementCode: null,
      elementName: customElementName,
      customElementName,
      probability: composer.probability,
      impact: composer.impact,
      connectivity: composer.connectivity,
      cascade: composer.cascade,
      kFactor: composer.kFactor,
      baseScore,
      riskScore,
      deltaScore,
      mitigatingControlId: selectedControlId || null,
      mitigatingControlCode: selectedControlMeta?.code ?? null,
      mitigatingControlName: selectedControlMeta?.name ?? null,
      mitigatingControlDescription: null,
      mitigationStrength: selectedStrength,
      mitigationLevel: selectedStrength == null ? null : (selectedStrength >= 4 ? 'TOTAL' : 'PARCIAL'),
      scenario: composer.scenario,
      source: composer.source,
      analysisNotes: null,
      hasRealData: true,
      isMissingRequiredData: false,
      isOverridden: true
    };

    setRows((prev) => [...prev, newRow]);
    setComposer(createSystemComposer());
    setError(null);
  };

  const hasBlockingRows = useMemo(() => rows.some((row) => !hasCompleteData(row)), [rows]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const scoreA = a.riskScore ?? -1;
      const scoreB = b.riskScore ?? -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const elA = (a.customElementName || a.elementName || '').toLowerCase();
      const elB = (b.customElementName || b.elementName || '').toLowerCase();
      return elA.localeCompare(elB);
    });
  }, [rows]);

  const totals = useMemo(() => {
    const inherent = sortedRows.reduce((acc, row) => acc + (row.baseScore ?? 0), 0);
    const residual = sortedRows.reduce((acc, row) => acc + (row.riskScore ?? 0), 0);
    return {
      inherent: round6(inherent),
      residual: round6(residual)
    };
  }, [sortedRows]);

  const handleSaveClick = async () => {
    const ok = await persist();
    if (ok) onSave();
  };

  const handleBackClick = async () => {
    await persist();
    onBack();
  };

  const handleNextClick = async () => {
    if (rows.length === 0) {
      setError('Agrega al menos un elemento-riesgo al grid para continuar.');
      return;
    }
    if (hasBlockingRows) {
      setError('Existen filas incompletas. Completa/corrige antes de continuar.');
      return;
    }

    const ok = await persist();
    if (ok) onNext();
  };

  const handleHeatmapClick = () => {
    if (sortedRows.length === 0) {
      setError('Agrega al menos una fila al grid para generar el mapa de calor.');
      return;
    }
    setError(null);
    setIsHeatmapOpen(true);
  };

  const handleLaunchAuditFromHeatmap = async () => {
    setIsHeatmapOpen(false);
    await handleNextClick();
  };

  if (loading) {
    return <div className={styles.loading}>Cargando analisis de riesgo...</div>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <p className={styles.subtitle}>
          Selecciona el elemento y se cargaran sus datos base desde <code>graph.v_risk_analyst</code>. Luego agrega cada fila al grid.
        </p>
        <p className={styles.contextLine}>Dominio activo: {domainId || 'Sin definir'}</p>
      </div>

      <div className={styles.composerCard}>
        <div className={styles.composerGrid}>
          <div className={`${styles.composerField} ${styles.composerCellWide}`}>
            <span className={styles.composerFieldLabel}>Elemento</span>
            {composer.mode === 'SYSTEM' ? (
              <select
                value={composer.elementId}
                onChange={(event) => handleComposerElementChange(event.target.value)}
                className={styles.selectInput}
              >
                <option value="">Seleccione elemento...</option>
                {elementOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.name}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={composer.customElementName}
                onChange={(event) => setComposer((prev) => ({ ...prev, customElementName: event.target.value }))}
                className={styles.textInput}
                placeholder="Nuevo elemento"
              />
            )}
          </div>

          <div className={`${styles.composerField} ${styles.composerCellWide}`}>
            <span className={styles.composerFieldLabel}>Riesgo</span>
            {composer.mode === 'SYSTEM' ? (
              selectedElementPairs.length <= 1 ? (
                <div className={styles.riskReadonly}>{riskMap.get(composer.riskId)?.name || 'Sin riesgo asociado'}</div>
              ) : (
                <select
                  value={composer.riskId}
                  onChange={(event) => handleComposerRiskChange(event.target.value)}
                  className={styles.selectInput}
                >
                  {selectedElementPairs.map((pair) => (
                    <option key={pair.riskId} value={pair.riskId}>{riskMap.get(pair.riskId)?.name || pair.riskId}</option>
                  ))}
                </select>
              )
            ) : (
              <select
                value={composer.riskId}
                onChange={(event) => handleComposerRiskChange(event.target.value)}
                className={styles.selectInput}
              >
                <option value="">Seleccione riesgo...</option>
                {riskOptions.map((risk) => (
                  <option key={risk.id} value={risk.id}>{risk.name}</option>
                ))}
              </select>
            )}
          </div>

          <div className={`${styles.composerField} ${styles.composerCell}`}>
            <span className={styles.composerFieldLabel}>Probabilidad</span>
            <select
              value={composer.probability ?? ''}
              onChange={(event) => handleComposerNumericChange('probability', event.target.value)}
              className={styles.selectInput}
            >
              <option value="">Seleccione...</option>
              {probabilityCatalog.map((opt) => (
                <option key={`composer-prob-${opt.id}`} value={opt.baseValue}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div className={`${styles.composerField} ${styles.composerCell}`}>
            <span className={styles.composerFieldLabel}>Impacto</span>
            <select
              value={composer.impact ?? ''}
              onChange={(event) => handleComposerNumericChange('impact', event.target.value)}
              className={styles.selectInput}
            >
              <option value="">Seleccione...</option>
              {impactCatalog.map((opt) => (
                <option key={`composer-imp-${opt.id}`} value={opt.baseValue}>{opt.name}</option>
              ))}
            </select>
          </div>

          <div className={`${styles.composerField} ${styles.composerCell}`}>
            <span className={styles.composerFieldLabel}>Riesgo inherente</span>
            <div className={styles.composerScore}>
              {composerInherentRisk == null ? '--' : composerInherentRisk.toFixed(4)}
            </div>
          </div>

          <div className={`${styles.composerField} ${styles.composerCell}`}>
            <span className={styles.composerFieldLabel}>Control mitigante</span>
            <select
              value={composer.mitigatingControlId}
              onChange={(event) => handleComposerControlChange(event.target.value)}
              className={`${styles.selectInput} ${styles.controlSelectInput}`}
            >
              <option value="">Seleccione control...</option>
              {composerControlOptions.map((control) => (
                <option key={control.id} value={control.id}>
                  {control.name}
                </option>
              ))}
            </select>
          </div>

          <div className={`${styles.composerField} ${styles.composerCell}`}>
            <span className={styles.composerFieldLabel}>Riesgo residual</span>
            <div className={styles.composerScore}>
              {composerResidualRisk == null ? '--' : composerResidualRisk.toFixed(4)}
            </div>
          </div>
        </div>

        <div className={styles.composerActions}>
          <button className={styles.composerAddButton} type="button" onClick={addComposerToGrid} aria-label="Agregar" title="Agregar">
            <Plus size={16} />
          </button>
          <button className={styles.composerNewButton} type="button" onClick={startCustomComposer} aria-label="Nuevo" title="Nuevo">
            <Sparkles size={16} />
          </button>
          <button className={styles.composerClearButton} type="button" onClick={clearComposer} aria-label="Limpiar compositor" title="Limpiar compositor">
            <Eraser size={16} />
          </button>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Elemento</th>
              <th>Riesgo</th>
              <th>Probabilidad</th>
              <th>Impacto</th>
              <th>Riesgo inherente</th>
              <th>Control mitigante</th>
              <th>Riesgo residual</th>
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {sortedRows.length === 0 && (
              <tr>
                <td colSpan={8} className={styles.empty}>
                  Aun no agregas filas al analisis.
                </td>
              </tr>
            )}
            {sortedRows.map((row) => {
              const isCustom = row.rowMode === 'CUSTOM';

              return (
                <tr key={row.rowId} className={!hasCompleteData(row) ? styles.rowInvalid : ''}>
                  <td>
                    {isCustom ? (
                      <input
                        type="text"
                        value={row.customElementName || ''}
                        onChange={(event) => updateRow(row.rowId, { customElementName: event.target.value, elementName: event.target.value })}
                        className={styles.textInput}
                        placeholder="Elemento"
                      />
                    ) : (
                      <div className={styles.readonlyText}>{row.elementName || 'Sin elemento'}</div>
                    )}
                  </td>
                  <td>
                    <div className={styles.readonlyText}>{row.riskName || 'Sin riesgo'}</div>
                  </td>
                  <td>
                    <select
                      value={row.probability ?? ''}
                      onChange={(event) => updateRow(row.rowId, { probability: Number(event.target.value) })}
                      className={`${styles.selectInput} ${styles.probImpactInput}`}
                    >
                      <option value="">Seleccione...</option>
                      {probabilityCatalog.map((opt) => (
                        <option key={`prob-${opt.id}`} value={opt.baseValue}>{opt.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <select
                      value={row.impact ?? ''}
                      onChange={(event) => updateRow(row.rowId, { impact: Number(event.target.value) })}
                      className={`${styles.selectInput} ${styles.probImpactInput}`}
                    >
                      <option value="">Seleccione...</option>
                      {impactCatalog.map((opt) => (
                        <option key={`imp-${opt.id}`} value={opt.baseValue}>{opt.name}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={styles.scoreCell}>{row.baseScore == null ? '--' : row.baseScore.toFixed(4)}</span>
                  </td>
                  <td>
                    <select
                      value={row.mitigatingControlId ?? ''}
                      onChange={(event) => updateRow(row.rowId, { mitigatingControlId: event.target.value || null })}
                      className={`${styles.selectInput} ${styles.controlSelectInput}`}
                    >
                      <option value="">Seleccione control...</option>
                      {getControlOptionsForRisk(row.riskId)
                        .map((control) => (
                          <option key={`${row.rowId}-${control.id}`} value={control.id}>
                            {control.name}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td>
                    <span className={styles.scoreCell}>{row.riskScore == null ? '--' : row.riskScore.toFixed(4)}</span>
                  </td>
                  <td>
                    <button className={styles.removeButton} type="button" onClick={() => removeRow(row.rowId)}>
                      Quitar
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          {sortedRows.length > 0 && (
            <tfoot>
              <tr className={styles.totalRow}>
                <td colSpan={4} className={styles.totalLabel}>Totales</td>
                <td className={styles.totalValue}>{totals.inherent.toFixed(4)}</td>
                <td className={styles.totalSpacer}>-</td>
                <td className={styles.totalValue}>{totals.residual.toFixed(4)}</td>
                <td className={styles.totalSpacer}>-</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className={styles.footer}>
        <button className={styles.heatmapButton} onClick={handleHeatmapClick} type="button">
          <Flame size={16} /> Mapa de calor
        </button>
        <button className={styles.backButton} onClick={handleBackClick} disabled={saving}>
          Volver
        </button>
        <button className={styles.ghostButton} onClick={handleSaveClick} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button className={styles.primaryButton} onClick={handleNextClick} disabled={saving || hasBlockingRows || rows.length === 0}>
          Continuar
        </button>
      </div>

      <RiskHeatmapModal
        open={isHeatmapOpen}
        rows={sortedRows}
        onClose={() => setIsHeatmapOpen(false)}
        onLaunchAudit={handleLaunchAuditFromHeatmap}
      />
    </div>
  );
}
