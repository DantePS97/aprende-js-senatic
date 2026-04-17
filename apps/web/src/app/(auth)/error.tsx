'use client';

import { useEffect } from 'react';
import { logRouteError } from '@/lib/logRouteError';
import { ErrorState } from '@/components/feedback/ErrorState';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logRouteError(error, { route: '(auth)' });
  }, [error]);

  return (
    <ErrorState
      title="Error de autenticación"
      description="No pudimos procesar tu solicitud. Intenta de nuevo."
      reset={reset}
      homeHref="/login"
      digest={error.digest}
    />
  );
}
