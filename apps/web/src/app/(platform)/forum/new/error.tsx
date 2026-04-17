'use client';

import { useEffect } from 'react';
import { logRouteError } from '@/lib/logRouteError';
import { ErrorState } from '@/components/feedback/ErrorState';

export default function ForumNewError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logRouteError(error, { route: 'forum/new' });
  }, [error]);

  return (
    <ErrorState
      title="Error al cargar el formulario"
      description="No pudimos cargar el formulario. Intenta de nuevo."
      reset={reset}
      homeHref="/forum"
      digest={error.digest}
    />
  );
}
