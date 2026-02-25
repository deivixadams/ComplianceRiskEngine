import {
    Filter,
    ExternalLink,
    FileCheck,
    AlertCircle,
    Clock,
    ChevronRight,
    Plus
} from "lucide-react";

export default function DomainDetailView({ domainId = "D05", domainName = "Hard-Gates & Special Measures" }) {
    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '1.5rem', height: 'calc(100vh - 12rem)' }}>
            {/* Left: Table of Obligations */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ fontSize: '1.1rem' }}>Obligaciones {domainId}</h3>
                    <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                        <Filter size={18} />
                    </button>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <ObligationListItem code="OB-0501" name="Identificación de PEPs" criticality="Crítica" score={35} active={true} />
                    <ObligationListItem code="OB-0502" name="Reporte de Congelamiento" criticality="Crítica" score={12} />
                    <ObligationListItem code="OB-0503" name="Debida Diligencia Especial" criticality="Alta" score={85} />
                    <ObligationListItem code="OB-0504" name="Listas de Sanciones UN" criticality="Crítica" score={92} />
                    <ObligationListItem code="OB-0505" name="Monitoreo Transaccional PEP" criticality="Alta" score={60} />
                </div>
            </div>

            {/* Right: Detail Drill-down */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
                <div style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 'bold' }}>OB-0501 · CRÍTICA</span>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginTop: '0.25rem' }}>Identificación de PEPs</h2>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--danger)' }}>35%</p>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Defendibilidad</p>
                        </div>
                    </div>
                    <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8, lineHeight: '1.5' }}>
                        Asegurar que la institución cuente con procedimientos automatizados para la identificación de Personas Expuestas Políticamente (PEP) en el onboarding y de forma continua.
                    </p>
                </div>

                {/* Cobertura Estructural */}
                <section>
                    <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', opacity: 0.6 }}>COBERTURA ESTRUCTURAL</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <CoverageStat label="Controles" value="2" total="2" status="OK" />
                        <CoverageStat label="Pruebas" value="1" total="4" status="Warning" />
                        <CoverageStat label="Evidencia" value="0" total="2" status="Critical" />
                    </div>
                </section>

                {/* Evidence & Artifacts */}
                <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h4 style={{ fontSize: '0.95rem', opacity: 0.6 }}>EVIDENCIA VIGENTE (ARTEFACTOS)</h4>
                        <button style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                            <Plus size={14} /> Registrar
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <ArtifactItem name="Política_Identificación_PEP_v2.pdf" type="Manual / Política" status="Vencida" date="2025-12-31" />
                        <div style={{ padding: '2rem', border: '2px dashed var(--glass-border)', borderRadius: '12px', textAlign: 'center', opacity: 0.5 }}>
                            <AlertCircle size={32} style={{ margin: '0 auto 0.5rem' }} />
                            <p style={{ fontSize: '0.85rem' }}>Falta Evidencia de Funcionamiento Práctico (Muestreo)</p>
                        </div>
                    </div>
                </section>

                {/* Recent Tests */}
                <section>
                    <h4 style={{ marginBottom: '1rem', fontSize: '0.95rem', opacity: 0.6 }}>ÚLTIMAS PRUEBAS</h4>
                    <div className="glass-card" style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'var(--danger)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>PR-0501A: Cruce Automático Listas</p>
                                <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>Ejecutada: 2026-02-15 · Por: Bot Inspector</p>
                            </div>
                            <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>FALLIDA</span>
                        </div>
                        <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', opacity: 0.8 }}>
                            No se pudo verificar la actualización diaria de la lista OFAC en los últimos 3 días.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}

function ObligationListItem({ code, name, criticality, score, active }: any) {
    return (
        <div style={{
            padding: '1rem',
            borderRadius: '12px',
            background: active ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            border: active ? '1px solid var(--primary)' : '1px solid transparent',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>{code}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{name}</span>
                <span style={{ fontSize: '0.7rem', color: criticality === 'Crítica' ? 'var(--danger)' : 'var(--warning)' }}>{criticality}</span>
            </div>
            <div style={{ textAlign: 'right' }}>
                <p style={{ fontWeight: 'bold', color: score < 50 ? 'var(--danger)' : 'var(--accent)' }}>{score}%</p>
                <ChevronRight size={16} opacity={0.3} />
            </div>
        </div>
    );
}

function CoverageStat({ label, value, total, status }: any) {
    const color = status === 'OK' ? 'var(--accent)' : status === 'Warning' ? 'var(--warning)' : 'var(--danger)';
    return (
        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.75rem', borderRadius: '10px', textAlign: 'center' }}>
            <p style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.25rem' }}>{label}</p>
            <p style={{ fontSize: '1.1rem', fontWeight: 'bold', color }}>{value} / {total}</p>
        </div>
    );
}

function ArtifactItem({ name, type, status, date }: any) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <FileCheck size={18} color="var(--primary)" />
                <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{name}</p>
                    <p style={{ fontSize: '0.7rem', opacity: 0.5 }}>{type} · Expira: {date}</p>
                </div>
            </div>
            <span style={{ fontSize: '0.7rem', color: status === 'Vencida' ? 'var(--danger)' : 'var(--accent)', fontWeight: 'bold' }}>{status}</span>
        </div>
    );
}
