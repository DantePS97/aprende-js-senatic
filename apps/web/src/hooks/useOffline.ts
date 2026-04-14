'use client';

import { useState, useEffect } from 'react';
import { registerOnlineSync } from '@/lib/sync';

/**
 * Retorna el estado de conexión actual y registra el listener
 * de sync automático al recuperar la conexión.
 */
export function useOffline() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Registrar sync automático
    const unregister = registerOnlineSync();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unregister();
    };
  }, []);

  return { isOnline };
}
