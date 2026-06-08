import crypto from "crypto";

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  createdAt: number;
};

// Use global to survive hot reloads in development
const globalForCache = global as unknown as {
  __appCache?: Map<string, CacheEntry<any>>;
};

const cache = globalForCache.__appCache || new Map<string, CacheEntry<any>>();
if (process.env.NODE_ENV !== "production") globalForCache.__appCache = cache;

export function stableHash(input: unknown): string {
  const str = typeof input === "string" ? input : JSON.stringify(input);
  return crypto.createHash("sha256").update(str).digest("hex");
}

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  cache.set(key, {
    value,
    createdAt: Date.now(),
    expiresAt: Date.now() + ttlMs,
  });
}

export async function getOrSetCache<T>(
  key: string,
  producer: () => Promise<T>,
  ttlMs: number,
  prefixForLog: string
): Promise<T> {
  const cached = getCache<T>(key);
  if (cached !== null) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[cache] hit ${prefixForLog}`);
    }
    return cached;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[cache] miss ${prefixForLog}`);
  }

  const value = await producer();
  setCache(key, value, ttlMs);
  return value;
}

export function deleteExpiredCache(): void {
  const now = Date.now();
  for (const [key, entry] of cache.entries()) {
    if (now > entry.expiresAt) {
      cache.delete(key);
    }
  }
}
