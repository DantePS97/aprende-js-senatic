'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { logRouteError } from '@/lib/logRouteError';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logRouteError(error, { level: 'global' });
  }, [error]);

  return (
    <html lang="es" className="dark">
      <body
        style={{ background: '#030712' }}
        className="font-sans flex flex-col items-center justify-center min-h-screen text-white gap-4"
      >
        <AlertTriangle className="w-12 h-12 text-red-400" />
        <h1 className="text-lg font-bold">Algo salió mal</h1>
        <p className="text-sm text-slate-400">
          Ocurrió un error inesperado. Intenta recargar la página.
        </p>
        {error.digest && (
          <p className="text-xs text-slate-600 font-mono">ID: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors"
        >
          Reintentar
        </button>
      </body>
    </html>
  );
}
