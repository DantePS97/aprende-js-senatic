'use client';

import { useEffect } from 'react';
import { registerOnlineSync } from '@/lib/sync';
import { useAuthStore } from '@/store/authStore';

/**
 * Registra el listener de sync automático offline → server.
 * Se monta una vez al entrar a la plataforma y se desmonta al salir.
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    const unregister = registerOnlineSync();
    return unregister;
  }, [isAuthenticated]);

  return <>{children}</>;
}
