import React from 'react';
import { BarChart3, Building2, Calendar, Shield, ArrowRight, Plus } from 'lucide-react';
import Link from 'next/link';

const mockAssessments = [
    {
        id: "1",
        company: "Banco Alpha",
        framework: "AML Ley 155-17",
        version: "v2.1",
        lastScore: 84.5,
        status: "Activo",
        period: "2024 - Q1",
        color: "#3b82f6"
    },
    {
        id: "2",
        company: "Seguros Beta",
        framework: "IFRS 17",
        version: "v1.0",
        lastScore: 92.1,
        status: "Activo",
        period: "2024 - Q1",
        color: "#10b981"
    },
    {
        id: "3",
        company: "Fintech Gamma",
        framework: "GDPR / Compliance",
        version: "v3.0",
        lastScore: 71.8,
        status: "Activo",
        period: "2024 - Q1",
        color: "#f59e0b"
    }
];

export default function ScorePage() {
    return (
        <div className="animate-fade-in">
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <BarChart3 className="text-primary" />
                    <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Gestión de Score Ejecutivo</h1>
                </div>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Nuevo Assessment
                </button>
            </div>

            <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', maxWidth: '800px', fontSize: '1.1rem', lineHeight: '1.6' }}>
                Transformando la biblioteca regulatoria en ejecuciones inmutables e independientes.
                Gestione expedientes institucionales con trazabilidad total y resultados reproducibles.
            </p>

            <div style={{ display: 'grid', gap: '1.25rem' }}>
                {mockAssessments.map(assessment => (
                    <Link key={assessment.id} href={`/score/${assessment.id}`} style={{ textDecoration: 'none' }}>
                        <div className="glass-card" style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '1.25rem 2rem',
                            cursor: 'pointer'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '14px',
                                    background: `rgba(${assessment.color === '#3b82f6' ? '59, 130, 246' :
                                        assessment.color === '#10b981' ? '16, 185, 129' : '245, 158, 11'}, 0.1)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: assessment.color
                                }}>
                                    <Building2 size={28} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.3rem', margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--foreground)' }}>{assessment.company}</h3>
                                    <div style={{ display: 'flex', gap: '1.25rem', fontSize: '0.85rem', color: 'var(--muted)' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Shield size={14} className="text-primary" /> {assessment.framework} (Build {assessment.version})
                                        </span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Calendar size={14} /> Corte: {assessment.period}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '3rem' }}>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>Último Score Calificado</div>
                                    <div style={{
                                        fontSize: '1.75rem',
                                        fontWeight: 800,
                                        color: assessment.lastScore > 85 ? 'var(--accent)' :
                                            assessment.lastScore > 75 ? 'var(--warning)' : 'var(--danger)'
                                    }}>
                                        {assessment.lastScore.toFixed(1)}%
                                    </div>
                                </div>
                                <div className={`badge ${assessment.status === 'Activo' ? 'badge-success' : 'badge-primary'}`} style={{ padding: '0.5rem 1rem' }}>
                                    {assessment.status}
                                </div>
                                <ArrowRight className="text-muted" size={20} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            <div style={{ marginTop: '3rem', padding: '1.5rem', borderLeft: '3px solid var(--primary)', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '0 12px 12px 0' }}>
                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', color: 'var(--primary)' }}>Nota de Integridad</h4>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)', lineHeight: '1.5' }}>
                    Cada score representa un <strong>ModelRun</strong> inmutable. Los resultados están vinculados a un
                    <em>ParameterSet</em> congelado y evidencia versionada. Ningún score puede ser alterado una vez ejecutada la corrida.
                </p>
            </div>
        </div>
    );
}

