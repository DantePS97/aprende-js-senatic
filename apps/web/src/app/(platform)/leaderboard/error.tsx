'use client';

import { useEffect } from 'react';
import { logRouteError } from '@/lib/logRouteError';
import { ErrorState } from '@/components/feedback/ErrorState';

export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logRouteError(error, { route: 'leaderboard' });
  }, [error]);

  return (
    <ErrorState
      title="Error al cargar el ranking"
      description="No pudimos cargar la tabla de posiciones. Intenta de nuevo."
      reset={reset}
      homeHref="/courses"
      digest={error.digest}
    />
  );
}
