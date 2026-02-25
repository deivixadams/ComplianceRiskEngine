"use client";

import React, { useState } from 'react';
import {
    Calculator,
    Info,
    AlertTriangle,
    Save,
    History,
    PlayCircle,
    Copy,
    RefreshCw,
    Sigma,
    BookOpen,
    ArrowRight
} from 'lucide-react';
import styles from '../Parameters.module.css';
import FormulaBlock from '../../../../components/methodology/FormulaBlock';

interface Parameter {
    id: string;
    code: string;
    name: string;
    category: string;
    description: string;
    defaultValue: number;
    currentValue: number;
    min: number;
    max: number;
    isModified: boolean;
}

const initialParams: Parameter[] = [
    {
        id: "1",
        code: "ALPHA_CONCENTRATION",
        name: "Factor de Concentración Alfa",
        category: "global_constant",
        description: "Determina la sensibilidad del modelo ante la concentración de riesgos en un solo dominio.",
        defaultValue: 0.30,
        currentValue: 0.30,
        min: 0,
        max: 1,
        isModified: false
    },
    {
        id: "2",
        code: "BETA_INTERDEPENDENCE",
        name: "Interdependencia Beta",
        category: "global_constant",
        description: "Peso de las interconexiones sistémicas entre riesgos operativos y regulatorios.",
        defaultValue: 0.25,
        currentValue: 0.25,
        min: 0,
        max: 1,
        isModified: false
    },
    {
        id: "3",
        code: "GAMMA_CURVE",
        name: "Curva Gamma",
        category: "curve",
        description: "Parámetro de curvatura para la normalización no lineal de puntajes.",
        defaultValue: 4.00,
        currentValue: 4.00,
        min: 0.1,
        max: 10,
        isModified: false
    },
    {
        id: "4",
        code: "MATERIAL_SEVERITY_MULTIPLIER",
        name: "Multiplicador de Severidad",
        category: "materiality",
        description: "Escalador para hallazgos de materialidad crítica.",
        defaultValue: 1.00,
        currentValue: 1.00,
        min: 0.5,
        max: 3,
        isModified: false
    },
    {
        id: "5",
        code: "TRIGGER_EXPOSURE_FLOOR",
        name: "Piso de Exposición (Trigger)",
        category: "trigger",
        description: "Umbral mínimo de exposición para activar gatillos no compensables.",
        defaultValue: 0.70,
        currentValue: 0.72,
        min: 0,
        max: 1,
        isModified: true
    }
];

