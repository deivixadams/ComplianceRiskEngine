"use client";

import React, { useState, useMemo } from 'react';
import {
    Shield,
    Globe,
    Database,
    Activity,
    AlertTriangle,
    Lock,
    Zap,
    Save,
    CheckCircle,
    Copy,
    RotateCcw,
    Search,
    ChevronDown,
    FileJson
} from 'lucide-react';
import styles from './SupervisorProfile.module.css';

// --- Reusable Components (Sub-components of this module) ---

const ContextSelectors = ({ context, setContext }: any) => (
    <div className={styles.selectorGrid}>
        <div className={styles.selectorCard}>
            <span className={styles.selectorLabel}>Empresa (Corpus)</span>
            <select
                className={styles.select}
                value={context.company}
                onChange={(e) => setContext({ ...context, company: e.target.value })}
            >
                <option>Corporativo Principal</option>
                <option>Subsidiaria Latam</option>
            </select>
        </div>
        <div className={styles.selectorCard}>
            <span className={styles.selectorLabel}>Jurisdicción</span>
            <select
                className={styles.select}
                value={context.jurisdiction}
                onChange={(e) => setContext({ ...context, jurisdiction: e.target.value })}
            >
                <option value="Colombia">Colombia (CO)</option>
                <option value="Mexico">México (MX)</option>
                <option value="Panama">Panamá (PA)</option>
            </select>
        </div>
        <div className={styles.selectorCard}>
            <span className={styles.selectorLabel}>Framework / Versión</span>
            <select className={styles.select}>
                <option>AML 155-17 (v2.4)</option>
                <option>S2RQF 2026 (Draft)</option>
            </select>
        </div>
    </div>
);

const SeveritySettingsCard = ({ config, setConfig }: any) => (
    <div className={styles.card}>
        <div className={styles.cardHeader}>
            <Activity className={styles.cardIcon} size={20} />
            <h2>Severidad Global (Motor)</h2>
        </div>
        <div className={styles.paramsGrid}>
            {[
                { id: 'alpha', name: 'Alpha (Concentración)', min: 0, max: 1, step: 0.05 },
                { id: 'beta', name: 'Beta (Interdependencia)', min: 0, max: 0.5, step: 0.05 },
                { id: 'gamma', name: 'Gamma (Curvatura γ)', min: 1, max: 10, step: 0.1 },
                { id: 'multiplier', name: 'Multiplicador Material', min: 1, max: 2, step: 0.1 },
            ].map((p) => (
                <div key={p.id} className={styles.paramItem}>
                    <div className={styles.paramLabel}>
                        <span className={styles.paramName}>{p.name}</span>
                        <span className={styles.paramValue}>{config[p.id]}</span>
                    </div>
                    <input
                        type="range"
                        min={p.min} max={p.max} step={p.step}
                        value={config[p.id]}
                        onChange={(e) => setConfig({ ...config, [p.id]: parseFloat(e.target.value) })}
                        className={styles.inputRange}
                    />
                </div>
            ))}
        </div>
    </div>
);

