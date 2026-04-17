import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: Toast['type'], message: string) => void;
  removeToast: (id: string) => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }));
  },

  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
