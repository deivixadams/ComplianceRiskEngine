"use client";

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    BarChart3,
    BookOpen,
    CheckCircle2,
    ChevronRight,
    FileText,
    Info,
    Layers,
    Layout,
    Lock,
    Play,
    Save,
    ShieldAlert,
    Search,
    Filter,
    History,
    AlertTriangle,
    RefreshCw,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import styles from './EvaluationWorkbench.module.css';
import { computeControlEffectiveness } from '@/lib/engine-v3';

// --- API Helpers ---

const fetcher = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error('API Error');
    return res.json();
};

// --- Sub-components ---

const EvaluationContextHeader = ({ context, isRunning, onRun }: any) => (
    <div className={styles.contextHeader}>
        <div className={styles.headerTitleArea}>
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: '0.75rem' }}>
                <Layout size={24} className="text-blue-500" />
            </div>
            <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h1 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Evaluation Workbench <span style={{ color: '#3b82f6' }}>V3</span></h1>
                    <span className={styles.statusBadge}>
                        {context?.evaluation?.statusId === 2 ? 'Archivado / Locked' : 'Borrador'}
                    </span>
                </div>
                <p style={{ fontSize: '0.85rem', color: '#71717a' }}>
                    {context?.assessment?.name || 'Loading...'} • {context?.framework?.name} ({context?.version?.version})
                </p>
            </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className={`${styles.actionButton} ${styles.btnSecondary}`} style={{ width: 'auto' }}>
                <History size={16} /> Auditoría
            </button>
            <button
                className={`${styles.actionButton} ${styles.btnPrimary}`}
                style={{ width: 'auto', background: '#3b82f6' }}
                onClick={onRun}
                disabled={isRunning || context?.evaluation?.statusId === 2}
            >
                {isRunning ? <RefreshCw className="animate-spin" size={16} /> : <Zap size={16} />}
                {isRunning ? 'Procesando...' : 'Lock & Run Engine'}
            </button>
        </div>
    </div>
);

