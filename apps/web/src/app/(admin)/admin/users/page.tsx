'use client';

import { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle, UserCheck, UserX } from 'lucide-react';
import { adminApi } from '@/lib/admin-api';
import { AdminBreadcrumbs } from '@/components/admin/AdminBreadcrumbs';

// ─── Types ────────────────────────────────────────────────────────────────────

type ResultState =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UsersPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResultState>(null);

  const resolveError = (err: unknown, defaultMsg: string): string => {
    const apiErr = err as { code?: string; details?: { error?: string } };
    if (apiErr.code === 'LAST_ADMIN') {
      return 'No puedes degradar al único administrador de la plataforma.';
    }
    if (apiErr.code === 'NOT_FOUND' || apiErr.details?.error?.includes('not found')) {
      return `Usuario "${email}" no encontrado.`;
    }
    return defaultMsg;
  };

  const handleAction = async (action: 'promote' | 'demote') => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;

    setLoading(true);
    setResult(null);

    try {
      if (action === 'promote') {
        await adminApi.users.promote(trimmed);
        setResult({
          type: 'success',
          message: `✅ ${trimmed} ahora es administrador.`,
        });
      } else {
        await adminApi.users.demote(trimmed);
        setResult({
          type: 'success',
          message: `✅ ${trimmed} ya no tiene permisos de administrador.`,
        });
      }
      setEmail('');
    } catch (err: unknown) {
      const message = resolveError(
        err,
        action === 'promote'
          ? 'No se pudo promover al usuario. Verifica el correo e intenta de nuevo.'
          : 'No se pudo degradar al usuario. Verifica el correo e intenta de nuevo.'
      );
      setResult({ type: 'error', message });
    } finally {
      setLoading(false);
    }
  };

  const isValid = email.trim().length > 0;

  return (
    <div className="space-y-6 max-w-xl">
      <AdminBreadcrumbs items={[{ label: 'Usuarios' }]} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Promueve o degrada administradores de la plataforma.
        </p>
      </div>

      {/* Form card */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Correo electrónico del usuario
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setResult(null); }}
            placeholder="usuario@ejemplo.com"
            disabled={loading}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                       disabled:bg-gray-50 disabled:text-gray-400"
          />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleAction('promote')}
            disabled={!isValid || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600
                       rounded-lg hover:bg-indigo-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
            Promover a Admin
          </button>

          <button
            type="button"
            onClick={() => handleAction('demote')}
            disabled={!isValid || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700
                       bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserX className="w-4 h-4" />
            )}
            Quitar Admin
          </button>
        </div>
      </div>

      {/* Result */}
      {result && (
        <div
          className={`flex items-start gap-3 p-4 rounded-xl border text-sm
            ${result.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : 'bg-red-50 border-red-200 text-red-700'
            }`}
        >
          {result.type === 'success' ? (
            <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{result.message}</span>
        </div>
      )}

      {/* Info callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
        <strong>Nota:</strong> No puedes degradar al último administrador activo de la plataforma.
        Asegúrate de que exista al menos un administrador en todo momento.
      </div>
    </div>
  );
}
