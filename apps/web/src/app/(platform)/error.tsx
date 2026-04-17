'use client';

import { useEffect } from 'react';
import { logRouteError } from '@/lib/logRouteError';
import { ErrorState } from '@/components/feedback/ErrorState';

export default function PlatformError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logRouteError(error, { route: '(platform)' });
  }, [error]);

  return (
    <ErrorState
      title="Algo salió mal"
      description="No pudimos cargar esta página. Intenta de nuevo."
      reset={reset}
      homeHref="/courses"
      digest={error.digest}
    />
  );
}
