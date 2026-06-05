import type { PushEventType } from '@senatic/shared';

// ─── Push Notification Deduplication ─────────────────────────────────────────

const debounceMap = new Map<string, number>();
const WINDOW_MS = 60_000;

export const pushDedup = {
  shouldSkip(userId: string, type: PushEventType): boolean {
    const key = `${userId}:${type}`;
    const last = debounceMap.get(key);
    if (last === undefined) return false;
    return Date.now() - last < WINDOW_MS;
  },

  mark(userId: string, type: PushEventType): void {
    const key = `${userId}:${type}`;
    debounceMap.set(key, Date.now());
    if (debounceMap.size > 10_000) {
      const cutoff = Date.now() - WINDOW_MS * 2;
      for (const [k, v] of debounceMap) {
        if (v < cutoff) debounceMap.delete(k);
      }
    }
  },
};
