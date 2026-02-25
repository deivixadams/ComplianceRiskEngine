import {
    ShieldAlert,
    ShieldCheck,
    Activity,
    Info,
    ArrowRight,
    Clock,
    CheckCircle2,
    XCircle
} from "lucide-react";

export default function EnterpriseDashboard({ enterpriseName = "Bank Alpha" }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Header Contextual */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <nav style={{ fontSize: '0.85rem', opacity: 0.6, marginBottom: '0.5rem' }}>
                        Portafolio / Empresas / {enterpriseName}
                    </nav>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{enterpriseName}</h1>
                    <p style={{ opacity: 0.7 }}>Último Run: 2026-02-23 10:45 AM</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn-primary" style={{ background: 'var(--background)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>Run Model</button>
                    <button className="btn-primary">Export Pack</button>
                </div>
            </div>

            {/* Score and Triggers Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '2.5rem', padding: '2.5rem' }}>
                    <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="140" height="140" viewBox="0 0 140 140">
                            <circle cx="70" cy="70" r="65" stroke="var(--glass-border)" strokeWidth="8" fill="none" />
                            <circle cx="70" cy="70" r="65" stroke="var(--primary)" strokeWidth="8" fill="none"
                                strokeDasharray="408" strokeDashoffset="120" strokeLinecap="round" />
                        </svg>
                        <div style={{ position: 'absolute', textAlign: 'center' }}>
                            <span style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>68.4</span>
                            <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Score Final</p>
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Componentes del Score <Info size={16} opacity={0.5} />
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <ScoreComponent label="E_base (Exposición pura)" value="0.42" color="var(--primary)" />
                            <ScoreComponent label="Concentración (HHI)" value="+0.12" color="var(--warning)" />
                            <ScoreComponent label="Interdependencia" value="+0.08" color="var(--danger)" />
                            <ScoreComponent label="Gatillo (Hard-gate)" value="0.00" color="var(--accent)" />
                        </div>
                    </div>
                </div>

                <div className="glass-card" style={{ border: '1px solid var(--danger)', background: 'rgba(239, 68, 68, 0.05)' }}>
                    <h3 style={{ color: 'var(--danger)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldAlert size={20} /> Gatillos Activos (Critical)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <TriggerItem
                            title="D05: Sanciones no reportadas"
                            desc="Se detectó omisión en el reporte de la lista de sanciones."
                        />
                        <TriggerItem
                            title="D02: Oficial de Cumplimiento"
                            desc="Posición vacante por más de 30 días."
                        />
                    </div>
                </div>
            </div>

            {/* Domain Mosaic (9 cards) */}
            <div>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1.25rem' }}>Dominios Operativos (D01-D09)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
                    <DomainCard id="D01" name="Governance" score={85} trend="+2" />
                    <DomainCard id="D02" name="Compliance Function" score={42} trend="-12" status="Critical" />
                    <DomainCard id="D03" name="Risk Engineering" score={72} trend="+1" />
                    <DomainCard id="D04" name="CDD / Identification" score={65} trend="+5" />
                    <DomainCard id="D05" name="Hard-Gates & Special Measures" score={38} trend="-20" status="Critical" />
                    <DomainCard id="D06" name="Monitoring & Reporting" score={68} trend="0" />
                    <DomainCard id="D07" name="Recordkeeping" score={92} trend="+2" />
                    <DomainCard id="D08" name="Internal Controls & Culture" score={55} trend="-5" />
                    <DomainCard id="D09" name="Cooperation with Authorities" score={88} trend="+1" />
                </div>
            </div>
        </div>
    );
}

function ScoreComponent({ label, value, color }: any) {
    return (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{label}</span>
            <span style={{ fontWeight: 'bold', color }}>{value}</span>
        </div>
    );
}

function TriggerItem({ title, desc }: any) {
    return (
        <div style={{ padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
            <p style={{ fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.25rem' }}>{title}</p>
            <p style={{ fontSize: '0.8rem', opacity: 0.7 }}>{desc}</p>
        </div>
    );
}

function DomainCard({ id, name, score, trend, status }: any) {
    const isCritical = status === 'Critical';
    return (
        <div className="glass-card" style={{
            borderColor: isCritical ? 'rgba(239, 68, 68, 0.3)' : 'var(--glass-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            cursor: 'pointer'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <span style={{ fontSize: '0.75rem', opacity: 0.6, fontWeight: 'bold' }}>{id}</span>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>{name}</h4>
                </div>
                <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '12px',
                    background: isCritical ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: isCritical ? 'var(--danger)' : 'var(--primary)'
                }}>
                    {score}
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', opacity: 0.7 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {trend > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    {trend}% vs anterior
                </span>
                <ArrowRight size={14} />
            </div>
        </div>
    );
}

function TrendingUpIcon() { return <span style={{ color: 'var(--accent)' }}>▲</span>; }
function TrendingDownIcon() { return <span style={{ color: 'var(--danger)' }}>▼</span>; }
