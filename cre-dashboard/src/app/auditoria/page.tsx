"use client";

import React, { useState } from 'react';
import {
    ClipboardList,
    Plus,
    Search,
    Building2,
    LayoutGrid,
    ChevronRight,
    PlayCircle,
    Calendar,
    ArrowRight,
    ShieldCheck
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';

export default function AuditDashboard() {
    const [searchQuery, setSearchQuery] = useState("");

    // Mock Assessments for UI development (replace with real Query later)
    const assessments = [
        {
            id: 'assess-001',
            name: 'Auditoría Anual AML 2024',
            company: 'Banco Central Operativo',
            framework: 'Ley 155-17',
            status: 'En Proceso',
            findings: 12,
            readiness: 78,
            lastUpdate: 'Hace 2 horas'
        },
        {
            id: 'assess-002',
            name: 'Revisión Especial ROS',
            company: 'Seguros Universal',
            framework: 'Norma 01-19',
            status: 'Completado',
            findings: 5,
            readiness: 94,
            lastUpdate: 'Ayer'
        }
    ];

    return (
        <div style={{ padding: '2rem' }} className="animate-in fade-in duration-500">
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.2) 100%)',
                        padding: '1rem',
                        borderRadius: '1.25rem',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                        <ClipboardList size={32} className="text-blue-500" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Auditoría AML</h1>
                        <p style={{ color: '#71717a', fontSize: '1rem', marginTop: '0.25rem' }}>Gestión centralizada de evaluaciones de cumplimiento y hallazgos materiales.</p>
                    </div>
                </div>

                <button
                    className="btn-primary"
                    style={{
                        padding: '0.85rem 1.75rem',
                        borderRadius: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        boxShadow: '0 8px 16px -4px rgba(59, 130, 246, 0.4)',
                        fontWeight: 800,
                        fontSize: '0.95rem'
                    }}
                >
                    <Plus size={20} /> Nueva Auditoría
                </button>
            </div>

            {/* Stats Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
                {[
                    { label: 'Auditorías Activas', value: '4', icon: PlayCircle, color: '#3b82f6' },
                    { label: 'Hallazgos Open', value: '28', icon: ClipboardList, color: '#ef4444' },
                    { label: 'Readiness Promedio', value: '82%', icon: ShieldCheck, color: '#10b981' },
                    { label: 'Empresas Cubiertas', value: '12', icon: Building2, color: '#f59e0b' }
                ].map((stat) => (
                    <div key={stat.label} className="glass-card" style={{ padding: '1.5rem', borderRadius: '1.25rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</div>
                            <stat.icon size={18} style={{ color: stat.color }} />
                        </div>
                        <div style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white', marginTop: '0.75rem' }}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Assessment Inventory */}
            <div className="glass-card" style={{ padding: '2rem', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <LayoutGrid size={20} className="text-muted" />
                        <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>Inventario de Auditorías</h3>
                    </div>
                    <div style={{ position: 'relative', width: '350px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#71717a' }} />
                        <input
                            type="text"
                            placeholder="Buscar por empresa o nombre..."
                            className="glass-input"
                            style={{ paddingLeft: '3rem', width: '100%', borderRadius: '0.75rem' }}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {assessments.map((audit) => (
                        <Link
                            href={`/auditoria/${audit.id}`}
                            key={audit.id}
                            style={{ textDecoration: 'none' }}
                        >
                            <div className="audit-row" style={{
                                padding: '1.25rem 1.5rem',
                                borderRadius: '1rem',
                                background: 'rgba(255,255,255,0.03)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                display: 'grid',
                                gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 40px',
                                alignItems: 'center',
                                transition: 'all 0.2s ease'
                            }}>
                                <div>
                                    <div style={{ fontWeight: 800, color: 'white', fontSize: '1rem' }}>{audit.name}</div>
                                    <div style={{ fontSize: '0.85rem', color: '#71717a', marginTop: '0.2rem' }}>{audit.company}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.85rem', color: '#a1a1aa' }}>Marco Normativo</div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'white' }}>{audit.framework}</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Hallazgos</div>
                                    <div style={{ display: 'inline-block', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', fontWeight: 800, fontSize: '0.85rem' }}>
                                        {audit.findings} Open
                                    </div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: '#a1a1aa', marginBottom: '0.25rem' }}>Readiness</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#10b981' }}>{audit.readiness}%</div>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <span className={`badge ${audit.status === 'En Proceso' ? 'badge-primary' : 'badge-success'}`}>
                                        {audit.status}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <ChevronRight size={20} className="text-muted" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {assessments.length === 0 && (
                    <div style={{ padding: '6rem 0', textAlign: 'center', opacity: 0.5 }}>
                        <ClipboardList size={64} style={{ margin: '0 auto 1.5rem auto', display: 'block' }} />
                        <p style={{ fontSize: '1.1rem' }}>No se encontraron auditorías registradas.</p>
                        <button className="btn-secondary" style={{ marginTop: '1rem' }}>Configurar Mi Primera Evaluación</button>
                    </div>
                )}
            </div>

            <style jsx>{`
                .audit-row:hover {
                    background: rgba(255,255,255,0.07) !important;
                    border-color: rgba(59, 130, 246, 0.3) !important;
                    transform: translateX(4px);
                }
                .badge {
                    padding: 0.4rem 0.75rem;
                    border-radius: 2rem;
                    font-size: 0.75rem;
                    font-weight: 800;
                    text-transform: uppercase;
                }
                .badge-primary { background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
                .badge-success { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
            `}</style>
        </div>
    );
}
