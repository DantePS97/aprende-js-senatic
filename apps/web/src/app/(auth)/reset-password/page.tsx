'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { validateResetToken, resetPassword } from '@/services/auth.service';

// ─── Suspense fallback ────────────────────────────────────────────────────────

function ResetPasswordSkeleton() {
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4 animate-pulse">🔐</div>
        <div className="h-4 bg-slate-700 rounded w-3/4 mx-auto mb-3 animate-pulse" />
        <div className="h-4 bg-slate-700 rounded w-1/2 mx-auto animate-pulse" />
      </div>
    </div>
  );
}

// ─── Componente interno (requiere Suspense por useSearchParams) ───────────────

type TokenStatus = 'checking' | 'valid' | 'invalid';
type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') ?? '';

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('checking');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Validar token al montar — solo lectura, no lo consume
  useEffect(() => {
    if (!token) {
      setTokenStatus('invalid');
      return;
    }

    validateResetToken(token)
      .then((valid) => setTokenStatus(valid ? 'valid' : 'invalid'))
      .catch(() => setTokenStatus('invalid'));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (password !== confirmPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 8) {
      setErrorMsg('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setSubmitStatus('loading');

    try {
      await resetPassword(token, password);
      setSubmitStatus('success');
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado.';
      setErrorMsg(message);
      setSubmitStatus('error');
    }
  };

  // ── Validando token ──
  if (tokenStatus === 'checking') {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4 animate-pulse">🔐</div>
          <p className="text-slate-400 text-sm">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // ── Token inválido o expirado ──
  if (tokenStatus === 'invalid') {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-white mb-2">Enlace inválido o expirado</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            Este enlace ya no es válido. Los enlaces de recuperación expiran en 1 hora
            y solo pueden usarse una vez.
          </p>
          <Link href="/forgot-password" className="btn-primary inline-block text-sm">
            Solicitar un nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  // ── Contraseña actualizada con éxito ──
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-xl font-bold text-white mb-2">¡Contraseña actualizada!</h1>
          <p className="text-slate-400 text-sm mb-6">
            Tu contraseña fue cambiada correctamente. Redirigiendo al inicio de sesión...
          </p>
          <Link
            href="/login"
            className="text-primary-400 hover:text-primary-300 text-sm transition-colors"
          >
            Ir a iniciar sesión ahora
          </Link>
        </div>
      </div>
    );
  }

  // ── Formulario nueva contraseña ──
  return (
    <div className="min-h-screen bg-surface-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-white">Crea una nueva contraseña</h1>
          <p className="text-slate-400 text-sm mt-1">Elige una contraseña segura.</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          {errorMsg && (
            <div className="bg-red-950 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm text-slate-400 mb-1.5">
              Nueva contraseña
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

          <div>
            <label htmlFor="confirmPassword" className="block text-sm text-slate-400 mb-1.5">
              Confirmar contraseña
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full bg-surface-900 border border-slate-700 rounded-lg px-3 py-3
                         text-white placeholder-slate-600 focus:outline-none focus:border-primary-500
                         transition-colors text-sm"
              placeholder="Repite la contraseña"
            />
          </div>

          <button
            type="submit"
            disabled={submitStatus === 'loading'}
            className="w-full btn-primary"
          >
            {submitStatus === 'loading' ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Export default — wrapper con Suspense (requerido por useSearchParams) ────

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordSkeleton />}>
      <ResetPasswordInner />
    </Suspense>
  );
}
