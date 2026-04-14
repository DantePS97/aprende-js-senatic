'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await register(email, password, displayName);
      router.push('/');
    } catch {
      // error ya está en el store
    }
  };

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🚀</div>
          <h1 className="text-2xl font-bold text-white">Comienza a aprender</h1>
          <p className="text-slate-400 text-sm mt-1">Crea tu cuenta gratis</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {error && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm text-slate-400 mb-1.5">
              Tu nombre
            </label>
            <input
              id="name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              autoComplete="name"
              className="w-full bg-surface-900 border border-slate-700 rounded-lg px-3 py-3
                         text-white placeholder-slate-600 focus:outline-none focus:border-primary-500
                         transition-colors text-sm"
              placeholder="Valentina García"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm text-slate-400 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full bg-surface-900 border border-slate-700 rounded-lg px-3 py-3
                         text-white placeholder-slate-600 focus:outline-none focus:border-primary-500
                         transition-colors text-sm"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm text-slate-400 mb-1.5">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-surface-900 border border-slate-700 rounded-lg px-3 py-3
                         text-white placeholder-slate-600 focus:outline-none focus:border-primary-500
                         transition-colors text-sm"
              placeholder="Mínimo 8 caracteres"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary"
          >
            {isLoading ? 'Creando cuenta...' : 'Crear cuenta gratis'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-primary-400 hover:text-primary-300">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
