'use client';

import { usePushStore } from '@/store/pushStore';
import { usePushSubscription } from '@/hooks/usePushSubscription';

interface Props {
  ignoreSuppressionWindow?: boolean;
  userLevel?: number;
  achievementsCount?: number;
}

export function PushOptInBanner({
  ignoreSuppressionWindow = false,
  userLevel = 0,
  achievementsCount = 0,
}: Props) {
  const status = usePushStore((s) => s.status);
  const { subscribe, isLoading } = usePushSubscription();

  if (typeof window === 'undefined') return null;
  if (status !== 'default') return null;

  // Suppression window check
  if (!ignoreSuppressionWindow) {
    const until = localStorage.getItem('push_banner_suppressed_until');
    if (until && Date.now() < Number(until)) return null;
  }

  // Eligibility check — show only to engaged users
  const eligible = userLevel > 1 || achievementsCount >= 3;
  if (!eligible) return null;

  const handleDismiss = () => {
    localStorage.setItem(
      'push_banner_suppressed_until',
      String(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-lg p-4 z-50">
      <p className="text-sm font-semibold text-white mb-1">
        Recibe notificaciones
      </p>
      <p className="text-xs text-slate-400 mb-3">
        Entérate de logros, nuevos niveles y cuando tu racha esté en riesgo.
      </p>
      <div className="flex gap-2">
        <button
          onClick={subscribe}
          disabled={isLoading}
          className="flex-1 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium py-2 px-3 rounded-lg disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Activando...' : 'Activar notificaciones'}
        </button>
        <button
          onClick={handleDismiss}
          className="text-xs text-slate-400 hover:text-slate-200 py-2 px-3 transition-colors"
        >
          Más tarde
        </button>
      </div>
    </div>
  );
}
