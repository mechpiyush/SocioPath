type CacheEntry<T> = {
  value: T;
  expiry: number;
};

const cacheStore = new Map<string, CacheEntry<any>>();

export const memoryCache = {
  get<T>(key: string): T | null {
    const entry = cacheStore.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      cacheStore.delete(key);
      return null;
    }
    return entry.value;
  },
  set<T>(key: string, value: T, ttlMs: number): void {
    cacheStore.set(key, {
      value,
      expiry: Date.now() + ttlMs,
    });
  },
  delete(key: string): void {
    cacheStore.delete(key);
  },
  clear(): void {
    cacheStore.clear();
  }
};
