'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Zap } from 'lucide-react';
import { useUiStore } from '@/store/uiStore';

export function ToastContainer() {
  const { toasts, removeToast } = useUiStore();

  return (
    <div
      className="fixed bottom-20 right-4 z-50 space-y-2 pointer-events-none"
      aria-live="polite"
      aria-label="Notificaciones"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastItem {
  id: string;
  type: 'success' | 'error' | 'xp' | 'achievement';
  message: string;
  achievement?: { iconEmoji: string; title: string; description: string };
}

function Toast({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  const isAchievement = toast.type === 'achievement';
  const isXp = toast.type === 'xp';

  return (
    <motion.div
      initial={{ opacity: 0, x: 60, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`pointer-events-auto max-w-xs w-72 rounded-xl shadow-xl border p-3 flex items-start gap-3 ${
        isAchievement
          ? 'bg-primary-500/20 border-primary-500/40'
          : isXp
          ? 'bg-xp-DEFAULT/20 border-xp-DEFAULT/40'
          : toast.type === 'success'
          ? 'bg-success-DEFAULT/20 border-success-DEFAULT/40'
          : 'bg-red-900/20 border-red-700/40'
      }`}
      role="status"
    >
      {/* Icono */}
      <div className="text-2xl shrink-0 mt-0.5">
        {isAchievement && toast.achievement
          ? toast.achievement.iconEmoji
          : isXp
          ? '⚡'
          : toast.type === 'success'
          ? '✅'
          : '❌'}
      </div>

      {/* Contenido */}
      <div className="flex-1 min-w-0">
        {isAchievement && (
          <p className="text-xs text-primary-400 font-semibold uppercase tracking-wide mb-0.5">
            ¡Nuevo logro!
          </p>
        )}
        <p className="font-semibold text-white text-sm truncate">{toast.message}</p>
        {isAchievement && toast.achievement && (
          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
            {toast.achievement.description}
          </p>
        )}
      </div>

      {/* Cerrar */}
      <button
        onClick={onClose}
        className="text-slate-500 hover:text-white transition-colors shrink-0 mt-0.5"
        aria-label="Cerrar notificación"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}
