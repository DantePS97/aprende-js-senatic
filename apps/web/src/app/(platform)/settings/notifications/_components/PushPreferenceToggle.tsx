'use client';

import { usePushStore } from '@/store/pushStore';
import type { PushEventType } from '@senatic/shared';

interface Props {
  type: PushEventType;
  label: string;
  description: string;
}

const TYPE_TO_KEY: Record<PushEventType, 'achievements' | 'levelUp' | 'streakReminder'> = {
  achievement_unlocked: 'achievements',
  level_up: 'levelUp',
  streak_reminder: 'streakReminder',
};

export function PushPreferenceToggle({ type, label, description }: Props) {
  const status = usePushStore((s) => s.status);
  const preferences = usePushStore((s) => s.preferences);
  const setPreferences = usePushStore((s) => s.setPreferences);

  const typeKey = TYPE_TO_KEY[type];
  const enabled = preferences?.[typeKey] ?? false;
  const disabled = status !== 'subscribed';

  const handleToggle = async () => {
    if (disabled) return;
    const newValue = !enabled;
    const res = await fetch('/api/push/preferences', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [typeKey]: newValue }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPreferences(updated);
    }
  };

  return (
    <div className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <button
        onClick={handleToggle}
        disabled={disabled}
        aria-label={disabled ? 'Notificaciones desactivadas' : label}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-40 ${
          enabled ? 'bg-primary-600' : 'bg-slate-700'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  );
}
