'use client';

import { useEffect } from 'react';

interface UnsavedChangesGuardProps {
  /** Activates the beforeunload warning when true */
  dirty: boolean;
}

/**
 * Renders nothing. While `dirty` is true, attaches a `beforeunload`
 * listener that triggers the browser's native "Leave site?" prompt,
 * preventing accidental loss of unsaved edits.
 *
 * Cleans up automatically on unmount or when dirty becomes false.
 */
export function UnsavedChangesGuard({ dirty }: UnsavedChangesGuardProps) {
  useEffect(() => {
    if (!dirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Required by some browsers to show the prompt
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  return null;
}
