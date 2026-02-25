"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    Home,
    PlayCircle,
    ShieldCheck,
    Network,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Settings,
    Calculator,
    Shield,
    BarChart3,
    Users,
    Lock,
    RefreshCw,
    ClipboardList,
    Activity,
    Sigma
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

const institutionalMenu: MenuSection[] = [
    {
        id: "operacion",
        title: "OPERACIÓN",
        items: [
            { icon: Home, label: "Inicio", href: "/", tooltip: "Vista ejecutiva del estado actual del programa AML." },
            { icon: BarChart3, label: "Score", href: "/score", tooltip: "Exposición estructural y readiness por empresa o unidad." },
            { icon: PlayCircle, label: "Evaluación", href: "/runs", tooltip: "Evaluación periódica de controles y obligaciones." },
            { icon: ClipboardList, label: "Auditoría", href: "/auditoria", tooltip: "Módulo de auditoría y validación de hallazgos." },
            { icon: Shield, label: "Riesgos y Controles", href: "/riesgos", tooltip: "Mapa estructural de mitigación y dependencias." },
            { icon: ShieldCheck, label: "Evidencia", href: "/evidencia", tooltip: "Inventario de evidencia versionada y trazable." },
        ]
    },
    {
        id: "gobierno",
        title: "GOBIERNO",
        items: [
            { icon: Calculator, label: "Gobernanza del Modelo", href: "/gobernanza/parametros", tooltip: "Parametrización oficial del motor y perfiles regulatorios." },
            { icon: ClipboardList, label: "Comité y Decisiones", href: "/gobierno/decisiones", tooltip: "Registro formal de decisiones y actas del comité." },
        ]
    },
    {
        id: "norma",
        title: "NORMA",
        items: [
            { icon: Network, label: "Corpus Normativo", href: "/back-office/corpus", tooltip: "Marco regulatorio estructurado por dominio y obligación." },
            { icon: Sigma, label: "Metodología y Matemática", href: "/settings/methodology", tooltip: "Modelo matemático y lógica determinista del motor." },
        ]
    },
    {
        id: "administracion",
        title: "ADMINISTRACIÓN",
        items: [
            { icon: Lock, label: "Usuarios y Roles", href: "/admin", tooltip: "Gestión de accesos y permisos." },
            { icon: Activity, label: "Continuidad", href: "/admin/continuidad", tooltip: "Configuración de respaldo, trazabilidad y resiliencia." },
        ]
    }
];

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    // Closed by default as per requirement
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const pathname = usePathname();

    // Persist expanded state in session (optional but mentioned in requirements)
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
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.75rem', marginBottom: '2rem' }}>
                {!collapsed && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Shield size={20} color="white" />
                        </div>
                        <h1 className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '0.1rem' }}>CRE</h1>
                    </div>
                )}
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    style={{ background: 'none', border: 'none', color: 'var(--foreground)', cursor: 'pointer', padding: '0.5rem' }}
                >
                    {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem', overflowY: 'auto', overflowX: 'hidden' }}>
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
                                        key={item.href}
                                        href={item.href}
                                        title={item.tooltip} // Built-in tooltip
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

            {/* Footer */}
            <div style={{ padding: '0.75rem', borderTop: '1px solid var(--glass-border)', marginTop: '0.5rem' }}>
                <Link
                    href="/settings"
                    title="Ajustes globales del sistema"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        color: 'var(--foreground)',
                        textDecoration: 'none',
                        fontSize: '0.85rem'
                    }}
                >
                    <Settings size={20} color="var(--primary)" />
                    {!collapsed && <span>Ajustes</span>}
                </Link>
            </div>

            {/* Injected custom styles for hover/scroll */}
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
