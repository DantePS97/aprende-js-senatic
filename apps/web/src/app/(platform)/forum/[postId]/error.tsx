'use client';

import { useEffect } from 'react';
import { logRouteError } from '@/lib/logRouteError';
import { ErrorState } from '@/components/feedback/ErrorState';

export default function ForumPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logRouteError(error, { route: 'forum/[postId]' });
  }, [error]);

  return (
    <ErrorState
      title="Error al cargar la publicación"
      description="No pudimos mostrar esta publicación. Intenta de nuevo."
      reset={reset}
      homeHref="/forum"
      digest={error.digest}
    />
  );
}
