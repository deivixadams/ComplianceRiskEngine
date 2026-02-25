import {
  Code2,
  Play,
  Terminal,
  FileCode,
  Database,
  AlertCircle,
  Settings
} from "lucide-react";

export default function TestInventory() {
  const scripts = [
    {
      id: "SCR-AML-001",
      name: "Integridad de KYC",
      type: "Automated",
      lastRun: "2024-02-23 15:45",
      result: "92%",
      status: "Success",
      desc: "Evalúa completitud de campos críticos y consistencia de datos en el maestro de clientes."
    },
    {
      id: "SCR-AML-002",
      name: "Seguimiento de Alertas",
      type: "Automated",
      lastRun: "2024-02-23 15:50",
      result: "14 pendientes",
      status: "Warning",
      desc: "Cruza alertas generadas vs casos cerrados y detecta cuellos de botella."
    },
    {
      id: "SCR-AML-003",
      name: "Oportunidad de Reportes",
      type: "Automated",
      lastRun: "2024-02-22 10:00",
      result: "En plazo",
      status: "Success",
      desc: "Mide el tiempo entre detección y reporte efectivo ante la autoridad."
    },
  ];

  return (
    <div className="animate-fade-in">
      <div className="section-header">
        <Code2 className="text-primary" />
        <div>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Inventario de Pruebas y Scripts</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--muted)', fontWeight: 'normal' }}>
            Validaciones automáticas y scripts de integridad de datos (Diferenciador Premium)
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        {scripts.map(s => (
          <div key={s.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Terminal size={24} className="text-primary" />
              </div>
              <span className={`badge ${s.status === 'Success' ? 'badge-success' : 'badge-warning'}`}>
                {s.status}
              </span>
            </div>

            <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem' }}>{s.name}</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--muted)', flexGrow: 1, marginBottom: '1.5rem' }}>
              {s.desc}
            </p>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.8rem' }}>
                <span className="text-muted">Última Ejecución</span>
                <span style={{ fontWeight: '600' }}>{s.lastRun}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span className="text-muted">Resultado</span>
                <span className="text-primary" style={{ fontWeight: '800' }}>{s.result}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Play size={16} /> Ejecutar Ahora
              </button>
              <button className="glass-card" style={{ margin: 0, padding: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Settings size={18} />
              </button>
            </div>
          </div>
        ))}

        <div className="glass-card" style={{ borderStyle: 'dashed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', opacity: 0.7 }}>
          <Plus size={40} className="text-muted" style={{ marginBottom: '1rem' }} />
          <div style={{ fontWeight: '600' }}>Nuevo Script</div>
          <p style={{ fontSize: '0.8rem', color: 'var(--muted)', textAlign: 'center', marginTop: '0.5rem' }}>Define una nueva lógica de validación automática</p>
        </div>
      </div>

      <div className="glass-card" style={{ marginTop: '2rem', display: 'flex', gap: '2rem', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Database className="text-primary" />
          <div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Conexión Engine</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>Sincronizado con D:\_CRE\lib\engine.ts</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <FileCode className="text-primary" />
          <div>
            <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Versionado</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Git ID: 88f21bc</div>
          </div>
        </div>
      </div>
    </div >
  );
}

function Plus({ size, className, style }: { size?: number, className?: string, style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size || 24}
      height={size || 24}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}
