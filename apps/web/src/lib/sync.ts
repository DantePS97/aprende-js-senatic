'use client';

import { api } from './api';
import { db, getPendingSyncEvents, markSynced } from './db';
import { useAuthStore } from '@/store/authStore';
import { useProgressStore } from '@/store/progressStore';
import type { SyncResponse } from '@senatic/shared';

let isSyncing = false;

/**
 * Sincroniza la cola de progreso offline con el servidor.
 * Se llama automáticamente al detectar conexión.
 * Es idempotente: si ya está corriendo, no hace nada.
 */
export async function syncOfflineProgress(): Promise<void> {
  if (isSyncing) return;
  isSyncing = true;

  try {
    const pending = await getPendingSyncEvents();
    if (pending.length === 0) return;

    const events = pending.map((item) => ({
      lessonId: item.lessonId,
      passed: item.passed,
      hintsUsed: item.hintsUsed,
      completedAt: item.completedAt,
      localId: item.localId,
    }));

    const { data } = await api.post<{ success: true; data: SyncResponse }>('/sync', { events });
    const result = data.data;

    // Marcar como sincronizados en IndexedDB
    await markSynced(result.acknowledged);

    // Actualizar el progressStore con el estado canónico del servidor
    const { fetchMyProgress, fetchStats } = useProgressStore.getState();
    await Promise.all([fetchMyProgress(), fetchStats()]);

    // Actualizar XP del usuario en el store
    const { updateUser } = useAuthStore.getState();
    updateUser({ xp: result.xpTotal, level: result.level });

    // Mostrar nuevos logros si hay
    if (result.newAchievements.length > 0) {
      const { showAchievement } = await import('@/store/uiStore').then((m) => m.useUiStore.getState());
      for (const achievement of result.newAchievements) {
        showAchievement(achievement);
      }
    }

    console.log(`[sync] Sincronizados ${result.acknowledged.length} eventos`);
  } catch (err) {
    console.warn('[sync] Error al sincronizar:', err);
  } finally {
    isSyncing = false;
  }
}

/**
 * Hook que activa la sync automáticamente al recuperar la conexión.
 * Llama este hook una vez en el layout de la plataforma.
 */
export function registerOnlineSync(): () => void {
  const handleOnline = () => {
    syncOfflineProgress();
  };

  window.addEventListener('online', handleOnline);

  // Intentar sync inmediatamente si ya hay conexión al montar
  if (navigator.onLine) {
    syncOfflineProgress();
  }

  return () => window.removeEventListener('online', handleOnline);
}
