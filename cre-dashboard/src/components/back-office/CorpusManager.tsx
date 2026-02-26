'use client';

import {
    Globe,
    Book,
    Plus,
    Search,
    Filter,
    MoreVertical,
    ExternalLink,
    ChevronRight,
    Shield
} from "lucide-react";

export default function CorpusManager() {
    const jurisdictions = [
        { id: "DO", name: "República Dominicana", frameworks: 2, status: "Active" },
        { id: "PA", name: "Panamá", frameworks: 1, status: "Draft" },
    ];

    const frameworks = [
        {
            id: "F01",
            name: "Ley 155-17 (AML)",
            jurisdiction: "DO",
            version: "2024.1",
            obligations: 42,
            status: "Production"
        },
        {
            id: "F02",
            name: "Norma 01-22 (Bancos)",
            jurisdiction: "DO",
            version: "1.0",
            obligations: 18,
            status: "Active"
        },
    ];

    return (
        <div className="animate-fade-in">
            <div className="section-header">
                <Book className="text-primary" />
                <div>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Gestión del Corpus Normativo</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 'normal' }}>
                        Configuración de leyes, dominios y obligaciones del sistema
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: '1.5rem', marginTop: '2rem' }}>
                {/* Jurisdictions Panel */}
                <div className="glass-card" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Globe size={18} /> Jurisdicciones
                        </h3>
                        <button className="btn-primary" style={{ padding: '0.4rem', borderRadius: '6px' }}>
                            <Plus size={16} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {jurisdictions.map(j => (
                            <div
                                key={j.id}
                                style={{
                                    padding: '1rem',
                                    borderRadius: '12px',
                                    background: j.id === "DO" ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                                    border: j.id === "DO" ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                    cursor: 'pointer'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600' }}>
                                    <span>{j.name}</span>
                                    <span className="badge badge-primary">{j.id}</span>
                                </div>
                                <div style={{ fontSize: '0.8rem', marginTop: '0.4rem', color: 'var(--muted)' }}>
                                    {j.frameworks} Marcos Regulatorios
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Frameworks Panel */}
                <div className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                        <div style={{ position: 'relative', width: '300px' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar marco o ley..."
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
                                <Filter size={18} /> Filtros
                            </button>
                            <button className="btn-primary">
                                + Nuevo Marco
                            </button>
                        </div>
                    </div>

                    <table className="table-container">
                        <thead>
                            <tr>
                                <th>Marco / Nombre</th>
                                <th>Versión</th>
                                <th>Obligaciones</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {frameworks.map(f => (
                                <tr key={f.id} style={{ cursor: 'pointer' }} onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Shield className="text-primary" size={20} />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '600' }}>{f.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>ID: {f.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td><span className="badge badge-primary">{f.version}</span></td>
                                    <td>{f.obligations}</td>
                                    <td><span className={`badge ${f.status === 'Production' ? 'badge-success' : 'badge-primary'}`}>{f.status}</span></td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }} title="Editar">
                                                <MoreVertical size={20} />
                                            </button>
                                            <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }} title="Gestionar Obligaciones">
                                                <ChevronRight size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
