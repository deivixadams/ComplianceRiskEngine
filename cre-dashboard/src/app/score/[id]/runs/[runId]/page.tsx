import React from 'react';
import {
    ArrowLeft,
    ShieldAlert,
    Activity,
    Hash,
    Database,
    User,
    Calendar,
    ArrowUpRight,
    ArrowDownRight,
    Search,
    Download,
    Lock
} from 'lucide-react';
import Link from 'next/link';

export default function ModelRunResultPage({ params }: { params: { id: string, runId: string } }) {
    const runData = {
        id: params.runId,
        date: "2024-02-15 14:30:22",
        status: "Success",
        executor: "j.doe@bancoalpha.com",
        engineVersion: "v1.2.4-stable",
        parameterSet: "AML_Standard_v2.0",
        totalScore: 84.52,
        confidenceLevel: 98.2, // Score de defensa/evidencia
        inputHash: "sha256:7f8e9a44b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6",
        outputHash: "sha256:4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4g5h",
        domains: [
            { name: "Debida Diligencia (KYC)", score: 92.4, exposure: 0.15, trend: 'up' },
            { name: "Monitoreo de Transacciones", score: 76.8, exposure: 0.45, trend: 'down' },
            { name: "Estructura de Gobierno", score: 88.0, exposure: 0.20, trend: 'stable' },
            { name: "Reportes Regulatorios", score: 81.2, exposure: 0.20, trend: 'up' }
        ],
        drivers: [
            { type: 'negative', label: "Falta de Pruebas de Estrés en Monitoreo", impact: -8.4, critical: true },
            { type: 'positive', label: "Manuales de Procedimiento Actualizados", impact: +5.2, critical: false },
            { type: 'negative', label: "Evidencia de Capacitación Vencida (Q4)", impact: -3.1, critical: false },
            { type: 'positive', label: "Integridad de Datos en Onboarding", impact: +4.5, critical: true }
        ]
    };

    return (
        <div className="animate-fade-in">
            {/* Nav */}
            <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <Link href={`/score/${params.id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                        <ArrowLeft size={16} /> Volver al Expediente
                    </Link>
                    <h1 style={{ fontSize: '1.75rem', margin: 0, fontWeight: 700 }}>Resultado de ModelRun <span className="text-primary">#{runData.id}</span></h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className="glass-card" style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer', margin: 0 }}>
                        <Download size={16} /> Exportar Reporte
                    </button>
                    <button className="btn-primary" style={{ padding: '0.5rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Search size={16} /> Detalles Crudos
                    </button>
                </div>
            </div>

            {/* Top Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid var(--primary)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Score Final</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--foreground)' }}>{runData.totalScore.toFixed(2)}%</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '0.25rem' }}>Estable vs anterior</div>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid var(--accent)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Confidence (Nivel de Defensa)</div>
                    <div style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--accent)' }}>{runData.confidenceLevel}%</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Basado en evidencia recolectada</div>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid var(--secondary)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Parameter Set</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, margin: '0.5rem 0' }}>{runData.parameterSet}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
                        <Lock size={12} /> Sello de Inmutabilidad
                    </div>
                </div>
                <div className="glass-card" style={{ textAlign: 'center', borderTop: '4px solid var(--warning)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Fecha de Ejecución</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0.6rem 0' }}>{runData.date}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Build: {runData.engineVersion}</div>
                </div>
            </div>

            {/* Main Analysis Area */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>

                {/* Domain Breakdown */}
                <div className="glass-card" style={{ padding: '1.75rem' }}>
                    <h3 style={{ marginBottom: '1.75rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                        <Activity className="text-primary" size={22} /> Desglose por Dominio Normativo
                    </h3>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {runData.domains.map(domain => (
                            <div key={domain.name}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.95rem' }}>
                                    <span style={{ fontWeight: 600 }}>{domain.name}</span>
                                    <span style={{ fontWeight: 700 }}>{domain.score}%</span>
                                </div>
                                <div style={{ height: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '5px', overflow: 'hidden', border: '1px solid var(--glass-border)' }}>
                                    <div style={{
                                        width: `${domain.score}%`,
                                        height: '100%',
                                        background: domain.score > 85 ? 'var(--accent)' : domain.score > 70 ? 'var(--warning)' : 'var(--danger)',
                                        borderRadius: '5px'
                                    }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--muted)' }}>
                                    Contribución: <strong>{(domain.exposure * 100).toFixed(0)}%</strong> del score total
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Drivers / Explainability */}
                <div className="glass-card" style={{ padding: '1.75rem' }}>
                    <h3 style={{ marginBottom: '1.75rem', fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                        <ShieldAlert className="text-secondary" size={22} /> Drivers Estructurales de Riesgo
                    </h3>
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {runData.drivers.map((driver, idx) => (
                            <div key={idx} style={{
                                padding: '1.25rem',
                                borderRadius: '12px',
                                background: 'rgba(0,0,0,0.2)',
                                border: `1px solid ${driver.type === 'negative' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{
                                        padding: '0.4rem',
                                        borderRadius: '8px',
                                        background: driver.type === 'negative' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                                        color: driver.type === 'negative' ? 'var(--danger)' : 'var(--accent)'
                                    }}>
                                        {driver.type === 'negative' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.95rem', fontWeight: 600 }}>{driver.label}</span>
                                        {driver.critical && <span style={{ fontSize: '0.7rem', color: 'var(--danger)', fontWeight: 700, textTransform: 'uppercase' }}>Crítico</span>}
                                    </div>
                                </div>
                                <div style={{
                                    fontSize: '1rem',
                                    fontWeight: 800,
                                    color: driver.type === 'negative' ? 'var(--danger)' : 'var(--accent)'
                                }}>
                                    {driver.impact > 0 ? '+' : ''}{driver.impact.toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Forensic / Audit Footprint */}
            <div className="glass-card" style={{ marginTop: '3rem', padding: '2rem', background: 'rgba(0,0,0,0.4)', borderRadius: '20px' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Database size={18} /> Huella Forense del Modelo (Audit Proof)
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2.5rem' }}>
                    <div>
                        <h4 style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.05em' }}>
                            <Hash size={14} /> Input Bundle Hash (Evidence Snapshot)
                        </h4>
                        <code style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(59,130,246,0.1)', padding: '0.6rem 1rem', borderRadius: '6px', display: 'block', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            {runData.inputHash}
                        </code>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.05em' }}>
                            <Database size={14} /> Output Record Hash (Sello de Resultado)
                        </h4>
                        <code style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'rgba(59,130,246,0.1)', padding: '0.6rem 1rem', borderRadius: '6px', display: 'block', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                            {runData.outputHash}
                        </code>
                    </div>
                    <div>
                        <h4 style={{ fontSize: '0.75rem', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', letterSpacing: '0.05em' }}>
                            <User size={14} /> Certificado Digitalmente por
                        </h4>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--foreground)' }}>{runData.executor}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.25rem' }}>Auth Token: k8s-node-7742-prod</div>
                        <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--primary)', fontWeight: 600 }}>ID de Corrida: {runData.id}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

