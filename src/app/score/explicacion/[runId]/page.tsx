import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Gauge,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { buildScoreSummary } from '@/lib/score-summary';
import { classifyCreScore } from '@/lib/score-engine';
import styles from './page.module.css';

type DriverRow = {
  control_code: string;
  control_name: string;
  uncovered_count: string | number;
  obligation_codes: string | null;
  risk_codes: string | null;
};

type ObligationRow = {
  obligation_code: string;
  title: string;
  criticality: number;
  evidence_strength: number;
  is_hard_gate: boolean;
};

function getBandTone(score: number) {
  const band = classifyCreScore(score);
  if (band === 'ROBUSTO') return { band, tone: styles.good };
  if (band === 'ESTABLE') return { band, tone: styles.good };
  if (band === 'EN_RIESGO') return { band, tone: styles.warning };
  if (band === 'FRAGIL') return { band, tone: styles.danger };
  return { band, tone: styles.danger };
}

function buildNarrative(params: {
  score: number;
  failedCount: number;
  passedCount: number;
  uncoveredCount: number;
  topDriver?: DriverRow;
  hardGateCount: number;
  evaluatedCount: number;
}) {
  const lines: string[] = [];

  if (params.evaluatedCount === 0) {
    return [
      'La corrida no tiene controles evaluados todavía, por eso el score se fija en 0 y no en una estimación intermedia.',
      'Hasta que exista al menos una evaluación válida en el paso 3, la lectura de exposición y drivers estructurales no es concluyente.',
    ];
  }

  if (params.score >= 85) {
    lines.push('La corrida refleja una postura de control robusta y con poca exposición remanente.');
  } else if (params.score >= 70) {
    lines.push('La corrida refleja una postura estable, pero todavía con focos que conviene cerrar antes de una revisión formal.');
  } else if (params.score >= 50) {
    lines.push('La corrida ya muestra una degradación material del sistema de control y requiere remediación priorizada.');
  } else {
    lines.push('La corrida muestra una fragilidad alta y una exposición que puede ser objetable en inspección.');
  }

  if (params.failedCount > 0) {
    lines.push(
      `Aunque ${params.passedCount} controles quedaron en cumple, ${params.failedCount} controles en no cumple bastaron para dejar ${params.uncoveredCount} obligaciones sin cobertura efectiva.`
    );
  }

  if (params.topDriver && Number(params.topDriver.uncovered_count) > 1) {
    lines.push(
      `${params.topDriver.control_code} es el principal driver estructural de la caída porque afecta ${params.topDriver.uncovered_count} obligaciones seleccionadas.`
    );
  }

  if (params.hardGateCount > 0) {
    lines.push(
      `La caída pesa más porque ${params.hardGateCount} de las obligaciones expuestas tienen naturaleza hard gate o de gobernanza crítica.`
    );
  }

  return lines;
}

