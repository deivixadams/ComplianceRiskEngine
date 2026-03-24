'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styles from './RiskAnalysisStep.module.css';

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

type SaveRow = {
  riskId: string;
  elementId: string;
  probability: number;
  impact: number;
  connectivity: number;
  cascade: number;
  kFactor: number;
  scenario: string | null;
  source: string | null;
  analysisNotes: string | null;
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

const computeRiskScore = (row: Pick<RiskAnalysisRow, 'probability' | 'impact' | 'cascade' | 'kFactor'>) =>
  round6((row.probability * row.impact) * (1 + (row.kFactor * row.cascade)));

const toSavePayload = (rows: RiskAnalysisRow[]): SaveRow[] =>
  rows.map((row) => ({
    riskId: row.riskId,
    elementId: row.elementId,
    probability: row.probability,
    impact: row.impact,
    connectivity: row.connectivity,
    cascade: row.cascade,
    kFactor: row.kFactor,
    scenario: row.scenario?.trim() || null,
    source: row.source?.trim() || null,
    analysisNotes: row.analysisNotes?.trim() || null
  }));

export default function RiskAnalysisStep({ draftId, onBack, onNext, onSave }: RiskAnalysisStepProps) {
  const [rows, setRows] = useState<RiskAnalysisRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const loadRows = useCallback(async () => {
    if (!draftId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/audit/drafts/${draftId}/risk-analysis`, { cache: 'no-store' });
      if (!res.ok) throw new Error('No se pudo cargar el analisis de riesgo.');
      const data = await res.json();
      setRows(Array.isArray(data?.rows) ? data.rows : []);
    } catch (err: any) {
      setError(err?.message || 'Error cargando analisis de riesgo.');
      setRows([]);
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
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
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

  const updateRow = (riskId: string, elementId: string, patch: Partial<RiskAnalysisRow>) => {
    setRows((prev) =>
      prev.map((row) => {
        if (row.riskId !== riskId || row.elementId !== elementId) return row;
        const next = { ...row, ...patch, isOverridden: true };
        const probability = Math.max(0, Number(next.probability) || 0);
        const impact = Math.max(0, Number(next.impact) || 0);
        const cascade = clamp(Number(next.cascade) || 0, 0, 1);
        const kFactor = Math.max(0, Number(next.kFactor) || 0);
        const connectivity = clamp(Math.round(Number(next.connectivity) || 1), 1, 5);
        const baseScore = round6(probability * impact);
        const riskScore = computeRiskScore({ probability, impact, cascade, kFactor });
        const deltaScore = round6(riskScore - baseScore);
        return {
          ...next,
          probability: round4(probability),
          impact: round4(impact),
          cascade: round4(cascade),
          kFactor: round4(kFactor),
          connectivity,
          baseScore,
          riskScore,
          deltaScore
        };
      })
    );
  };

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const risk = `${row.riskCode || ''} ${row.riskName || ''}`.toLowerCase();
      const element = `${row.elementCode || ''} ${row.elementName || ''}`.toLowerCase();
      return risk.includes(term) || element.includes(term);
    });
  }, [rows, query]);

  const metrics = useMemo(() => {
    const total = rows.length;
    const overridden = rows.filter((row) => row.isOverridden).length;
    const avgRiskScore = total > 0
      ? round6(rows.reduce((acc, row) => acc + row.riskScore, 0) / total)
      : 0;
    return { total, overridden, avgRiskScore };
  }, [rows]);

  const handleSaveClick = async () => {
    const ok = await persist();
    if (ok) onSave();
  };

  const handleBackClick = async () => {
    await persist();
    onBack();
  };

  const handleNextClick = async () => {
    const ok = await persist();
    if (ok) onNext();
  };

  if (loading) {
    return <div className={styles.loading}>Cargando analisis de riesgo...</div>;
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h2 className={styles.title}>Analisis de Riesgo</h2>
        <p className={styles.subtitle}>
          Datos base desde <code>graph.v_risk_analyst</code>. Puedes ajustar valores y guardar el resultado para este borrador.
        </p>
      </div>

      <div className={styles.meta}>
        <span>{metrics.total} filas</span>
        <span>{metrics.overridden} editadas</span>
        <span>Score promedio {metrics.avgRiskScore.toFixed(4)}</span>
      </div>

      <div className={styles.searchBox}>
        <input
          className={styles.searchInput}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar por elemento o riesgo..."
        />
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Elemento</th>
              <th>Riesgo</th>
              <th>P</th>
              <th>I</th>
              <th>Conect.</th>
              <th>Cascada</th>
              <th>K</th>
              <th>Risk Score</th>
              <th>Fuente</th>
              <th>Escenario</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={10} className={styles.empty}>
                  No hay filas para mostrar.
                </td>
              </tr>
            )}
            {filteredRows.map((row) => (
              <tr key={`${row.elementId}::${row.riskId}`}>
                <td>
                  <div className={styles.stack}>
                    <strong>{row.elementCode || 'SIN-CODIGO'}</strong>
                    <span>{row.elementName || 'Sin nombre'}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.stack}>
                    <strong>{row.riskCode || 'SIN-CODIGO'}</strong>
                    <span>{row.riskName || 'Sin nombre'}</span>
                  </div>
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={row.probability}
                    onChange={(event) => updateRow(row.riskId, row.elementId, { probability: Number(event.target.value) })}
                    className={styles.numberInput}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={row.impact}
                    onChange={(event) => updateRow(row.riskId, row.elementId, { impact: Number(event.target.value) })}
                    className={styles.numberInput}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="1"
                    min={1}
                    max={5}
                    value={row.connectivity}
                    onChange={(event) => updateRow(row.riskId, row.elementId, { connectivity: Number(event.target.value) })}
                    className={styles.numberInput}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    value={row.cascade}
                    onChange={(event) => updateRow(row.riskId, row.elementId, { cascade: Number(event.target.value) })}
                    className={styles.numberInput}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={row.kFactor}
                    onChange={(event) => updateRow(row.riskId, row.elementId, { kFactor: Number(event.target.value) })}
                    className={styles.numberInput}
                  />
                </td>
                <td className={styles.scoreCell}>{row.riskScore.toFixed(4)}</td>
                <td>
                  <input
                    type="text"
                    value={row.source || ''}
                    onChange={(event) => updateRow(row.riskId, row.elementId, { source: event.target.value })}
                    className={styles.textInput}
                    placeholder="Fuente"
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={row.scenario || ''}
                    onChange={(event) => updateRow(row.riskId, row.elementId, { scenario: event.target.value })}
                    className={styles.textInput}
                    placeholder="Escenario"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={styles.footer}>
        <button className={styles.backButton} onClick={handleBackClick} disabled={saving}>
          Volver
        </button>
        <button className={styles.ghostButton} onClick={handleSaveClick} disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button className={styles.primaryButton} onClick={handleNextClick} disabled={saving}>
          Continuar
        </button>
      </div>
    </div>
  );
}
