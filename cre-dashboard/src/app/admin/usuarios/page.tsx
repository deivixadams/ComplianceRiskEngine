"use client";

import { useState, useEffect } from 'react';
import {
    Users,
    UserPlus,
    Shield,
    Mail,
    Search,
    BadgeCheck,
    MoreVertical,
    Filter,
    Plus,
    X,
    Lock,
    Loader2,
    CheckCircle2
} from 'lucide-react';

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [roleCode, setRoleCode] = useState('OPERATOR');
    const [tenantId, setTenantId] = useState('00000000-0000-0000-0000-000000000001'); // Placeholder tenant
    const [creating, setCreating] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, fullName, roleCode, tenantId })
            });
            if (res.ok) {
                setSuccess(true);
                setTimeout(() => {
                    setSuccess(false);
                    setIsModalOpen(false);
                    fetchUsers();
                    // Clear form
                    setEmail('');
                    setFullName('');
                    setPassword('');
                }, 1500);
            }
        } catch (err) {
            console.error('Error creating user:', err);
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {/* Header section */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <Users className="text-blue-500" size={24} />
                        </div>
                        <h1 className="text-2xl font-black text-white tracking-tight">Gesti&oacute;n de Usuarios</h1>
                    </div>
                    <p className="text-gray-400 text-sm">Control de acceso institucional y gesti&oacute;n de identidades.</p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-lg shadow-blue-600/10"
                >
                    <Plus size={18} /> NUEVO USUARIO
                </button>
            </div>

            {/* Stats / Filters Bar */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gray-900/40 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Total Usuarios</p>
                    <p className="text-2xl font-bold text-white">{users.length}</p>
                </div>
                <div className="bg-gray-900/40 border border-white/5 p-4 rounded-2xl">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Administradores</p>
                    <p className="text-2xl font-bold text-blue-500">{users.filter(u => u.roleCode === 'ADMIN').length}</p>
                </div>
                <div className="md:col-span-2 bg-gray-900/40 border border-white/5 p-2 rounded-2xl flex items-center">
                    <Search size={18} className="text-gray-500 ml-3" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        className="bg-transparent border-none outline-none text-white text-sm w-full px-3 placeholder:text-gray-600"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="bg-gray-900/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/5 bg-white/2">
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center w-16">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Usuario</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Rol</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Fecha Registro</th>
                            <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <tr key={i} className="animate-pulse">
                                    <td colSpan={5} className="px-6 py-8 border-b border-white/5">
                                        <div className="h-4 bg-white/5 rounded w-full"></div>
                                    </td>
                                </tr>
                            ))
                        ) : users.map((user) => (
                            <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                                <td className="px-6 py-4 text-center">
                                    {user.isActive ? (
                                        <div className="w-2 h-2 bg-emerald-500 rounded-full mx-auto shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                    ) : (
                                        <div className="w-2 h-2 bg-gray-500 rounded-full mx-auto" />
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-white/5 text-blue-500 font-bold uppercase">
                                            {user.fullName?.[0] || user.email[0]}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-white">{user.fullName || 'Sin nombre'}</p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${user.roleCode === 'ADMIN' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' : 'text-gray-400 border-white/5'
                                        }`}>
                                        {user.roleCode}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors">
                                        <MoreVertical size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal de Creación */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
                    <div className="bg-gray-900 border border-white/10 w-full max-w-xl rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                        <div className="p-8 sm:p-10">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-8 right-8 text-gray-500 hover:text-white transition-colors"
                            >
                                <X size={24} />
                            </button>

                            <div className="flex items-center gap-4 mb-8">
                                <div className="p-3 bg-blue-500/10 rounded-2xl">
                                    <UserPlus className="text-blue-500" size={28} />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Registrar Colaborador</h2>
                            </div>

                            {success ? (
                                <div className="py-12 flex flex-col items-center animate-in zoom-in duration-500">
                                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4 border border-emerald-500/30">
                                        <CheckCircle2 size={32} className="text-emerald-500" />
                                    </div>
                                    <p className="text-xl font-bold text-white mb-2">Usuario Creado</p>
                                    <p className="text-gray-500 text-sm">Sincronizando con el directorio central...</p>
                                </div>
                            ) : (
                                <form onSubmit={handleCreateUser} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Nombre Completo</label>
                                            <input
                                                required
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full bg-gray-800/50 border border-white/5 p-3.5 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">ID Tenant</label>
                                            <input
                                                required
                                                value={tenantId}
                                                onChange={(e) => setTenantId(e.target.value)}
                                                className="w-full bg-gray-800/50 border border-white/5 p-3.5 rounded-xl text-white outline-none focus:border-blue-500 transition-colors placeholder:text-gray-700"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Correo Corporativo</label>
                                        <div className="relative">
                                            <Mail className="absolute left-4 top-4 text-gray-500" size={18} />
                                            <input
                                                type="email"
                                                required
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full bg-gray-800/50 border border-white/5 py-4 pl-12 pr-4 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Tipo de Rol</label>
                                            <select
                                                value={roleCode}
                                                onChange={(e) => setRoleCode(e.target.value)}
                                                className="w-full bg-gray-800/50 border border-white/5 p-3.5 rounded-xl text-white outline-none focus:border-blue-500 transition-colors appearance-none"
                                            >
                                                <option value="ADMIN">Administrador</option>
                                                <option value="OPERATOR">Operador</option>
                                                <option value="AUDITOR">Auditor</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest pl-1">Clave Provisional</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-4 text-gray-500" size={18} />
                                                <input
                                                    type="password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="w-full bg-gray-800/50 border border-white/5 py-3.5 pl-12 pr-4 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        disabled={creating}
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                                    >
                                        {creating ? <Loader2 className="animate-spin" /> : 'CONFIRMAR ALTA DE USUARIO'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
