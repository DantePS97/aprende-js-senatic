import { getRedisClient } from './redis';

const MAX_ENTRIES = 100;

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

function evictOldest(): void {
  let oldestKey = '';
  let oldestExpiry = Infinity;
  for (const [key, entry] of store.entries()) {
    if (entry.expiresAt < oldestExpiry) {
      oldestExpiry = entry.expiresAt;
      oldestKey = key;
    }
  }
  if (oldestKey) store.delete(oldestKey);
}

/**
 * Two-level cache: L1 in-memory (per-process) → L2 Redis (shared across instances).
 * Falls back to L1-only when REDIS_URL is not set or Redis is unreachable.
 *
 * Inflight deduplication is applied before both L2 and the fetcher, so a single
 * async fetch serves all concurrent callers for the same key within one process.
 */
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  // ─── L1: in-memory hit ────────────────────────────────────────────────────
  const now = Date.now();
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && hit.expiresAt > now) return hit.value;

  // ─── Inflight dedup ───────────────────────────────────────────────────────
  // Register the promise BEFORE any await so concurrent calls share it,
  // preventing duplicate Redis reads and duplicate fetcher calls.
  const pending = inflight.get(key) as Promise<T> | undefined;
  if (pending) return pending;

  const promise = (async (): Promise<T> => {
    const redis = getRedisClient();

    // ─── L2: Redis hit ─────────────────────────────────────────────────────
    if (redis) {
      try {
        const raw = await redis.get(key);
        if (raw) {
          const value = JSON.parse(raw) as T;
          if (store.size >= MAX_ENTRIES) evictOldest();
          store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
          return value;
        }
      } catch {
        // Redis unavailable — continue to fetcher
      }
    }

    // ─── Miss: fetch from source ────────────────────────────────────────────
    const value = await fetcher();
    if (store.size >= MAX_ENTRIES) evictOldest();
    store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });

    if (redis) {
      redis.setex(key, ttlSeconds, JSON.stringify(value)).catch(() => {});
    }

    return value;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise as Promise<unknown>);
  return promise;
}

/**
 * Invalidate all cache entries whose key starts with `prefix`.
 * In-memory invalidation is synchronous. Redis invalidation runs asynchronously
 * (fire-and-forget) so callers do not need to await this function.
 */
export function invalidatePrefix(prefix: string): void {
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }

  const redis = getRedisClient();
  if (redis) {
    scanAndDelete(redis, `${prefix}*`).catch(() => {});
  }
}

async function scanAndDelete(redis: NonNullable<ReturnType<typeof getRedisClient>>, pattern: string): Promise<void> {
  let cursor = '0';
  do {
    const [next, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
    cursor = next;
    if (keys.length) await redis.del(keys);
  } while (cursor !== '0');
}
