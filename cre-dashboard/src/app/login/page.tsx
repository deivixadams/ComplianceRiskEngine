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

            // Successfully logged in
            // Set some local state or cookie if needed, then redirect
            router.push('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#030712] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Logo Area */}
                <div className="text-center mb-8 flex flex-col items-center">
                    <div className="w-16 h-16 bg-blue-600/20 border border-blue-500/30 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-500/10">
                        <Shield size={32} className="text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                        CRE <span className="text-blue-500 text-sm align-top">V3</span>
                    </h1>
                    <p className="text-gray-400 text-sm">Compliance Risk Engine Architecture</p>
                </div>

                {/* Login Card */}
                <div className="bg-gray-900/40 backdrop-blur-xl border border-white/10 p-8 rounded-[2rem] shadow-2xl relative">
                    <h2 className="text-xl font-bold text-white mb-6">Acceso Institucional</h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest pl-1">Correo Electrónico</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="nombre@empresa.com"
                                    className="w-full bg-gray-800/50 border border-white/5 py-3.5 pl-11 pr-4 rounded-xl text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-gray-600"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Contraseña</label>
                                <a href="#" className="text-[10px] text-blue-500 font-bold uppercase hover:underline">Olvide mi clave</a>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock size={18} className="text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-gray-800/50 border border-white/5 py-3.5 pl-11 pr-4 rounded-xl text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 transition-all placeholder:text-gray-600"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                                <AlertCircle size={18} className="text-red-500 shrink-0" />
                                <p className="text-red-500 text-xs font-medium">{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
                        >
                            {loading ? (
                                <Loader2 size={20} className="animate-spin" />
                            ) : (
                                <>
                                    INGRESAR AL SISTEMA <ChevronRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Decorative subtle border */}
                    <div className="absolute inset-0 rounded-[2rem] border border-white/5 pointer-events-none" />
                </div>

                {/* Footer text */}
                <p className="text-center mt-8 text-gray-500 text-[10px] uppercase tracking-widest font-black opacity-50">
                    SISTEMA DE CUANTIFICACIÓN DETERMINISTA - CRE © 2026
                </p>
            </div>

            <style jsx global>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
            `}</style>
        </div>
    );
}
