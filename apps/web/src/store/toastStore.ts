import { create } from 'zustand';
import type { Achievement } from '@senatic/shared';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'warning' | 'xp' | 'achievement';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  achievement?: Achievement;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  showXpGain: (xp: number) => void;
  showAchievement: (achievement: Achievement) => void;
  showLevelUp: (level: number) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

const AUTO_DISMISS_MS = 4000;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    setTimeout(() => get().removeToast(id), AUTO_DISMISS_MS);
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  showXpGain: (xp) => get().addToast({ type: 'xp', message: `+${xp} XP` }),

  showAchievement: (achievement) =>
    get().addToast({ type: 'achievement', message: achievement.title, achievement }),

  showLevelUp: (level) =>
    get().addToast({ type: 'success', message: `¡Subiste al nivel ${level}! 🎉` }),
}));
