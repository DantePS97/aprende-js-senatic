'use client';

import { useState } from 'react';
import Link from 'next/link';
import { forgotPassword } from '@/services/auth.service';

type Status = 'idle' | 'loading' | 'success' | 'error';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg(null);

    try {
      await forgotPassword(email);
      setStatus('success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado.';
      setErrorMsg(message);
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">📬</div>
          <h1 className="text-2xl font-bold text-white mb-2">Revisa tu correo</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Si tu correo está registrado, recibirás un enlace en breve.
            Revisa también tu carpeta de spam.
          </p>
          <Link
            href="/login"
            className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-white">¿Olvidaste tu contraseña?</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ingresa tu email y te enviaremos un enlace para restablecerla.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {errorMsg && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

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

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full btn-primary"
          >
            {status === 'loading' ? 'Enviando...' : 'Enviar enlace'}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-4">
          ¿Recordaste tu contraseña?{' '}
          <Link href="/login" className="text-primary-400 hover:text-primary-300">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
