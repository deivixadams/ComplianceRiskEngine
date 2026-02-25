import React from 'react';
import {
    Calculator,
    ChevronRight,
    ShieldCheck,
    Lock,
    Clock,
    Plus,
    ArrowLeft,
    CheckCircle2,
    Database,
    Hash
} from 'lucide-react';
import Link from 'next/link';

export default function ParametrosPage() {
    const parameterSets = [
        {
            id: "ps-001",
            version: "v2.0 Standard",
            framework: "AML Ley 155-17",
            status: "Aprobado",
            hash: "sha256:882e3344b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2",
            updated_at: "2024-02-10",
            approved_by: "Comité de Riesgos"
        },
        {
            id: "ps-002",
            version: "v2.1 Preview",
            framework: "AML Ley 155-17",
            status: "Borrador",
            hash: "WIP (Hash Pendiente)",
            updated_at: "2024-02-23",
            approved_by: "-"
        }
    ];

    return (
        <div className="animate-fade-in">
            <div className="section-header">
                <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', marginRight: '1rem' }}>
                    <ArrowLeft size={16} /> Volver
                </Link>
                <Calculator className="text-primary" size={24} />
                <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Parámetros del Motor</h1>
            </div>

            <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', maxWidth: '800px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Defina la lógica matemática inmutable del motor. Configure pesos Wi, constantes de calibración y gatillos
                que se congelan al ejecutar cada ModelRun para garantizar la defensa institucional.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 2fr)) 350px', gap: '2rem' }}>

                {/* Parameter Sets List */}
                <div className="glass-card" style={{ padding: '1.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
                        <h2 style={{ fontSize: '1.3rem', margin: 0, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <Clock className="text-primary" size={22} /> ParameterSets Inmutables
                        </h2>
                        <button className="btn-primary" style={{ padding: '0.6rem 1.2rem', fontSize: '0.85rem', fontWeight: 600 }}>+ Nueva Versión</button>
                    </div>

                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                        {parameterSets.map(ps => (
                            <div key={ps.id} className="sidebar-link" style={{
                                padding: '1.5rem',
                                borderRadius: '12px',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--glass-border)',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                margin: 0
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.6rem' }}>
                                        <span style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--foreground)' }}>{ps.version}</span>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '6px',
                                            background: ps.status === 'Aprobado' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                            color: ps.status === 'Aprobado' ? 'var(--accent)' : 'var(--muted)',
                                            border: '1px solid currentColor',
                                            fontWeight: 700,
                                            textTransform: 'uppercase'
                                        }}>
                                            {ps.status}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '0.75rem' }}>
                                        Framework: <strong>{ps.framework}</strong> · Actualizado: {ps.updated_at}
                                    </div>
                                    {ps.hash !== 'WIP (Hash Pendiente)' && (
                                        <div style={{ position: 'relative' }}>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(59,130,246,0.05)', padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid rgba(59,130,246,0.1)' }}>
                                                <Hash size={12} /> <span style={{ fontFamily: 'monospace' }}>{ps.hash}</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: '0.5rem', fontWeight: 500 }}>{ps.approved_by}</div>
                                    <ChevronRight size={20} className="text-muted" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Engine Constants (Current Active) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="glass-card" style={{ padding: '1.75rem' }}>
                        <h3 style={{ fontSize: '1.15rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                            <Database className="text-secondary" size={20} /> Constantes Base (α, β, γ)
                        </h3>
                        <div style={{ display: 'grid', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Alfa (α)</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Factor Base</span>
                                </div>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>0.40</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Beta (β)</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Factor Sistémico</span>
                                </div>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--secondary)' }}>0.35</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '10px', border: '1px solid var(--glass-border)' }}>
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Gamma (γ)</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--muted)' }}>Factor Concentración</span>
                                </div>
                                <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent)' }}>0.25</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card" style={{
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), transparent)',
                        padding: '1.5rem'
                    }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--accent)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                            <ShieldCheck size={20} /> Integridad Estructural
                        </h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: '1.6', margin: 0 }}>
                            Este módulo controla la calibración institucional. Cualquier modificación impacta
                            directamente en la generación de <strong>ModelRuns</strong> futuros. Los runs pasados
                            están protegidos por firmas criptográficas vinculadas a estas versiones.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

