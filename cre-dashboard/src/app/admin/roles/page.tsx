import React from 'react';
import { Lock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RolesPage() {
    return (
        <div className="animate-fade-in">
            <div className="section-header">
                <Lock className="text-primary" />
                <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Roles y Permisos</h1>
            </div>

            <div className="glass-card">
                <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
                    Módulo de gestión de roles en desarrollo.
                </p>
                <Link href="/admin" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <ArrowLeft size={18} /> Volver al Panel
                </Link>
            </div>
        </div>
    );
}
