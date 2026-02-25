"use client";

import { useState } from "react";
import {
    ChevronRight,
    Sigma,
    Info,
    Settings2,
    BookOpen,
    ArrowRight,
    ChevronDown,
} from "lucide-react";
import FormulaBlock from "../../../components/methodology/FormulaBlock";
import ParamsTable from "../../../components/methodology/ParamsTable";
import MethodSteps from "../../../components/methodology/MethodSteps";
import styles from "./methodology.module.css";

const defaultParams = [
    { code: "α", name: "Alpha — amplificación por concentración", value: "0.25", range: "[0.0 - 1.0]", approver: "Comité de Parametrización" },
    { code: "β", name: "Beta — amplificación por interdependencia", value: "0.15", range: "[0.0 - 0.5]", approver: "Comité de Parametrización" },
    { code: "γ", name: "Gamma — curvatura no lineal", value: "3.5", range: "[1.0 - 5.0]", approver: "Comité de Parametrización" },
    { code: "W_i", name: "Pesos por obligación", value: "Varía", range: "Σ = 100%", approver: "Risk Scoring Dept" },
    { code: "T_gatillo", name: "Piso de exposición por trigger", value: "0.80", range: "[0.0 - 1.0]", approver: "Legal & Compliance" },
    { code: "MSM", name: "Multiplicador penalización material", value: "1.2x", range: "[1.0 - 2.0]", approver: "Comité de Parametrización" },
];

