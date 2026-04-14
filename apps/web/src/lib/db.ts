import Dexie, { Table } from 'dexie';

// ─── Tipos IndexedDB ──────────────────────────────────────────────────────────

export interface CachedUser {
  id?: number;
  userId: string;
  email: string;
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  updatedAt: string;
}

export interface CachedCourse {
  id: string;
  slug: string;
  title: string;
  description: string;
  level: string;
  iconEmoji: string;
  totalLessons: number;
  cachedAt: string;
}

export interface CachedLesson {
  id: string; // contentId
  moduleId: string;
  title: string;
  xpReward: number;
  content: string; // JSON stringified LessonContent
  cachedAt: string;
}

export interface LocalProgress {
  id?: number;
  userId: string;
  lessonId: string;
  status: string;
  xpEarned: number;
  attempts: number;
  hintsUsed: number;
  completedAt?: string;
  updatedAt: string;
}

export interface SyncQueueItem {
  id?: number;
  localId: string;
  lessonId: string;
  passed: boolean;
  hintsUsed: number;
  completedAt: string;
  synced: boolean;
  createdAt: string;
}

// ─── Dexie DB ─────────────────────────────────────────────────────────────────

class SenaticDB extends Dexie {
  users!: Table<CachedUser>;
  courses!: Table<CachedCourse>;
  lessons!: Table<CachedLesson>;
  progress!: Table<LocalProgress>;
  syncQueue!: Table<SyncQueueItem>;

  constructor() {
    super('SenaticDB');

    this.version(1).stores({
      users: '++id, userId, email',
      courses: 'id, slug, level',
      lessons: 'id, moduleId',
      progress: '++id, [userId+lessonId], userId, status, updatedAt',
      syncQueue: '++id, localId, lessonId, synced, createdAt',
    });
  }
}

export const db = new SenaticDB();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Guarda o actualiza el progreso local de una lección */
export async function upsertLocalProgress(
  userId: string,
  lessonId: string,
  data: Partial<LocalProgress>
): Promise<void> {
  const existing = await db.progress
    .where('[userId+lessonId]')
    .equals([userId, lessonId])
    .first();

  if (existing?.id) {
    await db.progress.update(existing.id, { ...data, updatedAt: new Date().toISOString() });
  } else {
    await db.progress.add({
      userId,
      lessonId,
      status: 'not_started',
      xpEarned: 0,
      attempts: 0,
      hintsUsed: 0,
      updatedAt: new Date().toISOString(),
      ...data,
    });
  }
}

/** Obtiene todos los eventos pendientes de sync */
export async function getPendingSyncEvents(): Promise<SyncQueueItem[]> {
  return db.syncQueue.where('synced').equals(0).toArray();
}

/** Marca eventos como sincronizados por sus localIds */
export async function markSynced(localIds: string[]): Promise<void> {
  await db.syncQueue.where('localId').anyOf(localIds).modify({ synced: true });
}

/** Cachea el contenido de una lección para uso offline */
export async function cacheLessonContent(
  lessonId: string,
  moduleId: string,
  title: string,
  xpReward: number,
  content: object
): Promise<void> {
  await db.lessons.put({
    id: lessonId,
    moduleId,
    title,
    xpReward,
    content: JSON.stringify(content),
    cachedAt: new Date().toISOString(),
  });
}
