import Redis from 'ioredis';

let client: Redis | null = null;

export function initRedis(): void {
  const url = process.env.REDIS_URL;
  if (!url) return;

  client = new Redis(url, {
    // Fail fast: don't queue commands while disconnected
    enableOfflineQueue: false,
    // One retry per command before throwing
    maxRetriesPerRequest: 1,
    connectTimeout: 3_000,
    // Back off up to 10s; give up after 5 consecutive failures
    retryStrategy: (times: number) => (times > 5 ? null : Math.min(times * 500, 10_000)),
  });

  client.on('error', () => {
    // Errors are handled per-call in cache.ts; suppress unhandled-error crash
  });

  client.on('connect', () => {
    console.log('[redis] Connected');
  });
}

export function getRedisClient(): Redis | null {
  return client;
}

export async function closeRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => {});
    client = null;
  }
}
