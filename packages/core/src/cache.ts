// In-memory cache with TTL
// Postgres caching will be added when DB layer is implemented

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class MemoryCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttlMs: number;

  constructor(ttlMs: number = 24 * 60 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  get(key: string, now: Date = new Date()): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (now.getTime() >= entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key: string, value: T, now: Date = new Date()): void {
    this.cache.set(key, {
      value,
      expiresAt: now.getTime() + this.ttlMs,
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}
