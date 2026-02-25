import React from 'react';
import {
    Users,
    Calendar,
    Shield,
    ArrowLeft,
    Play,
    History,
    FileCheck,
    Info,
    Clock,
    CheckCircle2,
    AlertCircle,
    ChevronRight
} from 'lucide-react';
import Link from 'next/link';

export default function AssessmentDetailPage({ params }: { params: { id: string } }) {
    // En producción esto vendría de una consulta a corpus_assessment uniendo con corpus_company
    const assessment = {
        id: params.id,
        company: "Banco Alpha",
        framework: "AML Ley 155-17",
        version: "v2.1",
        status: "Activo",
        period: "2024 - Q1",
        color: "#3b82f6",
        created_at: "2024-01-15",
        created_by: "Admin System"
    };

    const mockEvaluations = [
        { id: "eval-1", status: "Ready", period: "2024-01-01 to 2024-03-31", controls_declared: 45, evidence_linked: 128, updated_at: "2024-02-20" },
        { id: "eval-2", status: "Draft", period: "2024-04-01 to 2024-06-30", controls_declared: 12, evidence_linked: 4, updated_at: "2024-02-23" }
    ];

    const mockRuns = [
        { id: "run-101", date: "2024-02-15 14:30", score: 84.5, parameter_set: "AML_v1.0_Standard", status: "Success", executor: "j.doe@alpha.com" },
        { id: "run-098", date: "2023-11-10 10:15", score: 79.2, parameter_set: "AML_v0.9_Draft", status: "Success", executor: "System Auto" }
    ];

    return (
        <div className="animate-fade-in">
            {/* Header / Breadcrumbs */}
            <div style={{ marginBottom: '2rem' }}>
                <Link href="/score" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '1rem' }}>
                    <ArrowLeft size={16} /> Volver a Expedientes
                </Link>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <div style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '18px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'var(--primary)',
                            border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                            <Shield size={36} />
                        </div>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                                <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>{assessment.company}</h1>
                                <div className="badge badge-success">Activo</div>
                            </div>
                            <div style={{ display: 'flex', gap: '1.5rem', color: 'var(--muted)', fontSize: '0.9rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <FileCheck size={16} className="text-secondary" /> {assessment.framework} (Build {assessment.version})
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Calendar size={16} /> Corte Administrativo: {assessment.period}
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Clock size={16} /> Creado: {assessment.created_at}
                                </span>
                            </div>
                        </div>
                    </div>

                    <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.8rem 1.8rem' }}>
                        <Play size={18} fill="currentColor" /> Ejecutar Motor
                    </button>
                </div>
            </div>

            {/* Grid for Operational & Historial */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '2rem' }}>

                {/* Section: Evaluations (WIP) */}
                <div className="glass-card" style={{ padding: '1.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                            <History className="text-primary" size={22} /> Fotogramas de Evaluación
                        </h2>
                        <button style={{
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--foreground)',
                            padding: '0.5rem 1rem',
                            borderRadius: '8px',
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            cursor: 'pointer'
                        }}>
                            + Nueva Foto
                        </button>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {mockEvaluations.map(evalu => (
                            <div key={evalu.id} className="sidebar-link" style={{
                                padding: '1.25rem',
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
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>Snapshot {evalu.id}</span>
                                        <div style={{
                                            fontSize: '0.7rem',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '6px',
                                            background: evalu.status === 'Ready' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                                            color: evalu.status === 'Ready' ? 'var(--accent)' : 'var(--warning)',
                                            border: '1px solid currentColor',
                                            fontWeight: 700,
                                            textTransform: 'uppercase'
                                        }}>
                                            {evalu.status}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'flex', gap: '1rem' }}>
                                        <span><strong>{evalu.controls_declared}</strong> controles</span>
                                        <span><strong>{evalu.evidence_linked}</strong> evidencias</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginBottom: '0.4rem' }}>{evalu.updated_at}</div>
                                    <ChevronRight size={18} className="text-muted" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Section: Model Runs (Historical) */}
                <div className="glass-card" style={{ padding: '1.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                        <h2 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600 }}>
                            <CheckCircle2 className="text-secondary" size={22} /> ModelRuns Inmutables
                        </h2>
                        <Link href={`/score/${params.id}/runs`} style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Ver Historial</Link>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {mockRuns.map(run => (
                            <div key={run.id} className="sidebar-link" style={{
                                padding: '1.25rem',
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
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '50%',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: run.score > 80 ? 'var(--accent)' : 'var(--warning)',
                                        fontSize: '1.2rem',
                                        fontWeight: 800,
                                        border: '2px solid currentColor'
                                    }}>
                                        {run.score.toFixed(0)}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--foreground)' }}>Run {run.id}</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{run.date} · {run.executor}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginBottom: '0.4rem', fontWeight: 500 }}>{run.parameter_set}</div>
                                    <Info size={18} className="text-primary" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            {/* Bottom Info: Audit Readiness */}
            <div className="glass-card" style={{
                marginTop: '3rem',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.08), transparent)',
                padding: '2rem'
            }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '12px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--primary)'
                    }}>
                        <AlertCircle size={32} />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 600 }}>Trazabilidad y Reproducibilidad Estricta</h4>
                        <p style={{ margin: 0, color: 'var(--muted)', fontSize: '1rem', lineHeight: '1.6', maxWidth: '1000px' }}>
                            Este contenedor institucional garantiza que cada ejecución del motor sea reproducible.
                            Al ejecutar un <strong>ModelRun</strong>, el sistema congela los pesos Wi, constantes α/β/γ y
                            el estado de las evidencias para asegurar que el score sea defendible ante auditorías e inspecciones futuras.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