export default function MethodologyPage() {
    const [activeProfile, setActiveProfile] = useState("Perfil Regulatorio 2026-v2");

    return (
        <div className={styles.pageContainer}>
            <div className={styles.contentWrapper}>
                {/* Nav & Header Block */}
                <nav className={styles.breadcrumb}>
                    <span>Settings</span>
                    <ChevronRight size={12} />
                    <span style={{ color: '#ffffff' }}>Metodología y Matemática</span>
                </nav>

                <div className={styles.headerSection}>
                    <div className={styles.titleGroup}>
                        <div className={styles.badge}>Framework S2RQF v2.4</div>
                        <h1 className={styles.mainTitle}>
                            Metodología y Matemática <br />
                            <span className={styles.highlightedTitle}>del Modelo</span>
                        </h1>
                        <p className={styles.subtitle}>
                            Modelo determinista corporativo, diseñado para una trazabilidad íntegra y auditoría de <span style={{ color: '#ffffff', fontWeight: 500 }}>caja transparente</span>.
                        </p>
                    </div>

                    <div className={styles.profileSelectorContainer}>
                        <div className={styles.profileLabel}>
                            <Settings2 size={16} style={{ color: '#3b82f6' }} />
                            <span>Perfil Activo</span>
                        </div>

                        <div className={styles.selectWrapper}>
                            <select
                                value={activeProfile}
                                onChange={(e) => setActiveProfile(e.target.value)}
                                className={styles.profileSelect}
                            >
                                <option value="Perfil Regulatorio 2026-v2">Regulatorio 2026-v2</option>
                                <option value="Perfil Conservador v1">Conservador v1</option>
                                <option value="Perfil Stress Test Q4">Stress Test Q4</option>
                            </select>
                            <ChevronDown size={14} style={{ position: 'absolute', right: 0, color: '#3b82f6', pointerEvents: 'none' }} />
                        </div>
                    </div>
                </div>

                {/* Formulas Segment */}
                <section className={styles.sectionCard}>
                    {/* Decorative Background icon */}
                    <div style={{ position: 'absolute', top: '-10%', right: '-5%', opacity: 0.02, pointerEvents: 'none', transform: 'rotate(12deg)' }}>
                        <Sigma size={600} strokeWidth={0.5} />
                    </div>

                    <div className={styles.sectionHeader}>
                        <div className={styles.sectionIconTitle}>
                            <div className={styles.iconBox}>
                                <Sigma size={40} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className={styles.sectionTitle}>Lógica del Motor</h2>
                                <p className={styles.sectionTag}>Cuantificación Determinista Estructural</p>
                            </div>
                        </div>
                        <div style={{ maxWidth: '28rem', background: 'rgba(255, 255, 255, 0.02)', padding: '1.5rem', borderRadius: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                            <p style={{ fontSize: '14px', color: 'rgba(248, 252, 252, 0.6)', lineHeight: 1.6, fontWeight: 300 }}>
                                El motor CRE fundamenta sus cálculos en una <span style={{ color: '#ffffff', fontWeight: 700 }}>cuantificación absoluta</span> de la brecha estructural entre la norma y la evidencia aportada.
                            </p>
                        </div>
                    </div>

                    <div className={styles.formulaGrid}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div style={{ padding: '2rem', borderRadius: '2rem', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', gap: '1.5rem' }}>
                                <Info style={{ color: '#3b82f6', marginTop: '0.25rem' }} size={20} />
                                <p style={{ fontSize: '15px', color: 'rgba(248, 252, 252, 0.6)', fontStyle: 'italic', fontWeight: 300 }}>
                                    "Sin evidencia válida, el valor del control es matemáticamente 0 (brecha máxima)."
                                </p>
                            </div>
                            <FormulaBlock label="Exposición Individual" latex="E_i = W_i (1 - C_i)" />
                            <FormulaBlock label="Exposición Base de Red" latex="E_{base} = \sum_{i} E_i" />
                            <FormulaBlock label="Concentración Normativa (HHI)" latex="H = \sum_{d} \left( \frac{E_d}{E_{base}} \right)^2" />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <FormulaBlock label="Amplificación no Lineal" latex="E_{conc} = E_{base} (1 + \alpha H)" />
                            <FormulaBlock label="Piso Crítico (Trigger Floor)" latex="E_{final} = \max(E_{sys}, T_{gatillo})" />
                            <FormulaBlock label="Score de Fragilidad Institucional" latex="Score = 100(1 - e^{-\gamma E_{final}})" />
                            <div style={{ padding: '2.5rem', borderRadius: '2.5rem', border: '1px solid rgba(59, 130, 246, 0.2)', background: 'rgba(59, 130, 246, 0.05)', display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                                <BookOpen style={{ color: '#3b82f6' }} size={32} />
                                <div>
                                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.25rem' }}>Auditoría de Fuente</h3>
                                    <p style={{ fontSize: '14px', color: 'rgba(248, 252, 252, 0.6)', fontWeight: 300 }}>Cálculo inmutable reconstruible mediante hashes y perfiles.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className={styles.formulaGrid} style={{ gap: '4rem' }}>
                    <div className={styles.sectionCard} style={{ margin: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                            <div className={styles.iconBox} style={{ width: '4rem', height: '4rem' }}>
                                <Settings2 size={24} />
                            </div>
                            <div>
                                <h2 className={styles.sectionTitle} style={{ fontSize: '1.875rem' }}>Parámetros</h2>
                                <p className={styles.sectionTag}>Calibración Técnica</p>
                            </div>
                        </div>
                        <ParamsTable params={defaultParams} />
                    </div>

                    <div className={styles.sectionCard} style={{ margin: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '3rem' }}>
                            <div className={styles.iconBox} style={{ width: '4rem', height: '4rem' }}>
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h2 className={styles.sectionTitle} style={{ fontSize: '1.875rem' }}>Operación</h2>
                                <p className={styles.sectionTag}>Ciclo Determinista</p>
                            </div>
                        </div>
                        <MethodSteps />
                    </div>
                </div>

                <div className={styles.footerContainer}>
                    <button className={styles.downloadButton}>
                        <span>Descargar Protocolo de Motor (S2RQF)</span>
                        <ArrowRight size={20} />
                    </button>
                    <div className={styles.cryptoSig}>
                        Firmado Digitalmente • Hash de Bloque: 0x4f...892c
                    </div>
                </div>
            </div>
        </div>
    );
}
