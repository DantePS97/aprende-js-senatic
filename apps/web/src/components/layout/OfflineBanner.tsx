'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [showReconnected, setShowReconnected] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsOnline(navigator.onLine);

    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!mounted) return null;

  if (!isOnline) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-yellow-950 border-b border-yellow-700
                   flex items-center justify-center gap-2 py-2 px-4 text-yellow-400 text-xs"
        role="alert"
        aria-live="assertive"
      >
        <WifiOff className="w-3.5 h-3.5 shrink-0" />
        <span>Sin conexión — tu progreso se guardará localmente y se sincronizará al reconectarte</span>
      </div>
    );
  }

  if (showReconnected) {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 bg-success-DEFAULT/20 border-b border-success-DEFAULT/40
                   flex items-center justify-center gap-2 py-2 px-4 text-success-400 text-xs"
        role="status"
        aria-live="polite"
      >
        <Wifi className="w-3.5 h-3.5 shrink-0" />
        <span>Conexión restaurada — sincronizando progreso...</span>
      </div>
    );
  }

  return null;
}
