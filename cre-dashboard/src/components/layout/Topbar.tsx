"use client";

import { Search, Bell, User, LayoutGrid, Sun, Moon } from "lucide-react";
import { useTheme } from "./ThemeContext";

export default function Topbar() {
    const { theme, toggleTheme } = useTheme();

    return (
        <header style={{
            padding: '0.75rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            borderBottom: '1px solid var(--glass-border)',
            background: 'var(--background)',
            zIndex: 10
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
                <div style={{ position: 'relative', flex: 0.5 }}>
                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                    <input
                        type="text"
                        placeholder="Comando (Ctrl+K)..."
                        style={{
                            width: '100%',
                            padding: '0.6rem 1rem 0.6rem 2.5rem',
                            borderRadius: '12px',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--glass-border)',
                            color: 'var(--foreground)',
                            outline: 'none'
                        }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <ScopeSelector label="Leyes" value="155-17" />
                    <ScopeSelector label="Empresa" value="Todas" />
                </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <button
                    onClick={toggleTheme}
                    style={iconBtnStyle}
                    title={theme === 'dark' ? "Modo Claro" : "Modo Oscuro"}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <button style={iconBtnStyle}><Bell size={20} /></button>
                <button style={iconBtnStyle}><LayoutGrid size={20} /></button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingLeft: '1rem', borderLeft: '1px solid var(--glass-border)' }}>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: '600' }}>Admin User</p>
                        <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>Auditor Mode</p>
                    </div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <User size={20} color="white" />
                    </div>
                </div>
            </div>
        </header>
    );
}

function ScopeSelector({ label, value }: { label: string, value: string }) {
    return (
        <div className="glass-card" style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', display: 'flex', gap: '0.5rem', borderRadius: '10px' }}>
            <span style={{ opacity: 0.6 }}>{label}:</span>
            <span style={{ fontWeight: '600' }}>{value}</span>
        </div>
    );
}

const iconBtnStyle = {
    background: 'none',
    border: 'none',
    color: 'var(--foreground)',
    cursor: 'pointer',
    opacity: 0.7,
    transition: 'opacity 0.2s',
    display: 'flex',
    alignItems: 'center'
}
