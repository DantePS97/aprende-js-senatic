import { describe, it, expect, vi, beforeEach } from 'vitest';
import { cached, invalidatePrefix } from './cache';

// Reset module-level Map state between tests
beforeEach(() => {
  invalidatePrefix('');
});

describe('cached', () => {
  it('calls fetcher on first request', async () => {
    const fetcher = vi.fn().mockResolvedValue('value-a');
    const result = await cached('key-1', 60, fetcher);
    expect(result).toBe('value-a');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('returns cached value on second request within TTL', async () => {
    const fetcher = vi.fn().mockResolvedValue('value-b');
    await cached('key-2', 60, fetcher);
    const result = await cached('key-2', 60, fetcher);
    expect(result).toBe('value-b');
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('re-fetches after TTL expires', async () => {
    vi.useFakeTimers();
    const fetcher = vi.fn().mockResolvedValue('fresh');
    await cached('key-3', 1, fetcher);
    vi.advanceTimersByTime(1100);
    await cached('key-3', 1, fetcher);
    expect(fetcher).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it('deduplicates concurrent requests (stampede prevention)', async () => {
    let resolvePromise!: (v: string) => void;
    const slowFetcher = vi.fn(
      () => new Promise<string>((res) => { resolvePromise = res; }),
    );

    const [p1, p2, p3] = [
      cached('key-4', 60, slowFetcher),
      cached('key-4', 60, slowFetcher),
      cached('key-4', 60, slowFetcher),
    ];

    resolvePromise('deduped');
    const results = await Promise.all([p1, p2, p3]);

    expect(slowFetcher).toHaveBeenCalledTimes(1);
    expect(results).toEqual(['deduped', 'deduped', 'deduped']);
  });

  it('propagates fetcher errors and clears inflight entry', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('db down'));
    await expect(cached('key-5', 60, fetcher)).rejects.toThrow('db down');
    // After error, next call should retry
    fetcher.mockResolvedValue('recovered');
    const result = await cached('key-5', 60, fetcher);
    expect(result).toBe('recovered');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});

describe('invalidatePrefix', () => {
  it('removes all keys with matching prefix', async () => {
    const fetcherA = vi.fn().mockResolvedValue('a');
    const fetcherB = vi.fn().mockResolvedValue('b');
    await cached('ns:one', 60, fetcherA);
    await cached('ns:two', 60, fetcherA);
    await cached('other:key', 60, fetcherB);

    invalidatePrefix('ns:');

    await cached('ns:one', 60, fetcherA);
    await cached('other:key', 60, fetcherB);

    expect(fetcherA).toHaveBeenCalledTimes(3); // initial 2 + 1 re-fetch after invalidation
    expect(fetcherB).toHaveBeenCalledTimes(1); // not invalidated
  });

  it('is a no-op when no keys match', () => {
    expect(() => invalidatePrefix('nonexistent:')).not.toThrow();
  });
});
