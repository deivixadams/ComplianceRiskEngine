"use client";

import React, { useState } from 'react';
import {
    ClipboardList,
    AlertCircle,
    CheckCircle2,
    Clock,
    ShieldAlert,
    TrendingUp,
    Filter,
    ArrowUpDown,
    Download,
    Eye,
    ChevronRight,
    Search,
    MessageSquare,
    Check
} from 'lucide-react';

export default function FindingInventoryPage({ params }: { params: { id: string, evalId: string } }) {
    const [selectedFinding, setSelectedFinding] = useState<any>(null);

    // Mock findings for UI (will use TanStack Query to fetch from /api/audit/findings)
    const findings = [
        {
            id: 'F-2024-001',
            code: 'AUDIT-ROS-001',
            title: 'Reporte ROS Extemporáneo (Trimestre Q1)',
            type: 'Cumplimiento Operativo',
            severity: 4,
            status: 'open',
            exposureFloor: 0.50,
            penalty: 25,
            dueDate: '2024-05-15',
            owner: 'Oficial de Cumplimiento',
            description: 'Se detectó que el reporte de operaciones sospechosas fue remitido 3 días después del plazo legal.'
        },
        {
            id: 'F-2024-002',
            code: 'AUDIT-PEP-002',
            title: 'Falta de Debida Diligencia Intensificada (EDD)',
            type: 'Debida Diligencia',
            severity: 5,
            status: 'open',
            exposureFloor: 0.80,
            penalty: 50,
            dueDate: '2024-04-30',
            owner: 'Gerente KYC',
            description: 'Muestra aleatoria reveló que 3 clientes PEP no contaban con el perfil transaccional actualizado ni aprobación de alta gerencia.'
        }
    ];

    return (
        <div style={{ padding: '2rem' }} className="animate-in fade-in duration-500">
            {/* Context Header */}
            <div className="glass-card" style={{ padding: '1.5rem 2rem', borderRadius: '1.25rem', marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ height: '48px', width: '48px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldAlert size={24} className="text-red-500" />
                    </div>
                    <div>
                        <div style={{ fontSize: '0.8rem', color: '#a1a1aa', textTransform: 'uppercase', fontWeight: 800 }}>Evaluación Actual</div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Inventario de Hallazgos – Q1 2024</h2>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '2rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Impacto Readiness</div>
                        <div style={{ color: '#ef4444', fontWeight: 900, fontSize: '1.5rem' }}>-75 pts</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.75rem', color: '#a1a1aa' }}>Piso Exposición (E)</div>
                        <div style={{ color: '#f59e0b', fontWeight: 900, fontSize: '1.5rem' }}>0.8000</div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input type="text" placeholder="Filtrar hallazgos..." className="glass-input" style={{ paddingLeft: '3rem', borderRadius: '0.75rem' }} />
                    </div>
                    <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderRadius: '0.75rem' }}>
                        <Filter size={16} /> Filtros
                    </button>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-secondary" style={{ borderRadius: '0.75rem' }}>
                        <Download size={16} /> Exportar
                    </button>
                    <button className="btn-primary" style={{ background: '#3b82f6', borderRadius: '0.75rem', fontWeight: 800 }}>
                        + Hallazgo Manual
                    </button>
                </div>
            </div>

            {/* Findings List */}
            <div className="glass-card" style={{ borderRadius: '1.5rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <th style={{ padding: '1.25rem', textAlign: 'left', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800 }}>CÓDIGO / TÍTULO</th>
                            <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800 }}>SEVERIDAD</th>
                            <th style={{ padding: '1.25rem', textAlign: 'right', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800 }}>PENALIDAD</th>
                            <th style={{ padding: '1.25rem', textAlign: 'right', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800 }}>PISO E</th>
                            <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800 }}>VENCIMIENTO</th>
                            <th style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800 }}>ESTADO</th>
                            <th style={{ padding: '1.25rem' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {findings.map(f => (
                            <tr key={f.id} className="finding-row" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer' }} onClick={() => setSelectedFinding(f)}>
                                <td style={{ padding: '1.25rem' }}>
                                    <div style={{ fontWeight: 800, color: 'white' }}>{f.code}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#71717a', marginTop: '0.2rem' }}>{f.title}</div>
                                </td>
                                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} style={{ width: '8px', height: '8px', borderRadius: '50%', background: i <= f.severity ? (f.severity === 5 ? '#ef4444' : '#f59e0b') : 'rgba(255,255,255,0.1)' }} />
                                        ))}
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 800, color: '#ef4444' }}>-{f.penalty} pts</td>
                                <td style={{ padding: '1.25rem', textAlign: 'right', fontWeight: 800, color: '#f59e0b' }}>{f.exposureFloor.toFixed(4)}</td>
                                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#a1a1aa' }}>
                                        <Clock size={14} /> {f.dueDate}
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem', textAlign: 'center' }}>
                                    <span className="badge-open">OPEN</span>
                                </td>
                                <td style={{ padding: '1.25rem', textAlign: 'right' }}>
                                    <button className="btn-icon">
                                        <ChevronRight size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Finding Drawer (Mock) */}
            {selectedFinding && (
                <div className="drawer-overlay" onClick={() => setSelectedFinding(null)}>
                    <div className="drawer-content animate-slide-in-right" onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '2rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.8rem', color: '#a1a1aa', fontWeight: 800, textTransform: 'uppercase' }}>{selectedFinding.code}</div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '0.5rem' }}>{selectedFinding.title}</h2>
                                </div>
                                <button className="btn-icon" onClick={() => setSelectedFinding(null)}>✕</button>
                            </div>

                            <div className="glass-card" style={{ padding: '1.25rem', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#ef4444', marginBottom: '0.75rem' }}>
                                    <TrendingUp size={18} />
                                    <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Análisis de Impacto Determinista</span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: '#a1a1aa', margin: 0 }}>
                                    Este hallazgo impone un **piso no compensable de {selectedFinding.exposureFloor}** a la exposición final (E) y deduce **{selectedFinding.penalty} puntos** del Readiness Score.
                                </p>
                            </div>

                            <section style={{ marginBottom: '2.5rem' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', marginBottom: '1rem' }}>Descripción y Evidencia</h4>
                                <p style={{ color: '#d1d5db', lineHeight: 1.6 }}>{selectedFinding.description}</p>
                                <div style={{ marginTop: '1.5rem', padding: '1rem', borderRadius: '0.75rem', background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <Download size={20} className="text-blue-500" />
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Evidencia_Muestreo_PEP.pdf</div>
                                        <div style={{ fontSize: '0.75rem', color: '#71717a' }}>Snapshot del motor de test runs adjunto.</div>
                                    </div>
                                </div>
                            </section>

                            <section style={{ marginBottom: '2.5rem' }}>
                                <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', marginBottom: '1rem' }}>Gestión de Remedición</h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="field-group">
                                        <label>Propietario</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                                            <div style={{ height: '24px', width: '24px', borderRadius: '50%', background: '#3b82f6' }} />
                                            <span style={{ fontSize: '0.9rem' }}>{selectedFinding.owner}</span>
                                        </div>
                                    </div>
                                    <div className="field-group">
                                        <label>Fecha Compromiso</label>
                                        <div style={{ marginTop: '0.5rem', fontWeight: 700 }}>{selectedFinding.dueDate}</div>
                                    </div>
                                </div>
                            </section>

                            <div style={{ display: 'flex', gap: '1rem', marginTop: 'auto' }}>
                                <button className="btn-primary" style={{ flex: 1, background: '#10b981', color: 'white', fontWeight: 800, borderRadius: '0.75rem' }}>
                                    <Check size={18} style={{ marginRight: '0.5rem' }} /> Cerrar Hallazgo
                                </button>
                                <button className="btn-secondary" style={{ flex: 1, borderRadius: '0.75rem' }}>
                                    <MessageSquare size={18} style={{ marginRight: '0.5rem' }} /> Comentar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .finding-row:hover { background: rgba(255,255,255,0.04) !important; }
                .badge-open {
                    background: rgba(239, 68, 68, 0.15);
                    color: #f87171;
                    padding: 0.25rem 0.75rem;
                    border-radius: 2rem;
                    font-size: 0.75rem;
                    font-weight: 900;
                    border: 1px solid rgba(239, 68, 68, 0.3);
                }
                .drawer-overlay {
                    position: fixed;
                    top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(0,0,0,0.6);
                    backdrop-filter: blur(4px);
                    z-index: 1000;
                    display: flex;
                    justify-content: flex-end;
                }
                .drawer-content {
                    width: 500px;
                    height: 100vh;
                    background: #09090b;
                    border-left: 1px solid rgba(255,255,255,0.1);
                    box-shadow: -20px 0 40px rgba(0,0,0,0.5);
                }
                .field-group label {
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #71717a;
                    text-transform: uppercase;
                }
                .animate-slide-in-right {
                    animation: slideInRight 0.3s ease-out;
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
