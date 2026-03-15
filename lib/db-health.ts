import { db } from "@/db/client";

import { logger } from "./security/secure-logger";
let lastHealthCheck = 0;
let isHealthy = false;
const HEALTH_CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Check if the database connection is healthy
 * This helps prevent timeout errors by ensuring the database is awake
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  const now = Date.now();

  // If we checked recently and it was healthy, assume it's still healthy
  if (isHealthy && now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
    return true;
  }

  try {
    // Simple query to wake up the database
    await db.execute("SELECT 1");
    isHealthy = true;
    lastHealthCheck = now;
    return true;
  } catch (error) {
    logger.warn("Database health check failed:", { error });
    isHealthy = false;
    return false;
  }
}

/**
 * Ensure database is awake before executing queries
 * Use this wrapper for critical database operations
 */
export async function withDatabaseHealth<T>(
  operation: () => Promise<T>,
  maxRetries = 2,
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Check health before the operation
      if (attempt > 0) {
        logger.info(`Database operation retry ${attempt}/${maxRetries}`);
        await checkDatabaseHealth();
        // Wait a bit for the database to fully wake up
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      return await operation();
    } catch (error) {
      lastError = error as Error;

      // If it's a connection error and we have retries left, continue
      if (
        (error as { code?: string })?.code === "UND_ERR_CONNECT_TIMEOUT" ||
        (error as { message?: string })?.message?.includes("fetch failed") ||
        (error as { message?: string })?.message?.includes("Connect Timeout")
      ) {
        if (attempt < maxRetries) {
          logger.info(
            `Database connection failed, retrying in ${(attempt + 1) * 2} seconds...`,
          );
          await new Promise((resolve) =>
            setTimeout(resolve, (attempt + 1) * 2000),
          );
          continue;
        }
      }

      // If it's not a connection error or we're out of retries, throw
      throw error;
    }
  }

  throw lastError || new Error("Database operation failed after retries");
}
