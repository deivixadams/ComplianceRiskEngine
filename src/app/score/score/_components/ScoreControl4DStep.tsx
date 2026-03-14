'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import styles from './ScoreControl4DStep.module.css';

type ControlItem = {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  control_type_code?: string | null;
  required_test?: boolean | null;
  is_active?: boolean | null;
  control_objective?: string | null;
  systemic_effect?: string | null;
  dependency_logic?: string | null;
  failure_mode?: string | null;
  evaluation_4d?: {
    dimensions: Record<DimensionKey, DimensionStatus>;
    notes: string;
  } | null;
};

type DimensionKey = 'existencia' | 'formalizacion' | 'operacion';
type DimensionStatus = 'cumple' | 'parcial' | 'no_cumple' | '';

type ControlEvaluation = {
  controlId: string;
  dimensions: Record<DimensionKey, DimensionStatus>;
  notes: string;
  dimensionNotes: Record<DimensionKey, string>;
};

type Props = {
  runId: string | null;
  evaluations: ControlEvaluation[];
  onChange: (next: ControlEvaluation[]) => void;
  onStatsChange?: (stats: { total: number; evaluated: number }) => void;
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

const DIMENSIONS: { key: DimensionKey; label: string; helper: string }[] = [
  { key: 'existencia', label: 'Existencia', helper: 'Existe el control de forma verificable.' },
  { key: 'formalizacion', label: 'Formalizacion', helper: 'Documentado, aprobado y vigente.' },
  { key: 'operacion', label: 'Operacion', helper: 'Funciona de forma consistente.' },
];

const DIMENSION_KEY_MAP: Record<string, DimensionKey> = {
  EXISTENCE: 'existencia',
  FORMALIZATION: 'formalizacion',
  OPERATION: 'operacion',
};

export default function ScoreControl4DStep({
  runId,
  evaluations,
  onChange,
  onStatsChange,
  onBack,
  onNext,
  onSave,
}: Props) {
  const [controls, setControls] = useState<ControlItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkApplying, setBulkApplying] = useState(false);
  const [query, setQuery] = useState('');
  const [activeControlId, setActiveControlId] = useState<string | null>(null);
  const [criteriaByDimension, setCriteriaByDimension] = useState<Record<DimensionKey, string[]>>({
    existencia: [],
    formalizacion: [],
    operacion: [],
  });
  const [criteriaLoading, setCriteriaLoading] = useState(false);
  const [dimensionTestCounts, setDimensionTestCounts] = useState<Record<DimensionKey, number>>({
    existencia: 0,
    formalizacion: 0,
    operacion: 0,
  });

  useEffect(() => {
    if (!runId) return;
    let alive = true;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/score/runs/${runId}/controls`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar controles');
        if (!alive) return;
        const list = Array.isArray(data.controls) ? data.controls : [];
        setControls(list);
        if (list.length > 0) {
          const seeded = list
            .filter((c: any) => c.evaluation_4d)
            .map((c: any) => ({
              controlId: c.id,
              dimensions: c.evaluation_4d.dimensions,
              notes: c.evaluation_4d.notes || '',
            }));
          if (seeded.length > 0) onChange(seeded);
        }
        setActiveControlId((prev) => (prev && list.some((c: any) => c.id === prev) ? prev : list[0]?.id || null));
      } catch {
        if (alive) setControls([]);
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => {
      alive = false;
    };
  }, [runId]);

  const filteredControls = useMemo(() => {
    const term = query.trim().toLowerCase();
    const base = term
      ? controls.filter((control) => (control.name || '').toLowerCase().includes(term))
      : controls;
    return [...base].sort((a, b) =>
      String(a.code || '').localeCompare(String(b.code || ''), 'es', { sensitivity: 'base' })
    );
  }, [controls, query]);

  const evalMap = useMemo(() => {
    const map = new Map<string, ControlEvaluation>();
    evaluations.forEach((ev) => map.set(ev.controlId, ev));
    return map;
  }, [evaluations]);

  const activeControl = useMemo(
    () => controls.find((control) => control.id === activeControlId) || null,
    [controls, activeControlId]
  );

  const activeIndex = useMemo(() => {
    if (!activeControlId) return -1;
    return filteredControls.findIndex((control) => control.id === activeControlId);
  }, [filteredControls, activeControlId]);

  const prevControl = useMemo(() => {
    if (activeIndex <= 0) return null;
    return filteredControls[activeIndex - 1] || null;
  }, [filteredControls, activeIndex]);

  const nextControl = useMemo(() => {
    if (activeIndex < 0 || activeIndex >= filteredControls.length - 1) return null;
    return filteredControls[activeIndex + 1] || null;
  }, [filteredControls, activeIndex]);

  const activeHasStatus = useMemo(() => {
    if (!activeControl) return false;
    const evaluation = evalMap.get(activeControl.id);
    return Boolean(evaluation && Object.values(evaluation.dimensions || {}).some((v) => v));
  }, [activeControl, evalMap]);

  useEffect(() => {
    if (!runId || !activeControlId) {
      setCriteriaByDimension({
        existencia: [],
        formalizacion: [],
        operacion: [],
      });
      return;
    }
    let alive = true;
    const loadCriteria = async () => {
      setCriteriaLoading(true);
      try {
        const res = await fetch(`/api/score/runs/${runId}/controls/${activeControlId}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar criterios');
        const next: Record<DimensionKey, string[]> = {
          existencia: [],
          formalizacion: [],
          operacion: [],
        };
        const criteria = data?.criteriaByDimension;
        if (criteria && typeof criteria === 'object') {
          Object.entries(criteria).forEach(([key, list]) => {
            const mapped = DIMENSION_KEY_MAP[String(key).toUpperCase()];
            if (!mapped) return;
            next[mapped] = Array.isArray(list) ? list.map((v) => String(v)) : [];
          });
        }
        const counts: Record<DimensionKey, number> = {
          existencia: 0,
          formalizacion: 0,
          operacion: 0,
        };
        const rawCounts = data?.dimensionTestCounts;
        if (rawCounts && typeof rawCounts === 'object') {
          Object.entries(rawCounts).forEach(([key, value]) => {
            const mapped = DIMENSION_KEY_MAP[String(key).toUpperCase()];
            if (!mapped) return;
            counts[mapped] = Number(value) || 0;
          });
        }
        if (!alive) return;
        setCriteriaByDimension(next);
        setDimensionTestCounts(counts);
      } catch {
        if (alive) {
          setCriteriaByDimension({
            existencia: [],
            formalizacion: [],
            operacion: [],
          });
          setDimensionTestCounts({
            existencia: 0,
            formalizacion: 0,
            operacion: 0,
          });
        }
      } finally {
        if (alive) setCriteriaLoading(false);
      }
    };
    loadCriteria();
    return () => {
      alive = false;
    };
  }, [runId, activeControlId]);

  const saveEvaluation = async (controlId: string, evaluation: ControlEvaluation) => {
    if (!runId) return;
    const res = await fetch(`/api/score/runs/${runId}/controls/${controlId}/evaluation`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ evaluation }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || `No se pudo guardar la evaluacion del control ${controlId}`);
    }
  };

  const buildPassingEvaluation = (control: ControlItem, existing?: ControlEvaluation): ControlEvaluation => ({
    controlId: control.id,
    dimensions: {
      existencia: 'cumple',
      formalizacion: 'cumple',
      operacion: control.required_test !== false ? 'cumple' : '',
    },
    notes: existing?.notes || '',
    dimensionNotes: {
      existencia: existing?.dimensionNotes?.existencia || '',
      formalizacion: existing?.dimensionNotes?.formalizacion || '',
      operacion: existing?.dimensionNotes?.operacion || '',
    },
  });

  const updateEvaluation = (controlId: string, patch: Partial<ControlEvaluation>) => {
    const existing = evalMap.get(controlId);
    const nextItem: ControlEvaluation = {
      controlId,
      dimensions: (existing?.dimensions as Record<DimensionKey, DimensionStatus>) || {
        existencia: '',
        formalizacion: '',
        operacion: '',
      },
      notes: existing?.notes || '',
      dimensionNotes: existing?.dimensionNotes || {
        existencia: '',
        formalizacion: '',
        operacion: '',
      },
      ...patch,
    };
    const next = evaluations.filter((ev) => ev.controlId !== controlId);
    next.push(nextItem);
    onChange(next);
    saveEvaluation(controlId, nextItem);
  };


  const updateDimension = (controlId: string, key: DimensionKey, status: DimensionStatus) => {
    const existing = evalMap.get(controlId);
    const nextDims = {
      existencia: existing?.dimensions?.existencia || '',
      formalizacion: existing?.dimensions?.formalizacion || '',
      operacion: existing?.dimensions?.operacion || '',
    };
    nextDims[key] = nextDims[key] === status ? '' : status;
    updateEvaluation(controlId, { dimensions: nextDims as Record<DimensionKey, DimensionStatus> });
  };

  const handleCumpleTodo = () => {
    if (!runId || controls.length === 0 || bulkApplying) return;

    const nextEvaluations = controls.map((control) =>
      buildPassingEvaluation(control, evalMap.get(control.id))
    );

    onChange(nextEvaluations);
    setBulkApplying(true);

    Promise.all(
      nextEvaluations.map((evaluation) => saveEvaluation(evaluation.controlId, evaluation))
    )
      .catch((error) => {
        console.error('Error applying passing evaluation to all controls:', error);
      })
      .finally(() => {
        setBulkApplying(false);
      });
  };

  const evaluatedCount = useMemo(() => {
    return evaluations.filter((ev) => Object.values(ev.dimensions || {}).some((v) => v)).length;
  }, [evaluations]);

  useEffect(() => {
    if (!onStatsChange) return;
    onStatsChange({ total: controls.length, evaluated: evaluatedCount });
  }, [controls.length, evaluatedCount, onStatsChange]);

  if (!runId) {
    return (
      <div className={styles.root}>
        <div className={styles.emptyState}>
          <AlertTriangle className={styles.emptyIcon} />
          <div>
            <h3>Necesitas una corrida activa</h3>
            <p>Completa el Paso 2 para generar la seleccion estructural.</p>
          </div>
        </div>
        <div className={styles.footer}>
          <div className={styles.footerActions}>
            <button className={styles.backButton} onClick={onBack}>Volver</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerIntro}>
        </div>
        <div className={styles.headerMeta} />
      </div>

      <div className={styles.controlStrip}>
        {loading && <div className={styles.empty}>Cargando controles...</div>}
        {!loading && filteredControls.length === 0 && (
          <div className={styles.empty}>No hay controles seleccionados.</div>
        )}
        {!loading && activeControl && (
          <div className={styles.controlStripCard}>
            <div className={styles.controlCardHeader}>
              {activeHasStatus && <span className={styles.statusDot} />}
            </div>
            <div className={styles.controlName}>
              {activeControl.name}
              {activeControl.control_type_code ? (
                <span className={styles.controlCodeInline}>{activeControl.control_type_code}</span>
              ) : null}
              {activeControl.code ? (
                <span className={styles.controlCodeInline}>{activeControl.code}</span>
              ) : null}
              {typeof activeControl.is_active === 'boolean' ? (
                <span className={styles.controlCodeInline}>
                  {activeControl.is_active ? 'Activo' : 'Inactivo'}
                </span>
              ) : null}
            </div>
            <div className={styles.controlRow}>
              <span className={styles.controlLabel}>Descripcion</span>
              <span className={styles.controlValue}>{activeControl.description || 'Sin descripcion registrada.'}</span>
            </div>
            {activeControl.control_objective && (
              <div className={styles.controlRow}>
                <span className={styles.controlLabel}>Objetivo del control</span>
                <span className={styles.controlValue}>{activeControl.control_objective}</span>
              </div>
            )}
            {activeControl.systemic_effect && (
              <div className={styles.controlRow}>
                <span className={styles.controlLabel}>Efecto sistémico</span>
                <span className={styles.controlValue}>{activeControl.systemic_effect}</span>
              </div>
            )}
            {activeControl.dependency_logic && (
              <div className={styles.controlRow}>
                <span className={styles.controlLabel}>Dependencia</span>
                <span className={styles.controlValue}>{activeControl.dependency_logic}</span>
              </div>
            )}
            {activeControl.failure_mode && (
              <div className={styles.controlRow}>
                <span className={styles.controlLabel}>Modo de falla</span>
                <span className={`${styles.controlValue} ${styles.controlValueFailure}`}>
                  {activeControl.failure_mode}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <section className={styles.content}>
          {!activeControl && (
            <div className={styles.emptyState}>
              <AlertTriangle className={styles.emptyIcon} />
              <div>
                <h3>Sin control seleccionado</h3>
                <p>Selecciona un control desde la tarjeta superior para evaluar sus dimensiones.</p>
              </div>
            </div>
          )}

          {activeControl && (
            <div className={styles.detailStack}>
              <div className={styles.cardGrid}>
                {(activeControl.required_test === false
                  ? DIMENSIONS.filter((dim) => dim.key !== 'operacion')
                  : DIMENSIONS
                ).map((dimension) => {
                  const current = evalMap.get(activeControl.id)?.dimensions?.[dimension.key] || '';
                  const dimensionNotes = evalMap.get(activeControl.id)?.dimensionNotes?.[dimension.key] || '';
                  const hasTests = dimension.key === 'operacion'
                    ? activeControl.required_test !== false
                    : true;
                  return (
                    <div key={dimension.key} className={styles.dimensionRow}>
                      <div
                        className={`${styles.subCard} ${!hasTests ? styles.subCardDisabled : ''}`}
                      >
                        <div className={styles.subCardTitle}>{dimension.label}</div>
                        <div className={styles.subCardBody}>{dimension.helper}</div>
                        <div className={styles.textBlock}>
                          <textarea
                            value={dimensionNotes}
                            onChange={(e) => {
                            const existing = evalMap.get(activeControl.id);
                            const nextNotes = {
                              existencia: existing?.dimensionNotes?.existencia || '',
                              formalizacion: existing?.dimensionNotes?.formalizacion || '',
                              operacion: existing?.dimensionNotes?.operacion || '',
                              };
                              nextNotes[dimension.key] = e.target.value;
                              updateEvaluation(activeControl.id, { dimensionNotes: nextNotes });
                            }}
                            className={styles.textarea}
                            rows={4}
                            disabled={!hasTests}
                          />
                        </div>
                        <div className={styles.actionRow}>
                          <button type="button" className={styles.evidenceButton} disabled={!hasTests}>
                            Cargar evidencia
                          </button>
                          <button
                            type="button"
                            className={`${styles.statusButton} ${styles.statusCumple} ${current === 'cumple' ? styles.statusActive : ''}`}
                            onClick={() => updateDimension(activeControl.id, dimension.key, 'cumple')}
                            disabled={!hasTests}
                          >
                            Cumple
                          </button>
                          {dimension.key !== 'existencia' && (
                            <button
                              type="button"
                              className={`${styles.statusButton} ${styles.statusParcial} ${current === 'parcial' ? styles.statusActive : ''}`}
                              onClick={() => updateDimension(activeControl.id, dimension.key, 'parcial')}
                              disabled={!hasTests}
                            >
                              Cumple parcial
                            </button>
                          )}
                          <button
                            type="button"
                            className={`${styles.statusButton} ${styles.statusNoCumple} ${current === 'no_cumple' ? styles.statusActive : ''}`}
                            onClick={() => updateDimension(activeControl.id, dimension.key, 'no_cumple')}
                            disabled={!hasTests}
                          >
                            No cumple
                          </button>
                        </div>
                      </div>
                      <div className={styles.criteriaCard}>
                        <div className={styles.criteriaTitle}>Como se evalua</div>
                        <div className={styles.criteriaBody}>
                          {criteriaLoading && (
                            <div className={styles.criteriaLine}>Cargando criterios...</div>
                          )}
                          {!criteriaLoading && criteriaByDimension[dimension.key].length === 0 && (
                            <div className={styles.criteriaLine}>Sin criterios registrados.</div>
                          )}
                          {!criteriaLoading && criteriaByDimension[dimension.key].map((item) => (
                            <div key={item} className={styles.criteriaLine}>{item}</div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}
      </section>

      <div className={styles.footer}>
        <div className={styles.footerActions}>
          <div className={styles.footerNav}>
            <button
              type="button"
              className={styles.controlNavButton}
              onClick={() => prevControl && setActiveControlId(prevControl.id)}
              disabled={!prevControl}
            >
              Control anterior
            </button>
            <div className={styles.controlNavMeta}>
              Control {activeIndex + 1} de {filteredControls.length}
            </div>
            <button
              type="button"
              className={styles.controlNavButtonPrimary}
              onClick={() => nextControl && setActiveControlId(nextControl.id)}
              disabled={!nextControl}
            >
              Control siguiente
            </button>
            <button
              type="button"
              className={styles.cumpleTodoButton}
              onClick={handleCumpleTodo}
              disabled={!activeControl || bulkApplying}
            >
              {bulkApplying ? 'Aplicando...' : 'Cumple todo'}
            </button>
          </div>
          <div className={styles.footerRight}>
            <button className={styles.backButton} onClick={onBack}>Volver</button>
            <button className={styles.ghostButton} onClick={onSave}>Guardar</button>
            <button className={styles.primaryButton} onClick={onNext}>
              Continuar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
