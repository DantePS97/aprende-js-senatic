export function logRouteError(
  error: Error & { digest?: string },
  context?: Record<string, unknown>,
): void {
  try {
    console.error('[route-error]', {
      message: error.message,
      digest: error.digest,
      ...context,
    });
  } catch {
    // never throws
  }
}
