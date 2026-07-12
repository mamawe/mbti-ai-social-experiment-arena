/**
 * Session Store — async get/set wrapper.
 * Uses Upstash Redis (Vercel Marketplace integration) when env vars are present,
 * falls back to in-memory Map for local dev / Render / non-Vercel platforms.
 *
 * On Vercel: install the Upstash Redis integration from Vercel Marketplace.
 * It auto-sets UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 * Free tier: 256MB, 10k commands/day — plenty for a turn-based game.
 */
import type { GameSession } from "./types";

// --- In-memory fallback (always works) ---
const memory = new Map<string, GameSession>();

// --- Upstash Redis (lazy-loaded, only when env vars present) ---
let redisReady = false;
let redisClient: Awaited<ReturnType<typeof import("@upstash/redis").Redis.fromEnv>> | null = null;

function hasRedisEnv(): boolean {
  return !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

async function ensureRedis() {
  if (redisReady) return redisClient;
  if (hasRedisEnv()) {
    const { Redis } = await import("@upstash/redis");
    redisClient = Redis.fromEnv();
  }
  redisReady = true;
  return redisClient;
}

const PREFIX = "session:";

export async function getSession(id: string): Promise<GameSession | undefined> {
  const redis = await ensureRedis();
  if (redis) {
    try {
      const raw = await redis.get<string>(PREFIX + id);
      if (raw) return JSON.parse(raw) as GameSession;
      return undefined;
    } catch {
      // Redis read failed — fall back to memory
      return memory.get(id);
    }
  }
  return memory.get(id);
}

export async function setSession(id: string, session: GameSession): Promise<void> {
  const redis = await ensureRedis();
  if (redis) {
    try {
      await redis.set(PREFIX + id, JSON.stringify(session));
    } catch {
      // Redis write failed — fall back to memory
    }
  }
  // Always keep a memory copy so local fallback works even when KV is primary
  memory.set(id, session);
}

export async function delSession(id: string): Promise<void> {
  const redis = await ensureRedis();
  if (redis) {
    try {
      await redis.del(PREFIX + id);
    } catch {
      // ignore
    }
  }
  memory.delete(id);
}
