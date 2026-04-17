'use client';

import { useEffect } from 'react';
import { CheckCircle, AlertCircle, AlertTriangle, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import type { Toast as ToastItem } from '@/store/toastStore';

// ─── Single toast ─────────────────────────────────────────────────────────────

const STYLES = {
  success: {
    container: 'bg-green-50 border-green-300 text-green-800',
    border: 'border-l-4 border-l-green-500',
    Icon: CheckCircle,
  },
  error: {
    container: 'bg-red-50 border-red-300 text-red-800',
    border: 'border-l-4 border-l-red-500',
    Icon: AlertCircle,
  },
  warning: {
    container: 'bg-amber-50 border-amber-300 text-amber-800',
    border: 'border-l-4 border-l-amber-500',
    Icon: AlertTriangle,
  },
} as const;

const AUTO_DISMISS_MS = 4000;

function ToastItem({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const style = STYLES[toast.type];

  useEffect(() => {
    const timer = setTimeout(onClose, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg text-sm max-w-sm w-full
                  ${style.container} ${style.border}`}
    >
      <style.Icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
      <span className="flex-1 leading-snug">{toast.message}</span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar notificación"
        className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Toast stack ──────────────────────────────────────────────────────────────

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-label="Notificaciones"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end"
    >
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
}
