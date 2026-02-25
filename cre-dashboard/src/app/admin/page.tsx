import React from 'react';
import { Settings, Building, Users, Lock, Library, ArrowRight, Calculator } from 'lucide-react';
import Link from 'next/link';

const adminModules = [
    {
        title: "Configuración",
        description: "Ajustes globales del sistema y parámetros del motor.",
        icon: Settings,
        href: "/admin/configuracion",
        color: "#3b82f6"
    },
    {
        title: "Empresa",
        description: "Gestión de datos institucionales y estructura corporativa.",
        icon: Building,
        href: "/admin/empresa",
        color: "#8b5cf6"
    },
    {
        title: "Usuarios",
        description: "Control de acceso y gestión de personal autorizado.",
        icon: Users,
        href: "/admin/usuarios",
        color: "#10b981"
    },
    {
        title: "Roles",
        description: "Definición de permisos y perfiles de seguridad.",
        icon: Lock,
        href: "/admin/roles",
        color: "#ef4444"
    },
    {
        title: "Biblioteca",
        description: "Repositorio central de documentos y recursos normativos.",
        icon: Library,
        href: "/admin/biblioteca",
        color: "#f59e0b"
    },
    {
        title: "Parámetros del Motor",
        description: "Gestión de pesos Wi, constantes α/β/γ y gatillos no compensables.",
        icon: Calculator,
        href: "/admin/parametros",
        color: "#db2777"
    }
];

export default function AdminPage() {
    return (
        <div className="animate-fade-in">
            <div className="section-header">
                <Lock className="text-primary" />
                <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Panel de Administración</h1>
            </div>

            <p style={{ color: 'var(--muted)', marginBottom: '2.5rem', maxWidth: '800px' }}>
                Bienvenido al centro de control administrativo. Desde aquí puede gestionar la configuración global,
                usuarios, permisos y recursos estructurales del Compliance Risk Engine.
            </p>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                gap: '1.5rem'
            }}>
                {adminModules.map((module) => (
                    <Link key={module.href} href={module.href} style={{ textDecoration: 'none' }}>
                        <div className="glass-card" style={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '12px',
                                background: `rgba(${module.color === '#3b82f6' ? '59, 130, 246' :
                                    module.color === '#8b5cf6' ? '139, 92, 246' :
                                        module.color === '#10b981' ? '16, 185, 129' :
                                            module.color === '#ef4444' ? '239, 68, 68' :
                                                '245, 158, 11'}, 0.1)`,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: module.color
                            }}>
                                <module.icon size={24} />
                            </div>

                            <div>
                                <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: 'var(--foreground)' }}>
                                    {module.title}
                                </h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--muted)', lineHeight: '1.4' }}>
                                    {module.description}
                                </p>
                            </div>

                            <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                                Gestionar <ArrowRight size={14} />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
