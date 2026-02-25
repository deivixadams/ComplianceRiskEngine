"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Autenticación fallida');
            }

            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '80vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            position: 'relative',
        }}>
            {/* Background elements */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                right: '-10%',
                width: '500px',
                height: '500px',
                background: 'rgba(59, 130, 246, 0.05)',
                borderRadius: '50%',
                filter: 'blur(120px)',
                pointerEvents: 'none'
            }} />

            <div style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
                {/* Logo Area */}
                <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        border: '1px solid rgba(59, 130, 246, 0.2)',
                        borderRadius: '16px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: '1rem',
                        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.1)'
                    }}>
                        <Shield size={32} style={{ color: 'var(--primary)' }} />
                    </div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 900, color: 'white', margin: 0, letterSpacing: '-0.05rem' }}>
                        CRE <span style={{ color: 'var(--primary)', fontSize: '1rem', verticalAlign: 'top' }}>V3</span>
                    </h1>
                    <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Compliance Risk Engine Architecture</p>
                </div>

                {/* Login Card */}
                <div className="glass-card" style={{ padding: '2.5rem', borderRadius: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'white', marginBottom: '1.5rem' }}>Acceso Institucional</h2>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>Correo Electrónico</label>
                            <div style={{ position: 'relative' }}>
                                <Mail size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--muted)' }} />
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nombre@empresa.com"
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid var(--glass-border)',
                                        padding: '0.85rem 1rem 0.85rem 3rem',
                                        borderRadius: '12px',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingRight: '0.25rem' }}>
                                <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem', paddingLeft: '0.25rem' }}>Contraseña</label>
                                <a href="#" style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>Olvidé mi clave</a>
                            </div>
                            <div style={{ position: 'relative' }}>
                                <Lock size={18} style={{ position: 'absolute', left: '1rem', top: '1rem', color: 'var(--muted)' }} />
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%',
                                        background: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid var(--glass-border)',
                                        padding: '0.85rem 1rem 0.85rem 3rem',
                                        borderRadius: '12px',
                                        color: 'white',
                                        outline: 'none'
                                    }}
                                />
                            </div>
                        </div>

                        {error && (
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                padding: '0.75rem',
                                borderRadius: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem'
                            }}>
                                <AlertCircle size={18} style={{ color: '#ef4444' }} />
                                <p style={{ color: '#ef4444', fontSize: '0.75rem', margin: 0, fontWeight: 500 }}>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                padding: '1rem',
                                borderRadius: '12px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            {loading ? (
                                <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                                <>
                                    INGRESAR AL SISTEMA <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', marginTop: '2.5rem', color: 'var(--muted)', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1rem', opacity: 0.5 }}>
                    SISTEMA DE CUANTIFICACIÓN DETERMINISTA - CRE © 2026
                </p>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