const EventSensitivityTable = ({ events, setEvents }: any) => (
    <div className={styles.card}>
        <div className={styles.cardHeader}>
            <Zap className={styles.cardIcon} size={20} />
            <h2>Sensibilidad por Evento Material</h2>
        </div>
        <table className={styles.table}>
            <thead>
                <tr>
                    <th>Evento Material</th>
                    <th>Sensibilidad (W)</th>
                    <th>Serveridad (M)</th>
                    <th>Penalidad</th>
                    <th>Floor Exp.</th>
                    <th>Hard Trg</th>
                </tr>
            </thead>
            <tbody>
                {events.map((e: any, i: number) => (
                    <tr key={e.code}>
                        <td style={{ fontWeight: 700 }}>{e.code}</td>
                        <td><input type="number" step="0.1" className={styles.inputNumber} value={e.weight} /></td>
                        <td><input type="number" step="0.1" className={styles.inputNumber} value={e.multiplier} /></td>
                        <td><input type="number" className={styles.inputNumber} value={e.penalty} /></td>
                        <td><input type="number" step="0.05" className={styles.inputNumber} value={e.floor} /></td>
                        <td style={{ textAlign: 'center' }}>
                            <input type="checkbox" checked={e.hardTrigger} />
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

// --- Main Page ---

export default function SupervisorProfilePage() {
    const [context, setContext] = useState({ company: 'Corporativo Principal', jurisdiction: 'Mexico' });
    const [config, setConfig] = useState({ alpha: 0.35, beta: 0.20, gamma: 4.5, multiplier: 1.2 });
    const [status, setStatus] = useState('Draft');

    const events = useMemo(() => {
        // Defaults based on jurisdiction (requested examples)
        if (context.jurisdiction === 'Colombia') {
            return [
                { code: 'ROS_LATE', weight: 1.3, multiplier: 1.1, penalty: 15, floor: 0.10, hardTrigger: false },
                { code: 'PEP_NO_EDD', weight: 1.0, multiplier: 1.0, penalty: 10, floor: 0.00, hardTrigger: false },
                { code: 'UBO_MISSING', weight: 1.1, multiplier: 1.2, penalty: 20, floor: 0.20, hardTrigger: true },
            ];
        }
        if (context.jurisdiction === 'Panama') {
            return [
                { code: 'ROS_LATE', weight: 1.0, multiplier: 1.0, penalty: 10, floor: 0.00, hardTrigger: false },
                { code: 'PEP_NO_EDD', weight: 1.0, multiplier: 1.0, penalty: 10, floor: 0.00, hardTrigger: false },
                { code: 'UBO_MISSING', weight: 1.5, multiplier: 1.5, penalty: 50, floor: 0.75, hardTrigger: true },
            ];
        }
        return [
            { code: 'ROS_LATE', weight: 1.0, multiplier: 1.0, penalty: 10, floor: 0.00, hardTrigger: false },
            { code: 'PEP_NO_EDD', weight: 1.6, multiplier: 1.8, penalty: 25, floor: 0.30, hardTrigger: false },
            { code: 'UBO_MISSING', weight: 1.0, multiplier: 1.0, penalty: 10, floor: 0.00, hardTrigger: false },
        ];
    }, [context.jurisdiction]);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                <div className={styles.header}>
                    <div className={styles.titleArea}>
                        <div className={styles.iconBox}>
                            <Shield size={32} />
                        </div>
                        <div>
                            <h1 className={styles.mainTitle}>Perfil Supervisor Jurisdiccional</h1>
                            <p className={styles.subtitle}>Configuración de adaptatividad y sensibilidad del motor por contexto legal.</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '9999px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: status === 'Draft' ? '#f59e0b' : '#10b981' }} />
                        <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{status} Mode</span>
                    </div>
                </div>

                <ContextSelectors context={context} setContext={setContext} />

                <div className={styles.mainGrid}>
                    <div className={styles.configPanel}>
                        <SeveritySettingsCard config={config} setConfig={setConfig} />
                        <EventSensitivityTable events={events} />

                        <div className={styles.card}>
                            <div className={styles.cardHeader}>
                                <AlertTriangle className={styles.cardIcon} size={20} />
                                <h2>Triggers y Umbrales (Hard Triggers)</h2>
                            </div>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Código Trigger</th>
                                        <th>Umbral</th>
                                        <th>Floor Exp.</th>
                                        <th>Readiness Penalty</th>
                                        <th>Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ fontWeight: 700 }}>TRG_MAX_CONC</td>
                                        <td><input type="number" className={styles.inputNumber} defaultValue={0.80} /></td>
                                        <td><input type="number" className={styles.inputNumber} defaultValue={0.85} /></td>
                                        <td><input type="number" className={styles.inputNumber} defaultValue={20} /></td>
                                        <td><span className={styles.badge} style={{ color: '#10b981' }}>ACTIVO</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className={styles.summaryContainer}>
                        <div className={styles.card} style={{ padding: '2rem' }}>
                            <div className={styles.cardHeader} style={{ marginBottom: '1.5rem' }}>
                                <FileJson className={styles.cardIcon} size={18} />
                                <h3 style={{ fontSize: '1rem', fontWeight: 900 }}>Snapshot del Perfil</h3>
                            </div>
                            <div className={styles.jsonPreview}>
                                {`{
  "jurisdiction": "${context.jurisdiction}",
  "parameters": ${JSON.stringify(config, null, 2)},
  "hash": "sha256:7f8e...3921"
}`}
                            </div>
                            <div className={styles.hashTag}>UUID: {crypto.randomUUID().slice(0, 8)}...</div>
                        </div>

                        <div className={styles.buttonGroup}>
                            <button className={`${styles.btn} ${styles.btnPrimary}`}>
                                <CheckCircle size={18} /> Activar Perfil
                            </button>
                            <button className={`${styles.btn} ${styles.btnSecondary}`}>
                                <Save size={18} /> Guardar Draft
                            </button>
                            <button className={`${styles.btn} ${styles.btnSecondary}`}>
                                <Copy size={18} /> Duplicar desde Activo
                            </button>
                            <button className={`${styles.btn} ${styles.btnSecondary}`} style={{ color: '#ef4444' }}>
                                <RotateCcw size={18} /> Restaurar Defaults
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
