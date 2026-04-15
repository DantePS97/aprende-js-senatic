import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Progress, ProgressStats, Achievement } from '@senatic/shared';
import { api } from '@/lib/api';

interface ProgressState {
  progressMap: Record<string, Progress>; // lessonId → Progress
  stats: ProgressStats | null;
  pendingSync: string[]; // localIds pendientes de sync

  fetchStats: () => Promise<void>;
  fetchMyProgress: () => Promise<void>;
  submitLesson: (
    lessonId: string,
    passed: boolean,
    hintsUsed: number
  ) => Promise<{
    xpEarned: number;
    leveledUp: boolean;
    newLevel?: number;
    newStreak?: number;
    newAchievements: Achievement[];
  }>;
  getLessonStatus: (lessonId: string) => Progress['status'];
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      progressMap: {},
      stats: null,
      pendingSync: [],

      fetchStats: async () => {
        try {
          const { data } = await api.get('/progress/stats');
          set({ stats: data.data });
        } catch {
          // Ignorar si no hay conexión — usamos datos locales
        }
      },

      fetchMyProgress: async () => {
        try {
          const { data } = await api.get('/progress/me');
          const progressArray: Progress[] = data.data;
          const progressMap = Object.fromEntries(
            progressArray.map((p) => [p.lessonId, p])
          );
          set({ progressMap });
        } catch {
          // Offline — mantener estado local
        }
      },

      submitLesson: async (lessonId, passed, hintsUsed) => {
        const completedAt = new Date().toISOString();

        try {
          const { data } = await api.post('/progress', {
            lessonId,
            passed,
            hintsUsed,
            completedAt,
          });

          const { progress, xpEarned, leveledUp, newLevel, newStreak, newAchievements } = data.data;

          set((state) => ({
            progressMap: { ...state.progressMap, [lessonId]: progress },
          }));

          return { xpEarned, leveledUp, newLevel, newStreak, newAchievements: newAchievements ?? [] };
        } catch {
          // Offline: guardar en IndexedDB y encolar para sync
          const { db } = await import('@/lib/db');
          const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;

          await db.syncQueue.add({
            localId,
            lessonId,
            passed,
            hintsUsed,
            completedAt,
            synced: false,
            createdAt: new Date().toISOString(),
          });

          // Actualizar estado local optimistamente
          const localProgress: Progress = {
            _id: localId,
            userId: 'local',
            lessonId,
            status: passed ? 'completed' : 'in_progress',
            xpEarned: 0,
            attempts: 1,
            hintsUsed,
            completedAt: passed ? completedAt : undefined,
          };

          set((state) => ({
            progressMap: { ...state.progressMap, [lessonId]: localProgress },
            pendingSync: [...state.pendingSync, localId],
          }));

          return { xpEarned: 0, leveledUp: false, newAchievements: [], newStreak: undefined };
        }
      },

      getLessonStatus: (lessonId) => {
        return get().progressMap[lessonId]?.status ?? 'not_started';
      },
    }),
    {
      name: 'senatic-progress',
      partialize: (state) => ({
        progressMap: state.progressMap,
        stats: state.stats,
      }),
    }
  )
);
