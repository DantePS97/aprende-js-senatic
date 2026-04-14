import { create } from 'zustand';
import type { Achievement } from '@senatic/shared';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'xp' | 'achievement';
  message: string;
  achievement?: Achievement;
}

interface UiState {
  toasts: Toast[];
  isSidebarOpen: boolean;

  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  showXpGain: (xp: number) => void;
  showAchievement: (achievement: Achievement) => void;
  showLevelUp: (level: number) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  isSidebarOpen: false,

  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));

    // Auto-dismiss después de 4 segundos
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 4000);
  },

  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },

  showXpGain: (xp) => {
    const { addToast } = useUiStore.getState();
    addToast({ type: 'xp', message: `+${xp} XP` });
  },

  showAchievement: (achievement) => {
    const { addToast } = useUiStore.getState();
    addToast({ type: 'achievement', message: achievement.title, achievement });
  },

  showLevelUp: (level) => {
    const { addToast } = useUiStore.getState();
    addToast({ type: 'success', message: `¡Subiste al nivel ${level}! 🎉` });
  },

  toggleSidebar: () => {
    set((state) => ({ isSidebarOpen: !state.isSidebarOpen }));
  },
}));
