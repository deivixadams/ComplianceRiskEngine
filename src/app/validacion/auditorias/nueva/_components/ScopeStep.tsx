'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Layers3, ShieldCheck, CheckSquare, FilterX } from 'lucide-react';
import styles from './ScopeStep.module.css';

type Obligation = { id: string; title: string; code?: string; domainId?: string };

type Risk = {
  id: string;
  code?: string | null;
  name: string;
  description?: string | null;
  status?: string | null;
  riskTypeName?: string | null;
  riskLayerName?: string | null;
  domainIds?: string[];
};

type DerivedCounts = {
  obligationCount: number;
  riskCount: number;
  controlCount: number;
  testCount: number;
};

type ScopeStepProps = {
  draftId: string | null;
  domainIds: string[];
  selectedDomainName: string | null;
  obligationIds: string[];
  riskIds: string[];
  derivedCounts: DerivedCounts;
  onChange: (next: { domainIds: string[]; obligationIds: string[]; riskIds: string[]; derivedCounts: DerivedCounts }) => void;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

const defaultCounts: DerivedCounts = { obligationCount: 0, riskCount: 0, controlCount: 0, testCount: 0 };

function sameDerivedCounts(a: DerivedCounts, b: DerivedCounts) {
  return (
    a.obligationCount === b.obligationCount &&
    a.riskCount === b.riskCount &&
    a.controlCount === b.controlCount &&
    a.testCount === b.testCount
  );
}

type DraftRiskAnalysisRow = {
  riskId: string;
  riskCode?: string | null;
  riskName?: string | null;
  elementName?: string | null;
  customElementName?: string | null;
  rowMode?: 'SYSTEM' | 'CUSTOM';
};

export default function ScopeStep({ draftId, domainIds, selectedDomainName, obligationIds, riskIds, derivedCounts, onChange, onBack, onNext, onSave }: ScopeStepProps) {
  const [obligations, setObligations] = useState<Obligation[]>([]);
  const [obligationsLoading, setObligationsLoading] = useState(false);
  const [selectedElements, setSelectedElements] = useState<string[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [risksLoading, setRisksLoading] = useState(false);
  const [mode, setMode] = useState<'all' | 'subset'>('all');
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    if (domainIds.length === 0) {
      setObligations([]);
      setObligationsLoading(false);
      return;
    }

    const loadObligations = async () => {
      setObligationsLoading(true);
      const query = domainIds.map((id) => `domain_id=${encodeURIComponent(id)}`).join('&');
      const res = await fetch(`/api/audit/catalog/obligations?${query}`);
      if (!res.ok) {
        setObligations([]);
        setObligationsLoading(false);
        return;
      }
      const data = await res.json();
      setObligations(data || []);
      setObligationsLoading(false);
    };
    loadObligations();
  }, [domainIds]);

  useEffect(() => {
    let cancelled = false;

    const derive = async () => {
      const res = await fetch('/api/audit/derive-scope', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainIds, obligationIds: mode === 'subset' ? obligationIds : [] })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (cancelled) return;
      const nextCounts: DerivedCounts = {
        obligationCount: Number(data?.obligationCount ?? 0),
        riskCount: Number(data?.riskCount ?? 0),
        controlCount: Number(data?.controlCount ?? 0),
        testCount: Number(data?.testCount ?? 0)
      };
      if (sameDerivedCounts(derivedCounts, nextCounts)) return;
      onChangeRef.current({ domainIds, obligationIds, riskIds, derivedCounts: nextCounts });
    };

    derive();
    return () => {
      cancelled = true;
    };
  }, [domainIds, obligationIds, mode, derivedCounts, riskIds]);

  useEffect(() => {
    if (domainIds.length === 0) {
      setRisks([]);
      setSelectedElements([]);
      setRisksLoading(false);
      return;
    }

    if (draftId) {
      const loadRisksFromDraft = async () => {
        setRisksLoading(true);
        try {
          const res = await fetch(`/api/audit/drafts/${draftId}/risk-analysis`, { cache: 'no-store' });
          if (!res.ok) {
            setRisks([]);
            setSelectedElements([]);
            return;
          }

          const payload = await res.json();
          const draftRows = Array.isArray(payload?.rows) ? (payload.rows as DraftRiskAnalysisRow[]) : [];
          const grouped = new Map<string, { risk: Risk; elements: Set<string> }>();
          const elementSet = new Set<string>();

          draftRows.forEach((row) => {
            const riskId = row.riskId;
            if (!riskId) return;
            const riskName = row.riskName || row.riskCode || 'Sin riesgo';
            const elementName = (row.customElementName || row.elementName || '').trim();
            if (elementName) elementSet.add(elementName);
            const existing = grouped.get(riskId);

            if (!existing) {
              const nextRisk: Risk = {
                id: riskId,
                code: row.riskCode ?? null,
                name: riskName,
                description: null,
                status: null,
                riskTypeName: null,
                riskLayerName: null
              };
              const elements = new Set<string>();
              if (elementName) elements.add(elementName);
              grouped.set(riskId, { risk: nextRisk, elements });
              return;
            }

            if (elementName) existing.elements.add(elementName);
          });

          const nextRisks = [...grouped.values()]
            .map(({ risk, elements }) => ({
              ...risk,
              description: elements.size > 0 ? `Elementos: ${[...elements].join(', ')}` : null
            }))
            .sort((a, b) => a.name.localeCompare(b.name));

          setSelectedElements([...elementSet].sort((a, b) => a.localeCompare(b)));
          setRisks(nextRisks);
        } finally {
          setRisksLoading(false);
        }
      };

      loadRisksFromDraft();
      return;
    }

    setSelectedElements([]);

    if (mode === 'subset' && obligationIds.length === 0) {
      setRisks([]);
      setRisksLoading(false);
      return;
    }

    const loadRisks = async () => {
      setRisksLoading(true);
      try {
        let res: Response;
        if (mode === 'subset') {
          res = await fetch('/api/audit/catalog/risks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ domainIds, obligationIds })
          });
        } else {
          const params = new URLSearchParams();
          domainIds.forEach((id) => params.append('domain_id', id));
          res = await fetch(`/api/audit/catalog/risks?${params.toString()}`);
        }
        if (!res.ok) {
          setRisks([]);
          return;
        }
        const data = await res.json();
        setRisks(Array.isArray(data) ? data : []);
      } finally {
        setRisksLoading(false);
      }
    };

    loadRisks();
  }, [draftId, domainIds, obligationIds, mode]);

  useEffect(() => {
    if (riskIds.length === 0) return;
    const allowed = new Set(risks.map((risk) => risk.id));
    const filtered = riskIds.filter((riskId) => allowed.has(riskId));
    if (filtered.length !== riskIds.length) {
      onChangeRef.current({ domainIds, obligationIds, riskIds: filtered, derivedCounts: derivedCounts ?? defaultCounts });
    }
  }, [risks, riskIds, domainIds, obligationIds, derivedCounts]);

  const obligationsVisible = useMemo(() => {
    if (mode === 'all') return [];
    return obligations;
  }, [mode, obligations]);

  const toggleObligation = (id: string) => {
    const next = obligationIds.includes(id)
      ? obligationIds.filter((o) => o !== id)
      : [...obligationIds, id];
    onChange({ domainIds, obligationIds: next, riskIds, derivedCounts: derivedCounts ?? defaultCounts });
  };

  const toggleRisk = (id: string) => {
    const next = riskIds.includes(id)
      ? riskIds.filter((r) => r !== id)
      : [...riskIds, id];
    onChange({ domainIds, obligationIds, riskIds: next, derivedCounts: derivedCounts ?? defaultCounts });
  };

  const selectAllRisks = () => {
    const next = risks.map((risk) => risk.id);
    onChange({ domainIds, obligationIds, riskIds: next, derivedCounts: derivedCounts ?? defaultCounts });
  };

  const clearRisks = () => {
    onChange({ domainIds, obligationIds, riskIds: [], derivedCounts: derivedCounts ?? defaultCounts });
  };

  const allSelected = risks.length > 0 && riskIds.length === risks.length;

  const getLayerClass = (label: string) => {
    const upper = label.toUpperCase();
    if (upper.includes('ALTO') || upper.includes('CRIT')) return styles.levelHigh;
    if (upper.includes('MED')) return styles.levelMedium;
    if (upper.includes('BAJ')) return styles.levelLow;
    return styles.levelNeutral;
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Seleccion de auditoria</h2>
        <p className={styles.subtitle}>Define dominios, obligaciones y riesgos para construir el alcance operativo.</p>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <Layers3 className={styles.cardIcon} /> Dominio / Reino
          </div>
          <div className={styles.fieldStack}>
            <div className={styles.helperText}>Seleccionado en Paso 1 (Acta)</div>
            <div className={styles.optionRow}>
              <input type="checkbox" checked={domainIds.length > 0} disabled />
              <span>{selectedDomainName || 'Sin reino seleccionado'}</span>
            </div>
            <div className={styles.helperText}>
              El reino se define en Acta; los dominios derivados gobiernan alcance, riesgos, elementos y análisis.
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeaderRow}>
            <div className={styles.cardTitleSimple}>Elementos</div>
            {!draftId && (
              <div className={styles.toggleGroup}>
                <label className={styles.toggleOption}>
                  <input type="radio" checked={mode === 'all'} onChange={() => setMode('all')} />
                  Todas
                </label>
                <label className={styles.toggleOption}>
                  <input type="radio" checked={mode === 'subset'} onChange={() => setMode('subset')} />
                  Subset
                </label>
              </div>
            )}
          </div>
          {draftId ? (
            <p className={styles.helperText}>Elementos seleccionados en el Paso 2 (Analisis de riesgo).</p>
          ) : mode === 'all' ? (
            <p className={styles.helperText}>Se incluyen todas las obligaciones de los dominios seleccionados.</p>
          ) : null}
          <div className={styles.scrollList}>
            {draftId ? (
              <>
                {selectedElements.length === 0 && (
                  <div className={styles.helperText}>Aun no hay elementos seleccionados en el Paso 2.</div>
                )}
                {selectedElements.map((elementName) => (
                  <label key={elementName} className={styles.optionRow}>
                    <input type="checkbox" checked disabled />
                    {elementName}
                  </label>
                ))}
              </>
            ) : domainIds.length === 0 ? (
              <div className={styles.helperText}>Selecciona dominios para cargar obligaciones.</div>
            ) : null}
            {!draftId && domainIds.length > 0 && obligationsLoading && (
              <div className={styles.helperText}>Cargando obligaciones...</div>
            )}
            {!draftId && domainIds.length > 0 && !obligationsLoading && obligations.length === 0 && (
              <div className={styles.helperText}>Sin obligaciones para los dominios seleccionados.</div>
            )}
            {!draftId && domainIds.length > 0 && !obligationsLoading && (mode === 'subset' ? obligationsVisible : obligations).map((obl) => (
              <label key={obl.id} className={styles.optionRow}>
                <input
                  type="checkbox"
                  checked={mode === 'all' ? true : obligationIds.includes(obl.id)}
                  disabled={mode === 'all'}
                  onChange={() => toggleObligation(obl.id)}
                />
                {obl.title}
              </label>
            ))}
          </div>
        </div>

        <div className={styles.cardHighlight}>
          <div className={styles.cardTitle}>
            <ShieldCheck className={styles.cardIconAccent} /> Alcance derivado
          </div>
          <div className={styles.counts}>
            <div>Obligaciones: <strong>{derivedCounts.obligationCount}</strong></div>
            <div>Riesgos derivados: <strong>{derivedCounts.riskCount}</strong></div>
            <div>Riesgos seleccionados: <strong>{riskIds.length}</strong></div>
            <div>Controles: <strong>{derivedCounts.controlCount}</strong></div>
            <div>Pruebas: <strong>{derivedCounts.testCount}</strong></div>
          </div>
        </div>
      </div>

      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <div>
            <div className={styles.tableTitle}>Riesgos</div>
            <div className={styles.tableSubtitle}>Selecciona los riesgos aplicables por obligaciones.</div>
          </div>
          <div className={styles.tableActions}>
            <span className={styles.countPill}>{risks.length} Total</span>
            <button className={styles.actionButton} onClick={selectAllRisks} disabled={risks.length === 0}>
              <CheckSquare size={14} /> Seleccionar todo
            </button>
            <button
              className={`${styles.actionButton} ${styles.actionGhost}`}
              onClick={clearRisks}
              disabled={riskIds.length === 0}
            >
              <FilterX size={14} /> Limpiar seleccion
            </button>
          </div>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead className={styles.thead}>
              <tr>
                <th className={styles.th}>
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => (allSelected ? clearRisks() : selectAllRisks())}
                    className={styles.checkbox}
                  />
                </th>
                <th className={styles.th}>Nivel</th>
                <th className={styles.th}>Riesgo</th>
                <th className={styles.th}>Tipo</th>
                <th className={styles.th}>Estado</th>
              </tr>
            </thead>
            <tbody className={styles.tbody}>
              {risksLoading && (
                <tr className={styles.emptyRow}>
                  <td colSpan={5}>Cargando riesgos...</td>
                </tr>
              )}
              {!risksLoading && risks.length === 0 && (
                <tr className={styles.emptyRow}>
                  <td colSpan={5}>
                    {mode === 'subset' && obligationIds.length === 0
                      ? 'Selecciona obligaciones para ver riesgos.'
                      : 'Sin riesgos para los criterios seleccionados.'}
                  </td>
                </tr>
              )}
              {risks.map((risk) => {
                const selected = riskIds.includes(risk.id);
                const layerLabel = (risk.riskLayerName || 'Sin capa').toUpperCase();
                return (
                  <tr key={risk.id} className={`${styles.tr} ${selected ? styles.trSelected : ''}`}>
                    <td className={styles.td}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleRisk(risk.id)}
                        className={styles.checkbox}
                      />
                    </td>
                    <td className={styles.td}>
                      <span className={`${styles.levelPill} ${getLayerClass(layerLabel)}`}>
                        {layerLabel}
                      </span>
                    </td>
                    <td className={styles.td}>
                      <div className={styles.riskTitle}>{risk.name}</div>
                      {risk.description && <div className={styles.riskSubtitle}>{risk.description}</div>}
                    </td>
                    <td className={styles.tdMuted}>{risk.riskTypeName || 'Sin tipo'}</td>
                    <td className={styles.tdMuted}>{risk.status || 'Sin estado'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <button className={styles.backButton} onClick={onBack}>Volver</button>
          <button className={styles.ghostButton} onClick={onSave}>Guardar</button>
          <button className={styles.questionnaireButton} onClick={onNext} disabled>Cuestionario</button>
          <button className={styles.primaryButton} onClick={onNext}>Continuar</button>
        </div>
      </div>
    </div>
  );
}
