import {
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle2,
    Clock,
    FileText
} from "lucide-react";

export default function PortfolioDashboard() {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h2 style={{ fontSize: '1.25rem', opacity: 0.7 }}>Benchmark de Portafolio</h2>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>Visión General</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={18} />
                        Exportar Pack Auditoría
                    </button>
                </div>
            </div>

            {/* Main Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                <MetricCard
                    title="Score de Grupo"
                    value="74.2"
                    trend="+2.1"
                    trendType="up"
                    color="var(--primary)"
                />
                <MetricCard
                    title="Peor Empresa"
                    value="48.5"
                    trend="-5.4"
                    trendType="down"
                    color="var(--danger)"
                />
                <MetricCard
                    title="Gatillos Activos"
                    value="12"
                    subValue="En 3 empresas"
                    color="var(--warning)"
                />
                <MetricCard
                    title="Defendibilidad"
                    value="Alta"
                    subValue="Ready to audit"
                    color="var(--accent)"
                />
            </div>

            {/* Second Row: Heatmap Placeholders & Trends */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600' }}>Matriz Empresa × Dominio</h3>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.1)', borderRadius: '12px' }}>
                        <p style={{ opacity: 0.5 }}>[ Heatmap Visualizer - Coming Soon ]</p>
                    </div>
                </div>

                <div className="glass-card">
                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600' }}>Hotspots de Riesgo</h3>
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <HotspotItem title="D05 - PEP Monitoring" severity="Crítico" delta="+15%" />
                        <HotspotItem title="D02 - Compliance Capacity" severity="Alto" delta="+8%" />
                        <HotspotItem title="D06 - Transaction Reporting" severity="Medio" delta="-2%" />
                    </ul>
                </div>
            </div>

            {/* Third Row: Work Queue */}
            <div className="glass-card">
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', fontWeight: '600' }}>Cola de Trabajo Agregada</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', opacity: 0.6, fontSize: '0.9rem' }}>
                            <th style={{ padding: '0.75rem' }}>Acción</th>
                            <th style={{ padding: '0.75rem' }}>Empresa</th>
                            <th style={{ padding: '0.75rem' }}>Prioridad</th>
                            <th style={{ padding: '0.75rem' }}>Vencimiento</th>
                            <th style={{ padding: '0.75rem' }}>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <QueueRow action="Renovar Evidencia C-08" company="Bank Alpha" priority="Alta" due="En 2 días" status="Pendiente" />
                        <QueueRow action="Ejecutar Prueba D04" company="Fintech Beta" priority="Crítica" due="HOY" status="Atrasada" />
                        <QueueRow action="Revisar CAPA #441" company="Coop Gamma" priority="Media" due="En 5 días" status="En Proceso" />
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function MetricCard({ title, value, trend, trendType, subValue, color }: any) {
    return (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', borderLeft: `4px solid ${color}` }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.7, fontWeight: '500' }}>{title}</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 'bold' }}>{value}</span>
                {trend && (
                    <span style={{
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        color: trendType === 'up' ? 'var(--accent)' : 'var(--danger)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.2rem'
                    }}>
                        {trendType === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {trend}
                    </span>
                )}
            </div>
            {subValue && <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>{subValue}</span>}
        </div>
    );
}

function HotspotItem({ title, severity, delta }: any) {
    const color = severity === 'Crítico' ? 'var(--danger)' : severity === 'Alto' ? 'var(--warning)' : 'var(--primary)';
    return (
        <li style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>{title}</span>
                <span style={{ fontSize: '0.75rem', color, fontWeight: 'bold' }}>{severity}</span>
            </div>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', opacity: 0.8 }}>{delta}</span>
        </li>
    );
}

function QueueRow({ action, company, priority, due, status }: any) {
    return (
        <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '0.95rem' }}>
            <td style={{ padding: '1rem 0.75rem' }}>{action}</td>
            <td style={{ padding: '1rem 0.75rem' }}>{company}</td>
            <td style={{ padding: '1rem 0.75rem' }}>
                <span style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: priority === 'Crítica' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                    color: priority === 'Crítica' ? 'var(--danger)' : 'var(--warning)'
                }}>{priority}</span>
            </td>
            <td style={{ padding: '1rem 0.75rem' }}>{due}</td>
            <td style={{ padding: '1rem 0.75rem', opacity: 0.7 }}>{status}</td>
        </tr>
    );
}
