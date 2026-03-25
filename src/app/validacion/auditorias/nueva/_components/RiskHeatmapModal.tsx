'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './RiskHeatmapModal.module.css';

type HeatmapRow = {
  rowId: string;
  riskCode?: string | null;
  elementName: string | null;
  customElementName?: string | null;
  riskName: string | null;
  probability?: number | null;
  impact?: number | null;
  baseScore: number | null;
  riskScore: number | null;
  mitigatingControlName: string | null;
  mitigationLevel: string | null;
};

type RiskHeatmapModalProps = {
  open: boolean;
  rows: HeatmapRow[];
  onClose: () => void;
  onLaunchAudit: () => void | Promise<void>;
};

type MetricMode = 'inherent' | 'residual';

const probabilityAxis = ['1 Muy Baja', '2 Baja', '3 Media', '4 Alta', '5 Muy Alta'];
const impactAxis = ['1 Muy Bajo', '2 Bajo', '3 Medio', '4 Alto', '5 Muy Alto'];

const jitterOffsets: Array<[number, number]> = [
  [0, 0],
  [-0.18, -0.18],
  [0.18, -0.18],
  [-0.18, 0.18],
  [0.18, 0.18],
  [-0.24, 0],
  [0.24, 0],
  [0, -0.24],
  [0, 0.24]
];

function clampLevel(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  if (value <= 1) return 1;
  if (value >= 5) return 5;
  const rounded = Math.round(value);
  if (rounded < 1 || rounded > 5) return null;
  return rounded;
}

function clampScatterCoord(value: number) {
  return Math.max(1.05, Math.min(4.95, value));
}

function normalizeInherentToLevel(score: number) {
  if (score <= 0) return 0;
  const level = Math.round(score / 4);
  return Math.max(0, Math.min(5, level));
}

function getBandByLevel(level: number) {
  if (level <= 1) return { label: 'Bajo', color: '#09b253' };
  if (level <= 3) return { label: 'Medio', color: '#f4c300' };
  if (level < 5) return { label: 'Medio Alto', color: '#b8a300' };
  return { label: 'Alto', color: '#ff3b30' };
}

function getSeverityByMetric(score: number, metric: MetricMode) {
  const level = metric === 'inherent' ? normalizeInherentToLevel(score) : score;
  return { ...getBandByLevel(level), level };
}

function getPlotLevel(score: number, metric: MetricMode) {
  if (metric === 'inherent') {
    return normalizeInherentToLevel(score);
  }
  return Math.max(1, Math.min(5, score));
}

function pickScore(row: HeatmapRow, metric: MetricMode): number | null {
  return metric === 'inherent' ? row.baseScore : row.riskScore;
}