const ControlCard = ({ control, state, onUpdate }: any) => {
    const effectiveness = useMemo(() => {
        return computeControlEffectiveness({
            design: 1.0,
            formalization: state?.formalizationEffectiveness || 0,
            operation: 0.4,
            coverage: state?.coverageEffectiveness || 0,
            recency: state?.recencyEffectiveness || 0,
            evidenceValidated: state?.evidenceValidated || false,
            applicable: state?.applicability !== 'not_applicable'
        });
    }, [state]);

    const handleChange = (field: string, value: any) => {
        onUpdate(control.id, { ...state, [field]: value });
    };

    return (
        <div className={styles.controlCard} style={{ opacity: state?.applicability === 'not_applicable' ? 0.5 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '10px', color: '#3b82f6' }}>
                        {control.code}
                    </div>
                    <div>
                        <h4 style={{ fontWeight: 800, fontSize: '0.95rem' }}>{control.name}</h4>
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem' }}>
                            <span>Mitigación: <strong>{control.inherentMitigationStrength}</strong></span>
                            <span>•</span>
                            <span>Automation: <strong>{control.automationId === 1 ? 'Manual' : 'Auto'}</strong></span>
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.65rem', color: '#71717a', fontWeight: 'bold', letterSpacing: '0.05em' }}>EFFECTIVENESS (C)</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: effectiveness === 1 ? '#10b981' : effectiveness === 0 ? '#ef4444' : '#fff' }}>
                        {effectiveness !== null ? (effectiveness * 100).toFixed(1) + '%' : 'EXCL'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
                {[
                    { key: 'formalizationEffectiveness', label: 'Formalización (F)' },
                    { key: 'coverageEffectiveness', label: 'Cobertura (V)' },
                    { key: 'recencyEffectiveness', label: 'Recency (R)' },
                    { key: 'state', label: 'Estado', type: 'select', options: ['pass', 'fail', 'warning'] }
                ].map((metric) => (
                    <div key={metric.key}>
                        <div style={{ fontSize: '0.65rem', color: '#71717a', textTransform: 'uppercase', marginBottom: '0.4rem', fontWeight: 700 }}>{metric.label}</div>
                        {metric.type === 'select' ? (
                            <select
                                className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-xs outline-none focus:border-blue-500"
                                value={state?.[metric.key] || 'fail'}
                                onChange={(e) => handleChange(metric.key, e.target.value)}
                            >
                                {metric.options?.map(o => <option key={o} value={o}>{o.toUpperCase()}</option>)}
                            </select>
                        ) : (
                            <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="1"
                                value={state?.[metric.key] || 0}
                                onChange={(e) => handleChange(metric.key, parseFloat(e.target.value))}
                                className="w-full bg-black/40 border border-white/10 rounded-md p-2 text-sm text-center focus:border-blue-500 outline-none"
                            />
                        )}
                    </div>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(255,255,255,0.02)', borderRadius: '0.5rem', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}>
                    <input
                        type="checkbox"
                        checked={state?.evidenceValidated || false}
                        onChange={(e) => handleChange('evidenceValidated', e.target.checked)}
                        className="w-4 h-4 rounded border-white/10 bg-white/5"
                    />
                    Evidencia Validada
                </label>

                <div style={{ flex: 1 }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.7rem', color: '#71717a', fontWeight: 700 }}>APPLICABILITY:</span>
                    <select
                        className="bg-transparent border-none text-xs font-bold outline-none text-blue-400 cursor-pointer"
                        value={state?.applicability || 'applicable'}
                        onChange={(e) => handleChange('applicability', e.target.value)}
                    >
                        <option value="applicable">APPLICABLE</option>
                        <option value="not_applicable">N/A (EXCLUDE)</option>
                    </select>
                </div>
            </div>
        </div>
    );
};

// --- Main Workbench ---

const AuditBanner = ({ findings }: { findings: any[] }) => {
    const openFindings = findings?.filter(f => f.status === 'open') || [];
    if (openFindings.length === 0) return null;

    const criticalCount = openFindings.filter(f => f.severity >= 4).length;

    return (
        <div style={{
            background: 'linear-gradient(90deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            padding: '0.75rem 1.5rem',
            borderRadius: '0.75rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'pulse 3s infinite'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <ShieldAlert size={18} className="text-red-500" />
                <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                    {criticalCount > 0 ? '⚠ HALLAZGOS MATERIALES DETECTADOS' : 'NOTIFICACIONES DE AUDITORÍA'}
                </span>
                <span style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>
                    Existen {openFindings.length} hallazgos abiertos impactando el score determinista.
                </span>
            </div>
            <Link href={`/auditoria/evaluations/${openFindings[0].evaluationId}/findings`} style={{ fontSize: '0.75rem', fontWeight: 900, color: '#ef4444', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                REVISAR IMPACTO <ChevronRight size={14} />
            </Link>
        </div>
    );
};

export default function WorkbenchPage() {
    const { id } = useParams();
    const queryClient = useQueryClient();
    const [activeObligationId, setActiveObligationId] = useState<string | null>(null);

    // Queries
    const { data: context } = useQuery({
        queryKey: ['eval-context', id],
        queryFn: () => fetcher(`/api/evaluations/${id}/context`)
    });

    const { data: obligations, isLoading: loadingObligations } = useQuery({
        queryKey: ['eval-obligations', id],
        queryFn: () => fetcher(`/api/evaluations/${id}/obligations`)
    });

    const { data: findings } = useQuery({
        queryKey: ['eval-findings', id],
        queryFn: () => fetcher(`/api/audit/findings?evaluationId=${id}`)
    });

    // Mutations
    const updateControlMutation = useMutation({
        mutationFn: ({ controlId, state }: any) =>
            fetch(`/api/evaluations/${id}/controls/${controlId}/state`, {
                method: 'PUT',
                body: JSON.stringify(state)
            }).then(res => res.json()),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['eval-obligations', id] });
        }
    });

    const runEngineMutation = useMutation({
        mutationFn: () =>
            fetch(`/api/evaluations/${id}/run`, { method: 'POST' }).then(res => res.json()),
        onSuccess: (data) => {
            alert(`Model Run Completed! Score: ${data.score.toFixed(2)}`);
            queryClient.invalidateQueries({ queryKey: ['eval-context', id] });
        }
    });

    // Selection Logic
    const selectedObligation = useMemo(() => {
        if (!obligations) return null;
        if (!activeObligationId) return obligations[0];
        return obligations.find((o: any) => o.id === activeObligationId);
    }, [obligations, activeObligationId]);

    if (loadingObligations) return (
        <div className="flex h-screen items-center justify-center bg-black text-blue-500 gap-3">
            <RefreshCw className="animate-spin" />
            <span className="font-black tracking-tighter text-xl">INITIALIZING WORKBENCH...</span>
        </div>
    );

    return (
        <div className={styles.workbenchContainer}>
            <EvaluationContextHeader
                context={context}
                isRunning={runEngineMutation.isPending}
                onRun={() => runEngineMutation.mutate()}
            />

            <div className={styles.mainLayout}>
                {/* Panel 1: Navigator */}
                <div className={styles.navigatorPanel}>
                    <div className={styles.panelHeader}>Navigator List</div>
                    <div className={styles.navList}>
                        <div style={{ marginBottom: '1.5rem' }}>
                            <div className="flex gap-2 mb-4 px-2">
                                <div className="relative flex-1">
                                    <Search size={14} className="absolute left-2 top-2.5 text-zinc-500" />
                                    <input type="text" placeholder="Filtrar..." className="w-full bg-white/5 border border-white/10 rounded-md p-2 pl-7 text-xs outline-none focus:border-blue-500/50" />
                                </div>
                            </div>

                            {obligations?.map((obl: any) => (
                                <div
                                    key={obl.id}
                                    className={`${styles.navItem} ${selectedObligation?.id === obl.id ? styles.navItemActive : ''}`}
                                    onClick={() => setActiveObligationId(obl.id)}
                                >
                                    <div style={{ overflow: 'hidden' }}>
                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#71717a', marginBottom: '2px' }}>{obl.code}</div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{obl.title}</div>
                                    </div>
                                    <ChevronRight size={14} style={{ opacity: selectedObligation?.id === obl.id ? 1 : 0.2 }} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Panel 2: Workbench */}
                <div className={styles.contentPanel}>
                    <AuditBanner findings={findings} />
                    {selectedObligation ? (
                        <>
                            <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                                <div className="flex items-center gap-2 text-blue-500 text-[10px] font-black tracking-widest mb-3 uppercase">
                                    <BookOpen size={14} /> Obligation Assessment
                                </div>
                                <h2 className={styles.obligationTitle}>{selectedObligation.title}</h2>
                                <div className="flex gap-4 items-start">
                                    <p className={styles.obligationStatement}>{selectedObligation.statement}</p>
                                    <div style={{ background: 'rgba(59,130,246,0.1)', padding: '0.5rem 1rem', borderRadius: '0.5rem', border: '1px solid rgba(59,130,246,0.2)', flexShrink: 0 }}>
                                        <div className="text-[10px] font-bold text-blue-400">CRITICIDAD</div>
                                        <div className="text-xl font-black">{selectedObligation.criticalityId} / 5</div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="text-[10px] font-black text-zinc-500 tracking-widest mb-4">MAPPED CONTROLS ({selectedObligation.controls?.length || 0})</div>
                                {selectedObligation.controls?.map((mapping: any) => (
                                    <ControlCard
                                        key={mapping.control.id}
                                        control={mapping.control}
                                        state={mapping.control.evaluationStates?.[0]}
                                        onUpdate={(controlId: string, newState: any) =>
                                            updateControlMutation.mutate({ controlId, state: newState })
                                        }
                                    />
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                            <ShieldAlert size={48} strokeWidth={1} className="mb-4 opacity-20" />
                            <p className="text-sm font-medium">Seleccione una obligación para comenzar la evaluación</p>
                        </div>
                    )}
                </div>

                {/* Panel 3: Summary */}
                <div className={styles.summaryPanel}>
                    <div className={styles.panelHeader}>Assessment Summary</div>

                    <div className="space-y-4 mt-6">
                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Current Ci</div>
                            <div className={styles.metricValue}>0.00</div>
                            <p className="text-[10px] text-zinc-500 mt-1">Mitigación máxima en controles aplicables</p>
                        </div>

                        <div className={styles.metricCard}>
                            <div className={styles.metricLabel}>Structural Exposure (Ei)</div>
                            <div className={styles.metricValue} style={{ color: '#f59e0b' }}>0.0</div>
                            <p className="text-[10px] text-zinc-500 mt-1">Wi × (1 - Ci) • Wi = 1.00</p>
                        </div>

                        <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4 mt-8">
                            <div className="flex items-center gap-2 text-blue-400 text-[10px] font-black mb-3">
                                <Info size={14} /> ENGINE CONTEXT
                            </div>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">Method</span>
                                    <span className="font-bold">Deterministic V3</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">Hashing</span>
                                    <span className="font-bold">SHA-256 Stable</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-zinc-500">Mapping</span>
                                    <span className="font-bold">Gamma Exp</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                            <div className="text-[10px] font-black text-zinc-500 mb-4 tracking-tighter">ULTIMAS EJECUCIONES</div>
                            <div className="space-y-2">
                                <div className="bg-white/5 p-2 rounded text-[10px] flex justify-between">
                                    <span>RUN #882</span>
                                    <span className="text-blue-500 font-bold">SCORE: 14.2</span>
                                </div>
                                <div className="bg-white/5 p-2 rounded text-[10px] flex justify-between">
                                    <span>RUN #881</span>
                                    <span className="text-blue-500 font-bold">SCORE: 12.8</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
