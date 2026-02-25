import Link from "next/link";
import {
    PlayCircle,
    Calendar,
    User,
    ArrowRight,
    TrendingDown,
    TrendingUp,
    History,
    Shield,
    Search
} from "lucide-react";

export default function RunHistory() {
    const runs = [
        {
            id: "RUN-2024-001",
            date: "2024-02-15 10:30",
            user: "Juan Pérez",
            score: 72,
            prevScore: 78,
            status: "Finalizado",
            jurisdiction: "DO",
            framework: "Ley 155-17"
        },
        {
            id: "RUN-2024-002",
            date: "2024-02-23 09:12",
            user: "María López",
            score: 65,
            prevScore: 72,
            status: "Finalizado",
            jurisdiction: "DO",
            framework: "Ley 155-17"
        },
        {
            id: "RUN-2024-003",
            date: "2024-02-23 18:00",
            user: "Sistema (Auto)",
            score: 68,
            prevScore: 65,
            status: "En Proceso",
            jurisdiction: "DO",
            framework: "Ley 155-17"
        },
    ];

    return (
        <div className="animate-fade-in">
            <div className="section-header">
                <History className="text-primary" />
                <div>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Historial de Ejecuciones (ModelRuns)</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 'normal' }}>
                        Trazabilidad inmutable de scores, snapshots de parámetros y evaluaciones históricas
                    </p>
                </div>
            </div>

            <div className="glass-card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar ejecución..."
                                style={{
                                    width: '100%',
                                    padding: '0.6rem 0.6rem 0.6rem 2.5rem',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid var(--glass-border)',
                                    borderRadius: '10px',
                                    color: 'white'
                                }}
                            />
                        </div>
                    </div>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <PlayCircle size={18} /> Nueva Evaluación
                    </button>
                </div>

                <table className="table-container">
                    <thead>
                        <tr>
                            <th>ID / Fecha</th>
                            <th>Evaluador</th>
                            <th>Marco / Jurisdicción</th>
                            <th>Score Global</th>
                            <th>Tendencia</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {runs.map(run => (
                            <tr key={run.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Calendar size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{run.id}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{run.date}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                        <User size={14} className="text-muted" />
                                        {run.user}
                                    </div>
                                </td>
                                <td>
                                    <div>
                                        <div style={{ fontSize: '0.85rem' }}>{run.framework}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{run.jurisdiction}</div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '1.1rem', fontWeight: '800', color: run.score > 70 ? 'var(--danger)' : 'var(--accent)' }}>
                                        {run.score}
                                    </div>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: run.score < run.prevScore ? 'var(--accent)' : 'var(--danger)' }}>
                                        {run.score < run.prevScore ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                                        <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                                            {Math.abs(run.score - run.prevScore).toFixed(1)} pts
                                        </span>
                                    </div>
                                </td>
                                <td>
                                    <span className={`badge ${run.status === 'Finalizado' ? 'badge-primary' : 'badge-success'}`} style={{ opacity: run.status === 'En Proceso' ? 0.8 : 1 }}>
                                        {run.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        {run.status === 'En Proceso' ? (
                                            <Link
                                                href={`/evaluations/${run.id}/workbench`}
                                                style={{ color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '800', fontSize: '0.85rem' }}
                                            >
                                                Workbench <ArrowRight size={14} />
                                            </Link>
                                        ) : (
                                            <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', fontSize: '0.85rem' }}>
                                                Ver Snapshot <ArrowRight size={14} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '2rem', background: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '1.5rem', borderRadius: '16px', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Shield size={24} color="white" />
                </div>
                <div>
                    <h4 style={{ margin: 0, fontSize: '1.1rem' }}>Snapshot de Integridad</h4>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem', color: 'var(--muted)' }}>
                        Cada ModelRun guarda una copia inmutable del corpus normativo y los parámetros de ponderación vigentes en el momento de la ejecución para garantizar reproducibilidad total ante auditores.
                    </p>
                </div>
            </div>
        </div>
    );
}
