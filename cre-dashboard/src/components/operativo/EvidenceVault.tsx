import {
    FileCheck,
    Clock,
    Trash2,
    Eye,
    AlertTriangle,
    FileBadge,
    Download,
    Filter,
    Search
} from "lucide-react";

export default function EvidenceVault() {
    const evidenceList = [
        {
            id: "EV-001",
            name: "Acta Comité AML Q4-2023",
            type: "Acta",
            version: "1.0",
            control: "Gobierno Corporativo",
            date: "2023-12-15",
            status: "Vigente"
        },
        {
            id: "EV-002",
            name: "Manual de Debida Diligencia",
            type: "Política",
            version: "2.1",
            control: "KYC / Onboarding",
            date: "2024-01-10",
            status: "Vigente"
        },
        {
            id: "EV-003",
            name: "Muestreo Monitoreo de Alertas (Oct)",
            type: "Reporte",
            version: "1.0",
            control: "Monitoreo",
            date: "2023-10-30",
            status: "Vencida"
        },
    ];

    return (
        <div className="animate-fade-in">
            <div className="section-header">
                <FileBadge className="text-primary" />
                <div>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Bóveda de Evidencia (Asset Vault)</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 'normal' }}>
                        Repositorio estructurado de activos probatorios y trazabilidad institucional
                    </p>
                </div>
            </div>

            <div className="glass-card" style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ position: 'relative', width: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, control o ID..."
                            style={{
                                width: '100%',
                                padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                borderRadius: '12px',
                                color: 'white'
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button className="glass-card" style={{ padding: '0.75rem', display: 'flex', gap: '0.5rem', alignItems: 'center', margin: 0 }}>
                            <Filter size={18} /> Filtrar
                        </button>
                        <button className="btn-primary">
                            Cargar Evidencia
                        </button>
                    </div>
                </div>

                <table className="table-container">
                    <thead>
                        <tr>
                            <th>ID / Nombre del Archivo</th>
                            <th>Tipo</th>
                            <th>Versión</th>
                            <th>Control Vinculado</th>
                            <th>Fecha Carga</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {evidenceList.map(ev => (
                            <tr key={ev.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <FileCheck size={18} className="text-primary" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{ev.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{ev.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td><span style={{ fontSize: '0.85rem' }}>{ev.type}</span></td>
                                <td><span className="badge badge-primary">{ev.version}</span></td>
                                <td><span style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{ev.control}</span></td>
                                <td><span style={{ fontSize: '0.85rem' }}>{ev.date}</span></td>
                                <td>
                                    <span className={`badge ${ev.status === 'Vigente' ? 'badge-success' : 'badge-danger'}`} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', width: 'fit-content' }}>
                                        {ev.status === 'Vencida' && <AlertTriangle size={12} />}
                                        {ev.status}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }} title="Ver Detalle">
                                            <Eye size={18} />
                                        </button>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }} title="Descargar">
                                            <Download size={18} />
                                        </button>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }} title="Historial">
                                            <Clock size={18} />
                                        </button>
                                        <button style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', opacity: 0.6 }} title="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Total Assets</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>1,284</div>
                    <div style={{ color: 'var(--accent)', fontSize: '0.75rem', marginTop: '0.5rem' }}>+12 este mes</div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Evidencia Vencida</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--danger)' }}>18</div>
                    <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.5rem' }}>Requiere actualización</div>
                </div>
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Almacenamiento (S3)</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>4.2 GB</div>
                    <div style={{ color: 'var(--primary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>84% disponible</div>
                </div>
            </div>
        </div>
    );
}
