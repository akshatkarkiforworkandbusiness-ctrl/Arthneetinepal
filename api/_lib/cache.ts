interface CacheEntry<T> {
  data: T;
  ts: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/**
 * Get a cached value or compute it.
 * @param key Cache key
 * @param ttlMs Time-to-live in milliseconds
 * @param compute Async function to produce the value on cache miss
 */
export async function cached<T>(key: string, ttlMs: number, compute: () => Promise<T>): Promise<T> {
  const hit = store.get(key) as CacheEntry<T> | undefined;
  if (hit && Date.now() - hit.ts < ttlMs) return hit.data;

  const data = await compute();
  store.set(key, { data, ts: Date.now() });
  return data;
}

/**
 * Simple TTL cache get/set for external callers.
 */
export function cacheGet<T>(key: string): T | null {
  const hit = store.get(key);
  if (!hit) return null;
  return hit.data as T;
}

export function cacheSet<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, ts: Date.now() });
}

export function cacheHas(key: string, ttlMs: number): boolean {
  const hit = store.get(key);
  return !!hit && Date.now() - hit.ts < ttlMs;
}

/**
 * Evict expired entries (call periodically or on cold start).
 */
export function cacheEvict(ttlMs: number): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.ts > ttlMs) store.delete(key);
  }
}
