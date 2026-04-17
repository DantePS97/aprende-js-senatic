'use client';

import { useEffect } from 'react';
import { logRouteError } from '@/lib/logRouteError';
import { ErrorState } from '@/components/feedback/ErrorState';

export default function LessonError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logRouteError(error, { route: 'lessons/[lessonId]' });
  }, [error]);

  return (
    <ErrorState
      title="Error al cargar la lección"
      description="No pudimos cargar esta lección. Intenta de nuevo."
      reset={reset}
      homeHref="/courses"
      digest={error.digest}
    />
  );
}