export default function ParamManager() {
    const [params, setParams] = useState<Parameter[]>(initialParams);
    const [view, setView] = useState<'table' | 'profiles' | 'math'>('table');

    const handleValueChange = (id: string, newValue: string) => {
        const val = parseFloat(newValue);
        if (isNaN(val)) return;
        setParams(prev => prev.map(p => {
            if (p.id === id) {
                return {
                    ...p,
                    currentValue: val,
                    isModified: val !== p.defaultValue
                };
            }
            return p;
        }));
    };

    const isOutOfRange = (p: Parameter) => {
        return p.currentValue < p.min || p.currentValue > p.max;
    };

    return (
        <div className={styles.pageContainer}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.titleArea}>
                    <div className={styles.iconBox}>
                        <Calculator size={32} />
                    </div>
                    <div>
                        <h1 className={styles.mainTitle}>Gobernanza de Parámetros</h1>
                        <p className={styles.subtitle}>Calibración institucional y control de versiones del motor CRE.</p>
                    </div>
                </div>
                <div className={styles.actionPanel}>
                    <button className={styles.btnAction}>
                        <PlayCircle size={18} /> Simular Impacto
                    </button>
                    <button className={`${styles.btnAction} ${styles.btnPrimary}`}>
                        <Save size={18} /> Guardar Draft
                    </button>
                </div>
            </div>

            {/* Main Tabs */}
            <div className={styles.tabs}>
                <button
                    onClick={() => setView('table')}
                    className={`${styles.tab} ${view === 'table' ? styles.tabActive : ''}`}
                >
                    <RefreshCw size={16} /> Dashboard
                </button>
                <button
                    onClick={() => setView('profiles')}
                    className={`${styles.tab} ${view === 'profiles' ? styles.tabActive : ''}`}
                >
                    <Copy size={16} /> Perfiles (Profiles)
                </button>
                <button
                    onClick={() => setView('math')}
                    className={`${styles.tab} ${view === 'math' ? styles.tabActive : ''}`}
                >
                    <Sigma size={16} /> Metodología y Matemáticas
                </button>
            </div>

            {view === 'table' && (
                <div className={styles.glassCard}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th>CÓDIGO / PARÁMETRO</th>
                                <th>CATEGORÍA</th>
                                <th style={{ textAlign: 'right' }}>BASE</th>
                                <th style={{ textAlign: 'right' }}>VALOR ACTUAL</th>
                                <th>RANGO</th>
                                <th style={{ textAlign: 'center' }}>ESTADO</th>
                            </tr>
                        </thead>
                        <tbody>
                            {params.map(p => (
                                <tr key={p.id}>
                                    <td>
                                        <div className={styles.paramTitle}>
                                            {p.code}
                                            <Info size={14} style={{ opacity: 0.4, cursor: 'help' }} />
                                        </div>
                                        <p className={styles.paramDesc}>{p.description}</p>
                                    </td>
                                    <td>
                                        <span className={`${styles.badge} ${styles.badgePrimary}`}>{p.category}</span>
                                    </td>
                                    <td style={{ textAlign: 'right', fontWeight: 700, opacity: 0.6 }}>{p.defaultValue.toFixed(2)}</td>
                                    <td style={{ textAlign: 'right' }}>
                                        <input
                                            type="number"
                                            value={p.currentValue}
                                            onChange={(e) => handleValueChange(p.id, e.target.value)}
                                            step="0.01"
                                            className={`${styles.inputNumber} ${isOutOfRange(p) ? styles.inputError : ''}`}
                                        />
                                    </td>
                                    <td style={{ fontFamily: 'monospace', fontSize: '11px', opacity: 0.4 }}>
                                        [{p.min.toFixed(1)} — {p.max.toFixed(1)}]
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {isOutOfRange(p) ? (
                                            <div className={`${styles.statusLabel} ${styles.statusError}`}>
                                                <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} /> Fuera de rango
                                            </div>
                                        ) : p.isModified ? (
                                            <span className={`${styles.statusLabel} ${styles.statusModified}`}>DRAFT MODIFICADO</span>
                                        ) : (
                                            <span className={`${styles.statusLabel} ${styles.statusOriginal}`}>ORIGINAL</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {view === 'profiles' && (
                <div className={styles.profileGrid}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className={styles.profileCard}>
                            <div>
                                <div style={{ fontWeight: 900, fontSize: '15px' }}>2024_Standard_v1</div>
                                <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>Activado: 2024-01-15 · Hash: sha256:7f8e...</div>
                            </div>
                            <span className={`${styles.badge} ${styles.badgePrimary}`} style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.2)' }}>ACTIVO</span>
                        </div>
                        <div className={styles.profileCard} style={{ background: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '15px', color: 'rgba(255,255,255,0.7)' }}>2024_Preview_v2</div>
                                <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>Actualizado hace 2 horas · Hash: sha256:4d1a...</div>
                            </div>
                            <span className={`${styles.badge} ${styles.badgePrimary}`}>DRAFT</span>
                        </div>
                    </div>
                    <div className={styles.sidebarInfo}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '1rem' }}>Gobernanza Institucional</h3>
                        <p style={{ fontSize: '14px', color: 'rgba(248, 252, 252, 0.6)', lineHeight: '1.6', fontWeight: 300 }}>
                            Los parámetros activos son inmutables. Cualquier ajuste requiere la creación de un nuevo
                            <span style={{ color: '#ffffff', fontWeight: 700 }}> Perfil Versionado </span>
                            firmado criptográficamente.
                        </p>
                        <div style={{ marginTop: '2rem', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#3b82f6', fontWeight: 700, cursor: 'pointer' }}>
                            <History size={18} /> Ver Audit Log de Cambios
                        </div>
                    </div>
                </div>
            )}

            {view === 'math' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
                    <div className={styles.glassCard} style={{ padding: '3rem' }}>
                        <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start', marginBottom: '4rem' }}>
                            <div className={styles.iconBox} style={{ width: '4rem', height: '4rem', background: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}>
                                <Sigma size={32} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '1.875rem', fontWeight: 900, color: '#ffffff', marginBottom: '0.5rem' }}>Lógica del Motor S2RQF</h3>
                                <p style={{ fontSize: '15px', color: 'rgba(248, 252, 252, 0.5)', fontWeight: 300, maxWidth: '40rem' }}>
                                    La calibración de los parámetros afecta directamente el cálculo de la fragilidad estructural. La base matemática garantiza un modelo libre de heurísticas opacas.
                                </p>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                            <FormulaBlock label="Exposición con Amplificación Alfa" latex="E_{conc} = E_{base} (1 + \alpha H)" />
                            <FormulaBlock label="Curvatura de Score (Gamma)" latex="Score = 100(1 - e^{-\gamma E_{final}})" />
                        </div>
                    </div>

                    <div className={styles.sidebarInfo} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '2rem', alignItems: 'center' }}>
                        <BookOpen size={40} style={{ color: '#3b82f6', opacity: 0.5 }} />
                        <div style={{ flex: 1 }}>
                            <h4 style={{ fontWeight: 900, marginBottom: '0.25rem' }}>Documentación Técnica</h4>
                            <p style={{ fontSize: '13px', color: 'rgba(248, 252, 252, 0.4)', fontWeight: 300 }}>
                                Para una comprensión profunda de las variables, consulte el Protocolo de Cuantificación Estructural.
                            </p>
                        </div>
                        <button className={styles.btnAction} style={{ border: 'none', background: 'rgba(255,255,255,0.05)' }}>
                            <ArrowRight size={18} /> Leer Manual
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
