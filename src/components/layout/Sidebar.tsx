"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { APP_SHORT_NAME } from "@/config/app";
import {
    PlayCircle,
    ShieldCheck,
    Network,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Calculator,
    Shield,
    BarChart3,
    Users,
    Lock,
    RefreshCw,
    ClipboardList,
    Activity,
    Sigma,
    TrendingUp,
    AlertTriangle,
    Layers,
    CheckSquare,
    Calendar,
    House
} from "lucide-react";

interface MenuItem {
    icon: any;
    label: string;
    href: string;
    tooltip: string;
}

interface MenuSection {
    id: string;
    title: string;
    items: MenuItem[];
}

const mainMenuItems: MenuItem[] = [
    { icon: BarChart3, label: "Dashboard", href: "/score/dashboard", tooltip: "Vista ejecutiva unificada del score." },
];

const institutionalMenu: MenuSection[] = [
    {
        id: "inicio",
        title: "EVALUACIÓN",
        items: [
            { icon: House, label: "Inicio", href: "/score/evaluacion/inicio", tooltip: "Asistente de inicio para la evaluacion." },
            { icon: Layers, label: "Preguntas claves", href: "/score/preguntasClaves", tooltip: "Analisis guiado por preguntas claves del modelo." },
            { icon: Calculator, label: "Parámetros del score", href: "/modelo/parametros", tooltip: "Configuracion y ajuste de parametros del motor de score." },
            { icon: Activity, label: "Prueba de estrés", href: "/score/simulacion3", tooltip: "Clon independiente de Simulacion2 para reingeniería." },
            { icon: TrendingUp, label: "Benchmark", href: "/score/dashboard", tooltip: "Comparativos y referencias externas." },
            { icon: Network, label: "Corpus", href: "/modelo/corpus", tooltip: "Corpus regulatorio estructurado." },
        ]
    },
    {
        id: "auditoria_continua",
        title: "AUDITORÍA CONTINUA",
        items: [
            { icon: ShieldCheck, label: "Motor de pruebas", href: "/validacion/pruebas", tooltip: "Ejecución de pruebas e resultados." },
            { icon: ClipboardList, label: "Inventario", href: "/validacion/auditorias", tooltip: "Inventario y seguimiento de auditorías." },
            { icon: Calendar, label: "Agenda", href: "/validacion/plan", tooltip: "Planificación y cronograma de auditoría continua." },
        ]
    },
    {
        id: "score",
        title: "HISTÓRICOS",
        items: [
            { icon: Sigma, label: "Score", href: "/score/historico", tooltip: "Historial de scores y corridas." },
            { icon: ClipboardList, label: "Auditoría", href: "/validacion/auditorias", tooltip: "Historial de auditorías y validaciones." },
            { icon: AlertTriangle, label: "Hallazgos", href: "/validacion/hallazgos", tooltip: "Gestion de hallazgos." },
        ]
    },
    {
        id: "validacion",
        title: "GESTIÓN DE AUDITORÍA",
        items: [
            { icon: ClipboardList, label: "Plan de auditoría", href: "/validacion/plan", tooltip: "Planificación estratégica de auditoría." },
            { icon: Users, label: "Auditores", href: "/validacion/equipo", tooltip: "Definición del equipo auditor y roles." },
            { icon: CheckSquare, label: "Checklists", href: "/validacion/checklists", tooltip: "Listas de verificacion y seguimiento." },
            { icon: Users, label: "Auditados", href: "/validacion/auditados", tooltip: "Entidades auditadas y monitoreadas." },
        ]
    },
    {
        id: "inteligencia",
        title: "INTELIGENCIA",
        items: [
            { icon: TrendingUp, label: "Tendencias", href: "/score/tendencias", tooltip: "Evolucion de score y senales." },
            { icon: AlertTriangle, label: "Alertas", href: "/score/alertas", tooltip: "Alertas e indicadores tempranos." },
        ]
    },
    {
        id: "modelo",
        title: "MODELO",
        items: [

            { icon: Shield, label: "Parametros", href: "/modelo/parametros", tooltip: "Riesgos y controles del modelo." },
            { icon: Calculator, label: "Versionado", href: "/modelo/versionado", tooltip: "Versiones y perfiles del modelo." },
            { icon: PlayCircle, label: "Motor", href: "/score/motor", tooltip: "Motor de calculo y ejecucion de corridas." },
            { icon: ClipboardList, label: "Gobernanza", href: "/modelo/gobernanza", tooltip: "Gobernanza y decisiones del modelo." },
        ]
    },
    {
        id: "administracion",
        title: "ADMINISTRACION",
        items: [
            { icon: Lock, label: "Configuracion", href: "/admin", tooltip: "Gestion de accesos y configuracion." },
            { icon: RefreshCw, label: "Continuidad", href: "/admin/continuidad", tooltip: "Respaldo, trazabilidad y resiliencia." },
        ]
    }
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const pathname = usePathname();

    useEffect(() => {
        const saved = sessionStorage.getItem('sidebar_expanded');
        if (saved) {
            setExpandedSections(JSON.parse(saved));
        }
    }, []);

    const toggleSection = (id: string) => {
        const newState = {
            ...expandedSections,
            [id]: !expandedSections[id]
        };
        setExpandedSections(newState);
        sessionStorage.setItem('sidebar_expanded', JSON.stringify(newState));
    };

    return (
        <aside
            className={`glass-card`}
            style={{
                width: collapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                padding: '1.25rem 0.75rem',
                borderRadius: '0',
                border: 'none',
                borderRight: '1px solid var(--glass-border)',
                transition: 'width var(--transition-speed) ease',
                margin: 0,
                background: 'rgba(0,0,0,0.2)',
                zIndex: 100
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.75rem', marginBottom: '2rem' }}>
                {!collapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={20} color="white" />
                        </div>
                        <h1 className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.1rem' }}>{APP_SHORT_NAME}</h1>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', padding: '0.5rem' }}
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', overflowX: 'hidden' }}>
                <div style={{ marginBottom: '0.5rem' }}>
                    {mainMenuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href + item.label}
                                href={item.href}
                                title={item.tooltip}
                                className={`sidebar-link ${isActive ? 'active' : ''}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.7rem 0.75rem',
                                    borderRadius: '10px',
                                    color: isActive ? 'white' : 'var(--foreground)',
                                    textDecoration: 'none',
                                    transition: 'all 0.2s ease',
                                    fontSize: '0.85rem',
                                    background: isActive ? 'var(--primary-glow)' : 'transparent',
                                    position: 'relative'
                                }}
                            >
                                <item.icon size={18} color={isActive ? "white" : "var(--primary)"} />
                                {!collapsed && <span>{item.label}</span>}
                                {isActive && !collapsed && (
                                    <div style={{ position: 'absolute', right: '0.5rem', width: '4px', height: '12px', borderRadius: '4px', background: 'white' }} />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {institutionalMenu.map((section) => (
                    <div key={section.id} style={{ marginBottom: '0.5rem' }}>
                        {!collapsed ? (
                            <div
                                onClick={() => toggleSection(section.id)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    fontSize: '0.7rem',
                                    textTransform: 'uppercase',
                                    color: expandedSections[section.id] ? 'var(--primary)' : 'var(--muted)',
                                    padding: '0.75rem',
                                    cursor: 'pointer',
                                    letterSpacing: '0.08rem',
                                    fontWeight: expandedSections[section.id] ? 700 : 500,
                                    borderRadius: '8px',
                                    transition: 'all 0.2s ease',
                                    userSelect: 'none'
                                }}
                                className="sidebar-section-header"
                            >
                                <span>{section.title}</span>
                                <ChevronDown
                                    size={14}
                                    style={{
                                        transform: expandedSections[section.id] ? 'rotate(0deg)' : 'rotate(-90deg)',
                                        transition: 'transform 0.2s ease'
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ padding: '0.75rem', borderTop: '1px solid var(--glass-border)', opacity: 0.3 }} />
                        )}

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.2rem',
                            height: (collapsed || expandedSections[section.id]) ? 'auto' : '0',
                            overflow: 'hidden',
                            transition: 'height 0.3s ease'
                        }}>
                            {section.items.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.href + item.label}
                                        href={item.href}
                                        title={item.tooltip}
                                        className={`sidebar-link ${isActive ? 'active' : ''}`}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '1rem',
                                            padding: '0.7rem 0.75rem',
                                            borderRadius: '10px',
                                            color: isActive ? 'white' : 'var(--foreground)',
                                            textDecoration: 'none',
                                            transition: 'all 0.2s ease',
                                            fontSize: '0.85rem',
                                            background: isActive ? 'var(--primary-glow)' : 'transparent',
                                            position: 'relative'
                                        }}
                                    >
                                        <item.icon size={18} color={isActive ? "white" : "var(--primary)"} />
                                        {!collapsed && <span>{item.label}</span>}
                                        {isActive && !collapsed && (
                                            <div style={{ position: 'absolute', right: '0.5rem', width: '4px', height: '12px', borderRadius: '4px', background: 'white' }} />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <style jsx global>{`
                .sidebar-section-header:hover {
                    background: rgba(255, 255, 255, 0.05);
                    color: var(--primary) !important;
                }
                nav::-webkit-scrollbar {
                    width: 3px;
                }
                nav::-webkit-scrollbar-track {
                    background: transparent;
                }
                nav::-webkit-scrollbar-thumb {
                    background: var(--glass-border);
                    border-radius: 10px;
                }
                .sidebar-link:hover {
                    background: rgba(255, 255, 255, 0.08) !important;
                }
            `}</style>
        </aside>
    );
}
