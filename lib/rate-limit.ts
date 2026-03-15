/**
 * Rate Limiting System
 *
 * SECURITY: Prevents abuse and protects against:
 * - Brute force attacks
 * - API abuse
 * - Resource exhaustion
 * - Financial fraud (rapid transactions)
 *
 * PRODUCTION: Should use Redis or similar for distributed rate limiting
 * Current implementation uses in-memory store (single instance only)
 */

import { logger } from "./security/secure-logger";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store (replace with Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS = {
  // Authentication endpoints
  login: { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
  register: { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 registrations per hour

  // Payment endpoints
  paymentInitialize: { windowMs: 60 * 1000, maxRequests: 10 }, // 10 per minute
  paymentVerify: { windowMs: 60 * 1000, maxRequests: 20 }, // 20 per minute

  // NIN verification
  ninVerify: { windowMs: 60 * 1000, maxRequests: 5 }, // 5 per minute (expensive operation)

  // Wallet operations
  walletBalance: { windowMs: 60 * 1000, maxRequests: 30 }, // 30 per minute

  // General API
  api: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 per minute
} as const;

/**
 * Check if request is within rate limit
 *
 * @param identifier - Unique identifier (userId, IP address, etc.)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
} {
  const now = Date.now();
  const key = identifier;

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    // 1% chance
    cleanupExpiredEntries();
  }

  let entry = rateLimitStore.get(key);

  // Create new entry if doesn't exist or expired
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  const allowed = entry.count <= config.maxRequests;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const retryAfter = allowed
    ? undefined
    : Math.ceil((entry.resetAt - now) / 1000);

  return {
    allowed,
    remaining,
    resetAt: entry.resetAt,
    retryAfter,
  };
}

/**
 * Clean up expired rate limit entries
 */
function cleanupExpiredEntries(): void {
  const now = Date.now();
  let cleaned = 0;

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
      cleaned++;
    }
  }

  if (cleaned > 0) {
    logger.info(`[RATE_LIMIT] Cleaned up ${cleaned} expired entries`);
  }
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual intervention
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
  logger.info(`[RATE_LIMIT] Reset rate limit for: ${identifier}`);
}

/**
 * Get current rate limit status without incrementing
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig,
): {
  count: number;
  remaining: number;
  resetAt: number;
} {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry || now > entry.resetAt) {
    return {
      count: 0,
      remaining: config.maxRequests,
      resetAt: now + config.windowMs,
    };
  }

  return {
    count: entry.count,
    remaining: Math.max(0, config.maxRequests - entry.count),
    resetAt: entry.resetAt,
  };
}

/**
 * Middleware helper for rate limiting
 * Returns response if rate limit exceeded, null otherwise
 */
export function rateLimitMiddleware(
  identifier: string,
  config: RateLimitConfig,
  endpoint: string,
): { status: number; message: string; retryAfter: number } | null {
  const result = checkRateLimit(identifier, config);

  if (!result.allowed) {
    logger.warn(`[RATE_LIMIT] Limit exceeded for ${identifier} on ${endpoint}`);
    logger.warn(`[RATE_LIMIT] Retry after ${result.retryAfter} seconds`);

    return {
      status: 429,
      message: "Too many requests. Please try again later.",
      retryAfter: result.retryAfter || 60,
    };
  }

  return null;
}

/**
 * Production TODO:
 *
 * Replace in-memory store with Redis:
 *
 * import Redis from 'ioredis';
 * const redis = new Redis(process.env.REDIS_URL);
 *
 * export async function checkRateLimit(identifier: string, config: RateLimitConfig) {
 *   const key = `ratelimit:${identifier}`;
 *   const current = await redis.incr(key);
 *
 *   if (current === 1) {
 *     await redis.expire(key, Math.ceil(config.windowMs / 1000));
 *   }
 *
 *   const ttl = await redis.ttl(key);
 *   const allowed = current <= config.maxRequests;
 *
 *   return {
 *     allowed,
 *     remaining: Math.max(0, config.maxRequests - current),
 *     resetAt: Date.now() + (ttl * 1000),
 *     retryAfter: allowed ? undefined : ttl
 *   };
 * }
 */
