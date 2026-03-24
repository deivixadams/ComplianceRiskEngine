"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Clock3,
  Filter,
  Search,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from "lucide-react";
import styles from "./page.module.css";

type FindingStatus = "Abierto" | "En remediacion" | "Cerrado" | "Escalado";

type FindingTracking = {
  id: string;
  auditCode: string;
  auditName: string;
  findingTitle: string;
  company: string;
  area: string;
  owner: string;
  severity: 1 | 2 | 3 | 4 | 5;
  status: FindingStatus;
  dueDate: string;
  daysOpen: number;
  progress: number;
};

const DUMMY_FINDINGS: FindingTracking[] = [
  {
    id: "F-001",
    auditCode: "AUD-AML-2026-01",
    auditName: "Auditoria AML Q1 2026",
    findingTitle: "Demora en ROS sobre alerta de alto impacto",
    company: "Banco Delta",
    area: "Monitoreo transaccional",
    owner: "Oficial de Cumplimiento",
    severity: 5,
    status: "En remediacion",
    dueDate: "2026-04-05",
    daysOpen: 32,
    progress: 58,
  },
  {
    id: "F-002",
    auditCode: "AUD-AML-2026-01",
    auditName: "Auditoria AML Q1 2026",
    findingTitle: "Control de sanciones con regla incompleta",
    company: "Banco Delta",
    area: "Listas y screening",
    owner: "Lider KYC",
    severity: 4,
    status: "Abierto",
    dueDate: "2026-03-28",
    daysOpen: 21,
    progress: 22,
  },
  {
    id: "F-003",
    auditCode: "AUD-CORP-2026-02",
    auditName: "Auditoria Corresponsalia 2026",
    findingTitle: "Evidencia insuficiente de EDD en banco corresponsal",
    company: "Financiera Norte",
    area: "Debida diligencia",
    owner: "Gerencia Riesgo Operativo",
    severity: 5,
    status: "Escalado",
    dueDate: "2026-03-25",
    daysOpen: 48,
    progress: 34,
  },
  {
    id: "F-004",
    auditCode: "AUD-DIG-2026-03",
    auditName: "Auditoria Canales Digitales 2026",
    findingTitle: "Falta de segregacion en autorizacion de alta de clientes",
    company: "Banco Horizonte",
    area: "Onboarding digital",
    owner: "Arquitectura de Control",
    severity: 4,
    status: "En remediacion",
    dueDate: "2026-04-18",
    daysOpen: 17,
    progress: 63,
  },
  {
    id: "F-005",
    auditCode: "AUD-DIG-2026-03",
    auditName: "Auditoria Canales Digitales 2026",
    findingTitle: "Reglas de monitoreo sin revision trimestral",
    company: "Banco Horizonte",
    area: "Gobierno de alertas",
    owner: "Equipo Analitica AML",
    severity: 3,
    status: "Cerrado",
    dueDate: "2026-03-15",
    daysOpen: 9,
    progress: 100,
  },
  {
    id: "F-006",
    auditCode: "AUD-PEP-2026-01",
    auditName: "Auditoria PEP y BO 2026",
    findingTitle: "Actualizacion tardia de perfil de cliente PEP",
    company: "Cooperativa Sur",
    area: "KYC continuo",
    owner: "Supervisor Debida Diligencia",
    severity: 3,
    status: "Abierto",
    dueDate: "2026-04-11",
    daysOpen: 12,
    progress: 18,
  },
];

const STATUS_FILTERS: Array<"Todos" | FindingStatus> = [
  "Todos",
  "Abierto",
  "En remediacion",
  "Escalado",
  "Cerrado",
];

function isOverdue(row: FindingTracking) {
  const due = new Date(`${row.dueDate}T00:00:00`);
  const now = new Date();
  return row.status !== "Cerrado" && due.getTime() < now.getTime();
}

function getStatusClass(status: FindingStatus) {
  if (status === "Cerrado") return styles.statusClosed;
  if (status === "Escalado") return styles.statusEscalated;
  if (status === "En remediacion") return styles.statusInProgress;
  return styles.statusOpen;
}