export default async function ScoreExplanationPage({
  params,
}: {
  params: Promise<{ runId: string }>;
}) {
  const { runId } = await params;

  try {
    const summary = await buildScoreSummary(prisma, runId);
    const payload = summary.payload;
    const score = payload.score.final_score;
    const { band, tone } = getBandTone(score);

    const [topDriversRaw, uncoveredObligationsRaw] = payload.evaluatedCount === 0
      ? [[], []]
      : await Promise.all([
          prisma.$queryRaw`
            WITH failed_controls AS (
              SELECT rcd.control_id, c.code AS control_code, c.name AS control_name
              FROM score.run_control_draft rcd
              JOIN corpus.control c
                ON c.id = rcd.control_id
              WHERE rcd.run_id = ${runId}::uuid
                AND COALESCE(rcd.score, 0) = 0
            ),
            selected_controls AS (
              SELECT control_id, COALESCE(score, 0) AS eff
              FROM score.run_control_draft
              WHERE run_id = ${runId}::uuid
            ),
            selected_obligations AS (
              SELECT obligation_id
              FROM score.run_obligation_draft
              WHERE run_id = ${runId}::uuid
            ),
            uncovered AS (
              SELECT so.obligation_id
              FROM selected_obligations so
              LEFT JOIN corpus.map_obligation_control moc
                ON moc.obligation_id = so.obligation_id
              LEFT JOIN selected_controls sc
                ON sc.control_id = moc.control_id
              GROUP BY so.obligation_id
              HAVING MAX(COALESCE(sc.eff, 0)) = 0
            )
            SELECT
              fc.control_code,
              fc.control_name,
              COUNT(DISTINCT u.obligation_id) AS uncovered_count,
              STRING_AGG(DISTINCT o.code, ', ' ORDER BY o.code) AS obligation_codes,
              STRING_AGG(DISTINCT r.code, ', ' ORDER BY r.code) AS risk_codes
            FROM failed_controls fc
            LEFT JOIN corpus.map_obligation_control moc
              ON moc.control_id = fc.control_id
            LEFT JOIN uncovered u
              ON u.obligation_id = moc.obligation_id
            LEFT JOIN corpus.obligation o
              ON o.id = u.obligation_id
            LEFT JOIN corpus.map_risk_control mrc
              ON mrc.control_id = fc.control_id
            LEFT JOIN corpus.risk r
              ON r.id = mrc.risk_id
            GROUP BY fc.control_code, fc.control_name
            ORDER BY COUNT(DISTINCT u.obligation_id) DESC, fc.control_code ASC
          `,
          prisma.$queryRaw`
            WITH selected_controls AS (
              SELECT control_id, COALESCE(score, 0) AS eff
              FROM score.run_control_draft
              WHERE run_id = ${runId}::uuid
            ),
            selected_obligations AS (
              SELECT obligation_id
              FROM score.run_obligation_draft
              WHERE run_id = ${runId}::uuid
            )
            SELECT
              o.code AS obligation_code,
              o.title,
              o.criticality,
              o.evidence_strength,
              o.is_hard_gate
            FROM selected_obligations so
            JOIN corpus.obligation o
              ON o.id = so.obligation_id
            LEFT JOIN corpus.map_obligation_control moc
              ON moc.obligation_id = so.obligation_id
            LEFT JOIN selected_controls sc
              ON sc.control_id = moc.control_id
            GROUP BY o.code, o.title, o.criticality, o.evidence_strength, o.is_hard_gate
            HAVING MAX(COALESCE(sc.eff, 0)) = 0
            ORDER BY o.is_hard_gate DESC, o.criticality ASC, o.code ASC
          `,
        ]);

    const topDrivers = topDriversRaw as DriverRow[];
    const uncoveredObligations = uncoveredObligationsRaw as ObligationRow[];

    const hardGateCount = uncoveredObligations.filter((row) => row.is_hard_gate).length;
    const narrative = buildNarrative({
      score,
      failedCount: payload.controls.failed.length,
      passedCount: payload.controls.passed.length,
      uncoveredCount: uncoveredObligations.length,
      topDriver: topDrivers[0],
      hardGateCount,
      evaluatedCount: payload.evaluatedCount,
    });

    return (
      <div className={styles.page}>
        <div className={styles.shell}>
          <div className={styles.topbar}>
            <Link href={`/score/score?step=4&runId=${runId}`} className={styles.backLink}>
              <ArrowLeft size={16} />
              Volver al wizard
            </Link>
            <span className={`${styles.badge} ${tone}`}>{band}</span>
          </div>

          <section className={styles.hero}>
            <div className={styles.heroCopy}>
              <div className={styles.eyebrow}>Explicación determinística del score</div>
              <h1 className={styles.title}>Por qué esta corrida terminó con ese resultado</h1>
              <p className={styles.subtitle}>
                Esta pantalla no usa IA. La explicación sale de la misma corrida: controles evaluados, obligaciones
                expuestas, concentración y propagación del modelo.
              </p>
            </div>
            <div className={styles.scoreOrb}>
              <div className={styles.scoreLabel}>Score final</div>
              <div className={styles.scoreValue}>{score.toFixed(2)}</div>
              <div className={styles.scoreBand}>{band}</div>
            </div>
          </section>

          <section className={styles.metricsGrid}>
            <article className={styles.metricCard}>
              <Gauge size={18} />
              <div>
                <div className={styles.metricLabel}>Exposición base</div>
                <div className={styles.metricValue}>{payload.score.base_exposure.toFixed(2)}</div>
              </div>
            </article>
            <article className={styles.metricCard}>
              <TrendingDown size={18} />
              <div>
                <div className={styles.metricLabel}>Exposición final</div>
                <div className={styles.metricValue}>{payload.score.final_exposure.toFixed(2)}</div>
              </div>
            </article>
            <article className={styles.metricCard}>
              <ShieldCheck size={18} />
              <div>
                <div className={styles.metricLabel}>Controles en cumple</div>
                <div className={styles.metricValue}>{payload.controls.passed.length}</div>
              </div>
            </article>
            <article className={styles.metricCard}>
              <ShieldAlert size={18} />
              <div>
                <div className={styles.metricLabel}>Controles en no cumple</div>
                <div className={styles.metricValue}>{payload.controls.failed.length}</div>
              </div>
            </article>
          </section>

          <section className={styles.panelGrid}>
            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.panelEyebrow}>Lectura ejecutiva</div>
                  <h2 className={styles.panelTitle}>Qué significa el resultado</h2>
                </div>
                <span className={`${styles.badge} ${tone}`}>{band}</span>
              </div>
              <div className={styles.narrativeList}>
                {narrative.map((line) => (
                  <div key={line} className={styles.narrativeItem}>
                    <CheckCircle2 size={16} />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className={styles.panel}>
              <div className={styles.panelHeader}>
                <div>
                  <div className={styles.panelEyebrow}>Drivers estructurales</div>
                  <h2 className={styles.panelTitle}>Controles que más empujaron la caída</h2>
                </div>
              </div>
              <div className={styles.driverList}>
                {topDrivers.map((row) => (
                  <div key={row.control_code} className={styles.driverCard}>
                    <div className={styles.driverHead}>
                      <span className={styles.driverCode}>{row.control_code}</span>
                      <span className={`${styles.badge} ${styles.warning}`}>
                        {Number(row.uncovered_count)} obligaciones
                      </span>
                    </div>
                    <div className={styles.driverName}>{row.control_name}</div>
                    <div className={styles.driverMeta}>
                      <span>Obligaciones: {row.obligation_codes || 'Sin impacto directo en obligaciones seleccionadas'}</span>
                      <span>Riesgos: {row.risk_codes || 'Sin riesgo asociado en la corrida'}</span>
                    </div>
                  </div>
                ))}
                {topDrivers.length === 0 && (
                  <div className={styles.emptyState}>No hay drivers fallidos relevantes en esta corrida.</div>
                )}
              </div>
            </article>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelEyebrow}>Obligaciones expuestas</div>
                <h2 className={styles.panelTitle}>Obligaciones que quedaron sin cobertura efectiva</h2>
              </div>
              <span className={`${styles.badge} ${styles.danger}`}>{uncoveredObligations.length} abiertas</span>
            </div>
            <div className={styles.obligationGrid}>
              {uncoveredObligations.map((row) => (
                <div key={row.obligation_code} className={styles.obligationCard}>
                  <div className={styles.obligationHead}>
                    <span className={styles.driverCode}>{row.obligation_code}</span>
                    {row.is_hard_gate ? (
                      <span className={`${styles.badge} ${styles.danger}`}>Hard gate</span>
                    ) : (
                      <span className={`${styles.badge} ${styles.info}`}>Criticidad {row.criticality}</span>
                    )}
                  </div>
                  <div className={styles.obligationTitle}>{row.title}</div>
                  <div className={styles.obligationMeta}>
                    Fuerza de evidencia: {row.evidence_strength} · Severidad regulatoria: {row.criticality}
                  </div>
                </div>
              ))}
              {uncoveredObligations.length === 0 && (
                <div className={styles.emptyState}>La corrida no dejó obligaciones descubiertas.</div>
              )}
            </div>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeader}>
              <div>
                <div className={styles.panelEyebrow}>Descomposición del score</div>
                <h2 className={styles.panelTitle}>Cómo el motor transformó la corrida en un valor de 0 a 100</h2>
              </div>
            </div>
            <div className={styles.formulaStrip}>
              <div className={styles.formulaCard}>
                <div className={styles.formulaLabel}>Exposición base</div>
                <div className={styles.formulaValue}>{payload.score.base_exposure.toFixed(2)}</div>
                <p>Suma de obligaciones cuya mejor cobertura quedó degradada por los controles fallidos.</p>
              </div>
              <div className={styles.formulaCard}>
                <div className={styles.formulaLabel}>Concentración</div>
                <div className={styles.formulaValue}>{payload.score.concentration_factor.toFixed(3)}</div>
                <p>Amplifica la caída cuando varias fallas quedan concentradas en pocos dominios estructurales.</p>
              </div>
              <div className={styles.formulaCard}>
                <div className={styles.formulaLabel}>Propagación</div>
                <div className={styles.formulaValue}>{payload.score.propagation_exposure.toFixed(2)}</div>
                <p>Refleja el arrastre entre dominios cuando una debilidad afecta la lectura sistémica del programa AML.</p>
              </div>
              <div className={styles.formulaCard}>
                <div className={styles.formulaLabel}>Score final</div>
                <div className={styles.formulaValue}>{score.toFixed(2)}</div>
                <p>Resultado no lineal de la exposición final. No cae por promedio simple; cae por fragilidad acumulada.</p>
              </div>
            </div>
          </section>

          <section className={styles.notice}>
            <AlertTriangle size={18} />
            <div>
              <strong>Respuesta corta a la pregunta “por qué cayó tanto”.</strong>
              <span>
                {payload.evaluatedCount === 0
                  ? 'No cayó por fallas ya evaluadas; quedó en 0 porque la corrida todavía no tiene una sola evaluación válida en el paso 3.'
                  : 'No fue por controles aislados. Fue porque los controles en no cumple dejaron sin cobertura efectiva obligaciones seleccionadas y eso degradó materialmente el score.'}
              </span>
            </div>
          </section>
        </div>
      </div>
    );
  } catch {
    notFound();
  }
}
