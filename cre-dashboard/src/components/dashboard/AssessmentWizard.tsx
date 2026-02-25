"use client";

import {
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    ShieldCheck,
    FileText,
    Activity,
    AlertCircle,
    Paperclip,
    Info,
    type LucideIcon
} from "lucide-react";
import { useState } from "react";

interface AssessmentWizardProps {
    obligationId?: string;
    obligationName?: string;
}

export default function AssessmentWizard({ obligationId = "O001", obligationName = "Designación de Oficial de Cumplimiento" }: AssessmentWizardProps) {
    const [step, setStep] = useState(1);
    const [evaluations, setEvaluations] = useState<{ existence: boolean | null, formalization: string, practice: string }>({
        existence: null, // boolean | null
        formalization: 'Bajo', // Bajo, Medio, Alto
        practice: 'Bajo'
    });

    const dimensions = [
        { id: 1, name: "Existencia", icon: ShieldCheck, desc: "¿Existe el control institucionalmente?" },
        { id: 2, name: "Formalización", icon: FileText, desc: "¿Está documentado y aprobado formalmente?" },
        { id: 3, name: "Práctica", icon: Activity, desc: "¿Se ejecuta operativamente con regularidad?" },
        { id: 4, name: "Evidencia", icon: Paperclip, desc: "Vinculación de pruebas y archivos" },
    ];

    return (
        <div className="glass-card animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem' }}>
            {/* Header */}
            <div style={{ marginBottom: '2.5rem', textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Evaluación Estructural de Control</h2>
                <div className="gradient-text" style={{ fontWeight: '600' }}>{obligationId}: {obligationName}</div>
            </div>

            {/* Stepper */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '12px', left: '0', right: '0', height: '2px', background: 'var(--glass-border)', zIndex: 0 }}></div>
                {dimensions.map(d => (
                    <div
                        key={d.id}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            zIndex: 1,
                            width: '100px',
                            cursor: 'pointer'
                        }}
                        onClick={() => setStep(d.id)}
                    >
                        <div style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            background: step >= d.id ? 'var(--primary)' : 'var(--background)',
                            border: '2px solid' + (step >= d.id ? 'var(--primary)' : 'var(--glass-border)'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.75rem',
                            transition: 'all 0.3s ease'
                        }}>
                            {step > d.id ? <CheckCircle2 size={16} color="white" /> : <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: step === d.id ? 'white' : 'transparent' }}></div>}
                        </div>
                        <span style={{ fontSize: '0.75rem', fontWeight: step === d.id ? '700' : '500', color: step === d.id ? 'var(--primary)' : 'var(--muted)' }}>{d.name}</span>
                    </div>
                ))}
            </div>

            {/* Content Area */}
            <div className="glass-card" style={{ padding: '2rem', minHeight: '300px', margin: 0, background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {(() => {
                            const Icon = dimensions[step - 1].icon as LucideIcon;
                            return <Icon size={24} className="text-primary" />;
                        })()}
                    </div>
                    <div>
                        <h3 style={{ fontSize: '1.2rem', margin: 0 }}>{dimensions[step - 1].name}</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--muted)', margin: 0 }}>{dimensions[step - 1].desc}</p>
                    </div>
                </div>

                {/* Step 1: Existence */}
                {step === 1 && (
                    <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '3rem' }}>
                        <button
                            onClick={() => setEvaluations({ ...evaluations, existence: true })}
                            style={{
                                width: '160px',
                                padding: '2rem',
                                borderRadius: '16px',
                                border: evaluations.existence === true ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                                background: evaluations.existence === true ? 'var(--primary-glow)' : 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem',
                                color: 'white'
                            }}
                        >
                            <CheckCircle2 size={32} />
                            <span style={{ fontWeight: '600' }}>SÍ EXISTE</span>
                        </button>
                        <button
                            onClick={() => setEvaluations({ ...evaluations, existence: false })}
                            style={{
                                width: '160px',
                                padding: '2rem',
                                borderRadius: '16px',
                                border: evaluations.existence === false ? '2px solid var(--danger)' : '1px solid var(--glass-border)',
                                background: evaluations.existence === false ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                                cursor: 'pointer',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem',
                                color: 'white'
                            }}
                        >
                            <AlertCircle size={32} />
                            <span style={{ fontWeight: '600' }}>NO EXISTE</span>
                        </button>
                    </div>
                )}

                {/* Step 2/3: Scaling */}
                {(step === 2 || step === 3) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                        {['Bajo', 'Medio', 'Alto'].map(level => (
                            <div
                                key={level}
                                onClick={() => setEvaluations({ ...evaluations, [step === 2 ? 'formalization' : 'practice']: level })}
                                style={{
                                    padding: '1.25rem',
                                    borderRadius: '12px',
                                    border: evaluations[step === 2 ? 'formalization' : 'practice'] === level ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                                    background: evaluations[step === 2 ? 'formalization' : 'practice'] === level ? 'var(--primary-glow)' : 'rgba(255,255,255,0.03)',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <span style={{ fontWeight: '600' }}>Nivel {level}</span>
                                {evaluations[step === 2 ? 'formalization' : 'practice'] === level && <CheckCircle2 size={20} className="text-primary" />}
                            </div>
                        ))}
                        <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: 'var(--muted)', marginTop: '1rem' }}>
                            <Info size={14} style={{ marginRight: '0.5rem' }} />
                            {levelInfo(step === 2 ? evaluations.formalization : evaluations.practice)}
                        </div>
                    </div>
                )}

                {/* Step 4: Evidence */}
                {step === 4 && (
                    <div>
                        <div className="glass-card" style={{ borderStyle: 'dashed', textAlign: 'center', padding: '3rem', margin: 0 }}>
                            <Paperclip size={40} style={{ color: 'var(--muted)', marginBottom: '1rem' }} />
                            <div>Arrastra archivos o haz clic para subir evidencia</div>
                            <button className="btn-primary" style={{ marginTop: '1.5rem' }}>Seleccionar Archivos</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Footer Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                <button
                    onClick={() => setStep(Math.max(1, step - 1))}
                    disabled={step === 1}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'none',
                        border: 'none',
                        color: step === 1 ? 'var(--muted)' : 'var(--foreground)',
                        cursor: step === 1 ? 'default' : 'pointer'
                    }}
                >
                    <ChevronLeft size={20} /> Anterior
                </button>
                <button
                    onClick={() => setStep(Math.min(4, step + 1))}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                    {step === 4 ? 'Finalizar Evaluación' : 'Siguiente'} <ChevronRight size={20} />
                </button>
            </div>
        </div>
    );
}

function levelInfo(level: string) {
    if (level === 'Bajo') return "Evidencia mínima o inexistente. No cumple los criterios base.";
    if (level === 'Medio') return "Existe documentación parcial. Se ejecuta ocasionalmente.";
    return "Documentación completa, aprobada y ejecución demostrada con evidencia.";
}
