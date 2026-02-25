import React from 'react';
import { Library, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BibliotecaPage() {
    return (
        <div className="animate-fade-in">
            <div className="section-header">
                <Library className="text-primary" />
                <h1 className="gradient-text" style={{ fontSize: '2rem', margin: 0 }}>Biblioteca Normativa</h1>
            </div>

            <div className="glass-card">
                <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
                    Módulo de biblioteca y recursos normativos en desarrollo.
                </p>
                <Link href="/admin" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
                    <ArrowLeft size={18} /> Volver al Panel
                </Link>
            </div>
        </div>
    );
}
