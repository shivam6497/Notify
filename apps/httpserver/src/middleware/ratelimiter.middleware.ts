import { createRedisConnection } from "@notify/queue";
import type { Request, Response, NextFunction } from "express";

// ============================================================================
// Token Bucket Rate Limiting Middleware (Redis)
// Implements an asynchronous Token Bucket algorithm stored in Redis hashes.
// Allows burst traffic while enforcing sustained rate limits without drift.
// ============================================================================

const redis = createRedisConnection();

/** Redis TTL (1 hour) to automatically clean up inactive rate limit buckets */
const TTL = 3600;

interface BucketConfig {
  maxTokens: number;   // Maximum burst capacity
  refillRate: number;  // Refill tokens added per second
}

/**
 * Executes token bucket calculation in Redis:
 * 1. Reads current token count and lastRefill timestamp.
 * 2. Calculates elapsed time and adds refill tokens up to maxTokens.
 * 3. Consumes 1 token if available, returning true; otherwise returns false (429).
 */
async function tokenBucketLimiter(
  key: string,
  config: BucketConfig
): Promise<boolean> {
  const bucketKey = `token_bucket:${key}`;
  const now = Date.now() / 1000;
  const { maxTokens, refillRate } = config;

  const data = await redis.hgetall(bucketKey);

  let tokens: number;
  let lastRefill: number;

  if (!data || !data.tokens) {
    tokens = maxTokens;
    lastRefill = now;
  } else {
    tokens = parseFloat(data.tokens);
    lastRefill = parseFloat(data.lastRefill ?? String(now));
    const elapsed = now - lastRefill;
    tokens = Math.min(maxTokens, tokens + elapsed * refillRate);
    lastRefill = now;
  }

  if (tokens < 1) {
    await redis.hset(bucketKey, { tokens, lastRefill });
    await redis.expire(bucketKey, TTL);
    return false;
  }

  tokens -= 1;
  await redis.hset(bucketKey, { tokens, lastRefill });
  await redis.expire(bucketKey, TTL);
  return true;
}

// ─── IP-based Rate Limiter (Authentication Endpoints) ──────
// Strict limit: 10 burst attempts, 2 tokens/sec refill to protect against brute force
const AUTH_CONFIG: BucketConfig = {
  maxTokens: 10,
  refillRate: 2,
};

/**
 * Rate limits requests based on client IP address.
 */
export async function ipRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.socket.remoteAddress ||
    "unknown";

  const allowed = await tokenBucketLimiter(`ip:${ip}`, AUTH_CONFIG);

  if (!allowed) {
    res.status(429).json({
      error: "Too many requests — slow down",
    });
    return;
  }

  next();
}

// ─── Project-based Rate Limiter (API Notifications) ───────
// Generous limit: 100 burst tokens, 10 tokens/sec refill to accommodate legitimate spikes
const NOTIFY_CONFIG: BucketConfig = {
  maxTokens: 100,
  refillRate: 10,
};

/**
 * Rate limits notification dispatches per project ID.
 */
export async function projectRateLimiter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const projectId = req.projectId;

  if (!projectId) {
    next();
    return;
  }

  const allowed = await tokenBucketLimiter(`project:${projectId}`, NOTIFY_CONFIG);

  if (!allowed) {
    res.status(429).json({
      error: "Rate limit exceeded — too many notifications",
    });
    return;
  }

  next();
}