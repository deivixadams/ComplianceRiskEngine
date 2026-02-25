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
    Plus,
    X,
    Lock,
    Loader2,
    CheckCircle2,
    ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

export default function UserManagementPage() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [roleCode, setRoleCode] = useState('OPERATOR');
    const [tenantId, setTenantId] = useState('00000000-0000-0000-0000-000000000001');
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
        <div className="animate-fade-in">
            {/* Header section */}
            <div className="section-header" style={{ marginBottom: '2rem' }}>
                <Link href="/admin" style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', marginRight: '1rem' }}>
                    <ArrowLeft size={20} />
                </Link>
                <Users className="text-primary" />
                <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Gestión de Usuarios</h1>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                <p style={{ color: 'var(--muted)', margin: 0, maxWidth: '600px' }}>
                    Administre el acceso institucional y la gobernanza de identidades para el cumplimiento regulatorio.
                </p>
                <button
                    onClick={() => setIsModalOpen(true)}
                    style={{
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '10px',
                        fontWeight: 'bold',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}
                >
                    <Plus size={18} /> NUEVO USUARIO
                </button>
            </div>

            {/* Stats Bar */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2rem'
            }}>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '0.5rem' }}>Total Usuarios</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--foreground)', margin: 0 }}>{users.length}</p>
                </div>
                <div className="glass-card" style={{ padding: '1.25rem' }}>
                    <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05rem', marginBottom: '0.5rem' }}>Administradores</p>
                    <p style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--primary)', margin: 0 }}>{users.filter(u => u.roleCode === 'ADMIN').length}</p>
                </div>
                <div className="glass-card" style={{ padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', gridColumn: 'span 2' }}>
                    <Search size={18} style={{ color: 'var(--muted)', marginRight: '1rem' }} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o correo..."
                        style={{
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--foreground)',
                            width: '100%',
                            fontSize: '0.9rem'
                        }}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.02)' }}>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'center', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', width: '80px' }}>Status</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Usuario</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Rol</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Registro</th>
                            <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            Array(3).fill(0).map((_, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td colSpan={5} style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted)', fontSize: '0.8rem' }}>Cargando datos...</td>
                                </tr>
                            ))
                        ) : users.length === 0 ? (
                            <tr>
                                <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)' }}>No se encontraron usuarios registrados.</td>
                            </tr>
                        ) : users.map((user) => (
                            <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'center' }}>
                                    <div style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        margin: '0 auto',
                                        background: user.isActive ? '#10b981' : '#64748b',
                                        boxShadow: user.isActive ? '0 0 8px #10b981' : 'none'
                                    }} />
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(139,92,246,0.1))',
                                            border: '1px solid var(--glass-border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--primary)',
                                            fontWeight: 'bold',
                                            fontSize: '0.9rem'
                                        }}>
                                            {user.fullName?.[0] || user.email[0]}
                                        </div>
                                        <div>
                                            <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 'bold' }}>{user.fullName || 'Sin nombre'}</p>
                                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--muted)' }}>{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1rem 1.5rem' }}>
                                    <span style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 900,
                                        padding: '0.2rem 0.5rem',
                                        borderRadius: '6px',
                                        border: '1px solid var(--glass-border)',
                                        color: user.roleCode === 'ADMIN' ? 'var(--primary)' : 'var(--muted)',
                                        background: 'rgba(255,255,255,0.02)'
                                    }}>
                                        {user.roleCode}
                                    </span>
                                </td>
                                <td style={{ padding: '1rem 1.5rem', fontSize: '0.8rem', color: 'var(--muted)' }}>
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                                    <button style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
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
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(10px)'
                }}>
                    <div className="glass-card" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', position: 'relative' }}>
                        <button
                            onClick={() => setIsModalOpen(false)}
                            style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
                        >
                            <X size={20} />
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{ padding: '0.75rem', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
                                <UserPlus size={24} />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0 }}>Nuevo Usuario</h2>
                        </div>

                        {success ? (
                            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
                                <CheckCircle2 size={48} style={{ color: '#10b981', marginBottom: '1rem' }} />
                                <p style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>Usuario Registrado</p>
                                <p style={{ color: 'var(--muted)' }}>Actualizando base de datos centralizada...</p>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Nombre</label>
                                        <input
                                            required
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Tenant ID</label>
                                        <input
                                            required
                                            value={tenantId}
                                            onChange={(e) => setTenantId(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Email Corporativo</label>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Rol</label>
                                        <select
                                            value={roleCode}
                                            onChange={(e) => setRoleCode(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                        >
                                            <option value="ADMIN">Administrador</option>
                                            <option value="OPERATOR">Operador</option>
                                            <option value="AUDITOR">Auditor</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--muted)', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>Contraseña</label>
                                        <input
                                            type="password"
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '8px', color: 'white' }}
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={creating}
                                    style={{
                                        background: 'var(--primary)',
                                        color: 'white',
                                        border: 'none',
                                        padding: '1rem',
                                        borderRadius: '12px',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        marginTop: '1rem',
                                        opacity: creating ? 0.7 : 1
                                    }}
                                >
                                    {creating ? 'PROCESANDO...' : 'REGISTRAR USUARIO'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