export default function RiskHeatmapModal({ open, rows, onClose, onLaunchAudit }: RiskHeatmapModalProps) {
  const [metric, setMetric] = useState<MetricMode>('residual');
  const chartRef = useRef<HTMLDivElement | null>(null);

  const prepared = useMemo(() => {
    const validRows = rows
      .map((row) => ({
        row,
        probability: clampLevel(row.probability),
        impact: clampLevel(row.impact)
      }))
      .filter((item): item is { row: HeatmapRow; probability: number; impact: number } => item.probability !== null && item.impact !== null);

    const inCellCounter = new Map<string, number>();
    const points = validRows.map(({ row, probability, impact }) => {
      const score = pickScore(row, metric) ?? 0;
      const severity = getSeverityByMetric(score, metric);
      const key = `${probability}:${impact}`;
      const indexInCell = inCellCounter.get(key) ?? 0;
      inCellCounter.set(key, indexInCell + 1);
      const [jitterX, jitterY] = jitterOffsets[indexInCell % jitterOffsets.length];
      const riskLabel = row.riskName || row.riskCode || 'Riesgo';
      const elementLabel = row.customElementName || row.elementName || 'Elemento';
      const base = row.baseScore == null ? '--' : row.baseScore.toFixed(4);
      const residual = row.riskScore == null ? '--' : row.riskScore.toFixed(4);
      const level = getPlotLevel(score, metric);
      const stairShift = (level - 3) * 0.34;
      const yStair = clampScatterCoord(probability + stairShift + jitterY * 0.8);

      return {
        name: `${elementLabel} | ${riskLabel}`,
        value: [clampScatterCoord(impact + jitterX), yStair, score],
        symbolSize: 12 + Math.min(18, Math.max(0, score)),
        itemStyle: {
          color: 'rgba(255,255,255,0.08)',
          borderColor: '#ffffff',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: 'rgba(2,6,23,0.7)'
        },
        label: {
          show: true,
          formatter: riskLabel,
          position: 'right',
          color: '#0f172a',
          fontWeight: 700,
          fontSize: 11,
          padding: [0, 0, 0, 6]
        },
        tooltipHtml: [
          `<strong>${riskLabel}</strong>`,
          `${elementLabel}`,
          `Probabilidad: ${probability}`,
          `Impacto: ${impact}`,
          `Riesgo inherente: ${base}`,
          `Riesgo residual: ${residual}`,
          `Control: ${row.mitigatingControlName || 'Sin control'}${row.mitigationLevel ? ` (${row.mitigationLevel})` : ''}`
        ].join('<br/>')
      };
    });

    const topRows = [...rows]
      .map((row) => ({ row, score: row.riskScore ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    return {
      points,
      topRows,
      plottedCount: validRows.length,
      totalCount: rows.length
    };
  }, [metric, rows]);

  useEffect(() => {
    if (!open || !chartRef.current) return;

    let chart: any;
    let mounted = true;

    const mount = async () => {
      const echarts = await import('echarts');
      if (!mounted || !chartRef.current) return;

      chart = echarts.init(chartRef.current, undefined, { renderer: 'canvas' });
      chart.setOption({
        animation: false,
        backgroundColor: 'transparent',
        tooltip: {
          formatter: (params: any) => {
            if (params.seriesType === 'scatter') return params.data.tooltipHtml;
            return '';
          }
        },
        grid: {
          left: 120,
          right: 32,
          top: 42,
          bottom: 56,
          containLabel: true,
          show: true,
          borderWidth: 0,
          // Smooth radial half-moon with balanced color distribution.
          // Center slightly outside top-right; larger radius prevents green from dominating.
          backgroundColor: new echarts.graphic.RadialGradient(1.0, -0.02, 1.58, [
            { offset: 0.0, color: '#ff2f38' },   // rojo intenso
            { offset: 0.24, color: '#ff7a1f' },  // transición cálida
            { offset: 0.5, color: '#b8a300' },   // mostaza
            { offset: 0.74, color: '#f4c300' },  // amarillo
            { offset: 1.0, color: '#08b052' }    // verde
          ])
        },
        xAxis: {
          type: 'value',
          min: 1,
          max: 5,
          interval: 1,
          name: 'Impacto',
          nameLocation: 'middle',
          nameGap: 34,
          axisLabel: {
            color: 'rgba(255,255,255,0.88)',
            fontSize: 11,
            formatter: (value: number) => impactAxis[Math.round(value) - 1] || ''
          },
          nameTextStyle: { color: '#93a7c2', fontWeight: 700, fontSize: 12 },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.22)' } },
          splitArea: { show: false },
          splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.42)', width: 1 } }
        },
        yAxis: {
          type: 'value',
          min: 1,
          max: 5,
          interval: 1,
          name: 'Probabilidad',
          nameLocation: 'middle',
          nameGap: 72,
          axisLabel: {
            color: 'rgba(255,255,255,0.88)',
            fontSize: 11,
            formatter: (value: number) => probabilityAxis[Math.round(value) - 1] || ''
          },
          nameTextStyle: { color: '#93a7c2', fontWeight: 700, fontSize: 12 },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,0.22)' } },
          splitArea: { show: false },
          splitLine: { show: true, lineStyle: { color: 'rgba(255,255,255,0.42)', width: 1 } }
        },
        series: [
          {
            type: 'scatter',
            name: metric === 'inherent' ? 'Riesgo inherente' : 'Riesgo residual',
            data: prepared.points,
            symbol: 'circle',
            zlevel: 2
          }
        ]
      });
    };

    const onResize = () => {
      if (chart) chart.resize();
    };

    mount();
    window.addEventListener('resize', onResize);
    return () => {
      mounted = false;
      window.removeEventListener('resize', onResize);
      if (chart) chart.dispose();
    };
  }, [metric, open, prepared]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Mapa de calor de riesgo" onClick={onClose}>
      <div className={styles.modal} onClick={(event) => event.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <h3 className={styles.title}>Mapa de Calor de Riesgo</h3>
            <p className={styles.subtitle}>Matriz de auditoría 5x5 basada en Probabilidad vs Impacto</p>
          </div>
          <button type="button" className={styles.closeButton} onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className={styles.toolbar}>
          <div className={styles.metricSwitch}>
            <button
              type="button"
              className={`${styles.metricButton} ${metric === 'inherent' ? styles.metricButtonActive : ''}`}
              onClick={() => setMetric('inherent')}
            >
              Ver Inherente
            </button>
            <button
              type="button"
              className={`${styles.metricButton} ${metric === 'residual' ? styles.metricButtonActive : ''}`}
              onClick={() => setMetric('residual')}
            >
              Ver Residual
            </button>
          </div>
          <div className={styles.toolbarActions}>
            <button type="button" className={styles.launchAuditButton} onClick={onLaunchAudit}>
              Lanzar auditoría
            </button>
          </div>
          <p className={styles.toolbarHint}>
            Puntos en mapa: {prepared.plottedCount}/{prepared.totalCount}. Escala aplicada: 0-1 verde, 2-3 amarillo, 4 mostaza, 5+ rojo.
          </p>
        </div>
        <div className={styles.content}>
          {rows.length === 0 ? (
            <div className={styles.empty}>No hay filas para construir el mapa de calor.</div>
          ) : (
            <>
              <div className={styles.chart} ref={chartRef} />
              <aside className={styles.sidePanel}>
                <h4 className={styles.sideTitle}>Top Riesgos (Residual)</h4>
                <div className={styles.sideList}>
                  {prepared.topRows.map(({ row, score }, index) => {
                    const sev = getBandByLevel(score);
                    return (
                      <div key={row.rowId} className={styles.sideItem}>
                        <div className={styles.sideItemHeader}>
                          <span className={styles.sideRank}>#{index + 1}</span>
                          <span className={styles.sideScore}>{score.toFixed(4)}</span>
                        </div>
                        <div className={styles.sideRisk}>{row.riskCode || row.riskName || 'Riesgo'}</div>
                        <div className={styles.sideElement}>{row.customElementName || row.elementName || 'Elemento'}</div>
                        <div className={styles.sideMeta}>
                          <span style={{ color: sev.color }}>{sev.label}</span>
                          <span>{row.mitigatingControlName || 'Sin control'}</span>
                        </div>
                      </div>
                    );
                  })}
                  {prepared.topRows.length === 0 && <div className={styles.emptySmall}>Sin datos para ranking.</div>}
                </div>
              </aside>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
