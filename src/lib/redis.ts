/**
 * redis.ts — Redis client singleton with in-memory fallback
 *
 * PRODUCTION: Set REDIS_URL=redis://... (Redis Cloud free tier or Upstash)
 * LOCAL DEV:  Falls back to an in-memory Map (no Redis required locally)
 *
 * Used for:
 *   - Seat holding during checkout (10-minute TTL)
 *   - Event data caching (5-minute TTL)
 */

interface RedisLike {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, exArg?: string, ttlArg?: number): Promise<unknown>;
  del(key: string): Promise<unknown>;
  keys(pattern: string): Promise<string[]>;
  incr(key: string): Promise<number>;
  expire(key: string, ttl: number): Promise<unknown>;
}

// ── In-memory fallback ─────────────────────────────────────────────────────
class MemoryRedis implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, exArg?: string, ttlArg?: number): Promise<void> {
    const expiresAt =
      exArg === 'EX' && ttlArg ? Date.now() + ttlArg * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const prefix = pattern.replace('*', '');
    return [...this.store.keys()].filter(k => k.startsWith(prefix));
  }

  async incr(key: string): Promise<number> {
    const current = parseInt((await this.get(key)) || '0', 10);
    const next = current + 1;
    await this.set(key, String(next));
    return next;
  }

  async expire(key: string, ttl: number): Promise<void> {
    const entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttl * 1000;
    }
  }
}

// ── Singleton ──────────────────────────────────────────────────────────────
let redisClient: RedisLike;

function getRedisClient(): RedisLike {
  if (redisClient) return redisClient;

  const redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const Redis = require('ioredis');
      const client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: false,
        lazyConnect: true,
      });
      client.on('error', (err: Error) => {
        console.warn('[Redis] Connection error, falling back to memory:', err.message);
        redisClient = new MemoryRedis();
      });
      redisClient = client;
      console.log('[Redis] Connected to Redis Cloud');
    } catch {
      console.warn('[Redis] ioredis not available, using in-memory fallback');
      redisClient = new MemoryRedis();
    }
  } else {
    console.log('[Redis] No REDIS_URL set, using in-memory fallback (local dev)');
    redisClient = new MemoryRedis();
  }

  return redisClient;
}

export const redis = getRedisClient();

// ── Seat Hold Helpers ──────────────────────────────────────────────────────
const SEAT_HOLD_TTL = 600; // 10 minutes in seconds

export function seatHoldKey(eventId: string, userId: string): string {
  return `seat_hold:${eventId}:${userId}`;
}

export async function holdSeat(eventId: string, userId: string): Promise<boolean> {
  const key = seatHoldKey(eventId, userId);
  await redis.set(key, '1', 'EX', SEAT_HOLD_TTL);
  return true;
}

export async function releaseSeat(eventId: string, userId: string): Promise<void> {
  const key = seatHoldKey(eventId, userId);
  await redis.del(key);
}

export async function getActiveHoldCount(eventId: string): Promise<number> {
  const keys = await redis.keys(`seat_hold:${eventId}:*`);
  return keys.length;
}

// ── Cache Helpers ──────────────────────────────────────────────────────────
export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const val = await redis.get(key);
    if (!val) return null;
    return JSON.parse(val) as T;
  } catch {
    return null;
  }
}

export async function cacheSet<T>(key: string, data: T, ttlSeconds = 300): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
  } catch {
    // non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    // non-fatal
  }
}