export default function SeguimintoDashboardPage() {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"Todos" | FindingStatus>("Todos");

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return DUMMY_FINDINGS.filter((row) => {
      const statusMatch = statusFilter === "Todos" || row.status === statusFilter;
      if (!statusMatch) return false;
      if (!term) return true;

      return (
        row.auditCode.toLowerCase().includes(term) ||
        row.auditName.toLowerCase().includes(term) ||
        row.findingTitle.toLowerCase().includes(term) ||
        row.company.toLowerCase().includes(term) ||
        row.owner.toLowerCase().includes(term)
      );
    });
  }, [query, statusFilter]);

  const stats = useMemo(() => {
    const total = DUMMY_FINDINGS.length;
    const openCritical = DUMMY_FINDINGS.filter(
      (row) => row.status !== "Cerrado" && row.severity >= 4
    ).length;
    const overdue = DUMMY_FINDINGS.filter(isOverdue).length;
    const avgProgress = Math.round(
      DUMMY_FINDINGS.reduce((acc, row) => acc + row.progress, 0) / total
    );

    return { total, openCritical, overdue, avgProgress };
  }, []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <div className={styles.eyebrow}>risk assessment / seguimiento</div>
            <h1 className={styles.title}>Seguiminto de hallazgos de auditoria</h1>
            <p className={styles.subtitle}>
              Vista consolidada de seguimiento para auditor: estado, avance y vencimientos
              de hallazgos provenientes de diferentes auditorias.
            </p>
          </div>
        </header>

        <section className={styles.kpiGrid}>
          <article className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Hallazgos totales</div>
            <div className={styles.kpiValue}>{stats.total}</div>
            <div className={styles.kpiHint}>
              <ShieldCheck size={14} />
              Seguimiento consolidado multi-auditoria
            </div>
          </article>

          <article className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Criticos abiertos</div>
            <div className={styles.kpiValue}>{stats.openCritical}</div>
            <div className={styles.kpiHint}>
              <AlertTriangle size={14} />
              Severidad 4-5 con cierre pendiente
            </div>
          </article>

          <article className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Fuera de plazo</div>
            <div className={styles.kpiValue}>{stats.overdue}</div>
            <div className={styles.kpiHint}>
              <Clock3 size={14} />
              Hallazgos vencidos y no cerrados
            </div>
          </article>

          <article className={styles.kpiCard}>
            <div className={styles.kpiLabel}>Avance promedio</div>
            <div className={styles.kpiValue}>{stats.avgProgress}%</div>
            <div className={styles.kpiHint}>
              <TrendingUp size={14} />
              Progreso agregado de planes de accion
            </div>
          </article>
        </section>

        <section className={styles.tableSection}>
          <div className={styles.toolbar}>
            <div className={styles.searchWrap}>
              <Search size={16} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por auditoria, hallazgo, empresa o responsable"
              />
            </div>

            <div className={styles.filterWrap}>
              <Filter size={15} />
              {STATUS_FILTERS.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? styles.filterActive : styles.filterButton}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Auditoria</th>
                  <th>Hallazgo</th>
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th>Severidad</th>
                  <th>Vence</th>
                  <th>Avance</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 && (
                  <tr>
                    <td className={styles.emptyCell} colSpan={7}>
                      No hay hallazgos para el filtro aplicado.
                    </td>
                  </tr>
                )}

                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <div className={styles.auditCell}>
                        <strong>{row.auditCode}</strong>
                        <span>{row.auditName}</span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.findingCell}>
                        <strong>{row.findingTitle}</strong>
                        <span>
                          {row.company} · {row.area}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className={styles.ownerCell}>
                        <UserRound size={14} />
                        {row.owner}
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.statusPill} ${getStatusClass(row.status)}`}>
                        {row.status}
                      </span>
                    </td>
                    <td>
                      <span className={styles.severity}>{row.severity}</span>
                    </td>
                    <td>
                      <div className={styles.dueCell}>
                        <span>{row.dueDate}</span>
                        <small>{row.daysOpen} dias abiertos</small>
                        {isOverdue(row) && <em>Vencido</em>}
                      </div>
                    </td>
                    <td>
                      <div className={styles.progressCell}>
                        <div className={styles.progressTrack}>
                          <div style={{ width: `${row.progress}%` }} />
                        </div>
                        <span>{row.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

