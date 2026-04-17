'use client';

import { useEffect } from 'react';
import { logRouteError } from '@/lib/logRouteError';
import { ErrorState } from '@/components/feedback/ErrorState';

export default function CourseError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logRouteError(error, { route: 'courses/[courseId]' });
  }, [error]);

  return (
    <ErrorState
      title="Error al cargar el curso"
      description="No pudimos cargar este curso. Intenta de nuevo."
      reset={reset}
      homeHref="/courses"
      digest={error.digest}
    />
  );
}
