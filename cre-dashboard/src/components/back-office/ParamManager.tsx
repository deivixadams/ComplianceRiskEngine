import {
    Settings,
    Save,
    RefreshCcw,
    Info,
    Sliders,
    Zap,
    Layers,
    Target
} from "lucide-react";

export default function ParamManager() {
    const modelParams = [
        { id: "alpha", name: "Factor de Concentración (α)", value: 0.15, description: "Penaliza la agrupación de debilidades en un solo dominio." },
        { id: "beta", name: "Intensidad de Interdependencia (β)", value: 0.10, description: "Magnifica el riesgo cuando hay fallas en dominios conectados." },
        { id: "gamma", name: "Curvatura de Score (γ)", value: 0.05, description: "Controla la aceleración no lineal del score final." },
    ];

    const categoryWeights = [
        { label: "Existencia", weight: 0.40, color: "var(--primary)" },
        { label: "Formalización", weight: 0.30, color: "var(--secondary)" },
        { label: "Práctica", weight: 0.30, color: "var(--accent)" },
    ];

    return (
        <div className="animate-fade-in">
            <div className="section-header">
                <Settings className="text-primary" />
                <div>
                    <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Calibración del Motor Matemático</h2>
                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 'normal' }}>
                        Ajuste de pesos institucionales y coeficientes de fragilidad estructural
                    </p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
                {/* Model Coefficents */}
                <div className="glass-card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Sliders size={20} className="text-primary" /> Coeficientes S2RQF
                    </h3>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {modelParams.map(param => (
                            <div key={param.id}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>{param.name}</label>
                                    <span className="text-primary" style={{ fontWeight: 'bold' }}>{param.value}</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="0.5"
                                    step="0.01"
                                    value={param.value}
                                    style={{ width: '100%', accentColor: 'var(--primary)' }}
                                />
                                <div style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <Info size={14} /> {param.description}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '1rem' }}>
                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Save size={18} /> Guardar Cambios
                        </button>
                        <button className="glass-card" style={{ margin: 0, padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <RefreshCcw size={18} /> Restaurar Defaults
                        </button>
                    </div>
                </div>

                {/* Dimension Weighting */}
                <div className="glass-card">
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Layers size={20} className="text-primary" /> Ponderación de Dimensiones
                    </h3>

                    <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1.5rem' }}>
                        Define cuánto aporta cada dimensión de la evaluación al nivel de efectividad del control.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {categoryWeights.map(cat => (
                            <div key={cat.label} className="glass-card" style={{ padding: '1rem', margin: 0, background: 'rgba(255,255,255,0.02)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: cat.color }}></div>
                                        <span style={{ fontWeight: '600' }}>{cat.label}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <input
                                            type="number"
                                            value={cat.weight * 100}
                                            style={{
                                                width: '60px',
                                                padding: '0.4rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--glass-border)',
                                                borderRadius: '6px',
                                                color: 'white',
                                                textAlign: 'center'
                                            }}
                                        />
                                        <span style={{ width: '20px' }}>%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '2rem' }}>
                        <div style={{ height: '24px', width: '100%', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', overflow: 'hidden', display: 'flex' }}>
                            {categoryWeights.map(cat => (
                                <div key={cat.label} style={{ width: `${cat.weight * 100}%`, height: '100%', background: cat.color }}></div>
                            ))}
                        </div>
                        <div style={{ marginTop: '0.75rem', textAlign: 'center', fontSize: '0.85rem', fontWeight: '600', color: categoryWeights.reduce((a, b) => a + b.weight, 0) === 1 ? 'var(--accent)' : 'var(--danger)' }}>
                            Suma Total: {(categoryWeights.reduce((a, b) => a + b.weight, 0) * 100).toFixed(0)}%
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Zap size={20} className="text-warning" /> Gatillos de Riesgo (Gatillos No Compensables)
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', marginBottom: '1rem' }}>
                    Configuración de umbrales que activan automáticamente un nivel de exposición mínimo, ignorando promedios.
                </p>
                <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '1rem', borderRadius: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Target className="text-warning" />
                        <div>
                            <div style={{ fontWeight: '600' }}>Incumplimiento Crítico en Reportes (ROS)</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>Si Efectividad < 0.20 → Marcar Score como CRÍTICO automáticamente.</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
