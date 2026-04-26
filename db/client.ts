import "server-only";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import * as newSchema from "./new-schema";
import {
  getDatabaseConfig,
  sanitizeConnectionString,
  DatabaseConfigError,
} from "./config";
import { getProviderOptimizations } from "./provider-adapter";

/**
 * Database Client Module
 *
 * Provides PostgreSQL connection pool and Drizzle ORM instance.
 * Optimized for serverless environments with proper connection pooling.
 * Compatible with Next.js 15 and all PostgreSQL providers.
 */

// Custom error classes
export class DatabaseConnectionError extends Error {
  constructor(
    message: string,
    public readonly cause: Error,
    public readonly retryable: boolean = true,
  ) {
    super(message);
    this.name = "DatabaseConnectionError";
  }
}

export class DatabaseQueryError extends Error {
  constructor(
    message: string,
    public readonly query: string,
    public readonly cause: Error,
  ) {
    super(message);
    this.name = "DatabaseQueryError";
  }
}

export class PoolExhaustedError extends Error {
  constructor(
    public readonly poolSize: number,
    public readonly waitingCount: number,
  ) {
    super(
      `Connection pool exhausted: ${poolSize} connections in use, ${waitingCount} requests waiting`,
    );
    this.name = "PoolExhaustedError";
  }
}

// Pool metrics interface
export interface PoolMetrics {
  total: number;
  active: number;
  idle: number;
  waiting: number;
}

// Health status interface
export interface HealthStatus {
  healthy: boolean;
  latencyMs: number;
  pool: PoolMetrics;
  error?: string;
}

// Singleton connection pool
let pool: Pool | null = null;
let isShuttingDown = false;

/**
 * Get or create the connection pool
 */
function getPool(): Pool {
  if (isShuttingDown) {
    throw new Error("Database is shutting down, cannot create new connections");
  }

  if (pool) {
    return pool;
  }

  try {
    // Get configuration
    const config = getDatabaseConfig();

    // Get provider-specific optimizations
    const optimizations = getProviderOptimizations(
      config.provider,
      config.connectionString,
      config.ssl,
    );

    // Apply pool overrides from provider optimizations
    const poolConfig = {
      ...config.pool,
      ...optimizations.poolOverrides,
    };

    // Configure SSL based on provider and mode
    let sslConfig: boolean | { rejectUnauthorized: boolean; ca?: string } =
      false;

    if (optimizations.ssl.mode === "require") {
      sslConfig = {
        rejectUnauthorized: optimizations.ssl.rejectUnauthorized ?? true,
        ca: optimizations.ssl.ca || config.ssl.ca,
      };
    } else if (optimizations.ssl.mode === "prefer") {
      sslConfig = {
        rejectUnauthorized: false,
      };
    }

    // Create pool
    pool = new Pool({
      connectionString: optimizations.connectionString,
      min: poolConfig.min,
      max: poolConfig.max,
      idleTimeoutMillis: poolConfig.idleTimeoutMillis,
      connectionTimeoutMillis: poolConfig.connectionTimeoutMillis,
      allowExitOnIdle: poolConfig.allowExitOnIdle,
      ssl: sslConfig,
      // Set statement timeout if provided by provider
      ...(optimizations.statementTimeout && {
        statement_timeout: optimizations.statementTimeout,
      }),
    });

    // Log pool creation (without sensitive data)
    console.log("[DB] Connection pool created", {
      provider: config.provider,
      poolConfig: {
        min: poolConfig.min,
        max: poolConfig.max,
        idleTimeoutMillis: poolConfig.idleTimeoutMillis,
      },
      ssl: optimizations.ssl.mode,
      connectionString: sanitizeConnectionString(config.connectionString),
    });

    // Handle pool errors
    pool.on("error", (err) => {
      console.error("[DB] Unexpected pool error:", err);
    });

    // Monitor pool health
    pool.on("connect", () => {
      monitorPoolHealth();
    });

    return pool;
  } catch (error) {
    if (error instanceof DatabaseConfigError) {
      throw error;
    }
    throw new DatabaseConnectionError(
      "Failed to create database connection pool",
      error as Error,
    );
  }
}

/**
 * Monitor pool health and emit warnings
 */
function monitorPoolHealth(): void {
  if (!pool) return;

  const metrics = getPoolMetrics();

  // Warn if waiting queue is building up
  if (metrics.waiting > 5) {
    console.warn("[DB] High connection wait queue:", metrics);
  }

  // Warn if pool is near capacity
  if (metrics.total > 0 && metrics.active >= metrics.total * 0.9) {
    console.warn("[DB] Connection pool near capacity:", metrics);
  }
}

/**
 * Get connection pool metrics
 */
export function getPoolMetrics(): PoolMetrics {
  if (!pool) {
    return { total: 0, active: 0, idle: 0, waiting: 0 };
  }

  return {
    total: pool.totalCount,
    active: pool.totalCount - pool.idleCount,
    idle: pool.idleCount,
    waiting: pool.waitingCount,
  };
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<HealthStatus> {
  const start = Date.now();

  try {
    const currentPool = getPool();
    await currentPool.query("SELECT 1");

    return {
      healthy: true,
      latencyMs: Date.now() - start,
      pool: getPoolMetrics(),
    };
  } catch (error) {
    return {
      healthy: false,
      latencyMs: Date.now() - start,
      pool: getPoolMetrics(),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Close database connections gracefully
 */
export async function closeDatabaseConnections(): Promise<void> {
  if (isShuttingDown || !pool) return;

  isShuttingDown = true;
  console.log("[DB] Closing database connections...");

  try {
    await pool.end();
    pool = null;
    console.log("[DB] All connections closed successfully");
  } catch (error) {
    console.error("[DB] Error closing connections:", error);
    throw error;
  }
}

/**
 * Runtime check helper
 */
export function ensureDatabaseConfigured(): void {
  if (
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes("placeholder")
  ) {
    throw new DatabaseConfigError(
      "DATABASE_URL is not set. Please configure your database connection.",
    );
  }
}

// Create Drizzle instance with lazy pool initialization
// The pool is only created when the first query is executed
let drizzleInstance: ReturnType<typeof drizzle> | null = null;

function getDrizzleInstance() {
  if (!drizzleInstance) {
    drizzleInstance = drizzle(getPool(), {
      schema: { ...schema, ...newSchema },
    });
  }
  return drizzleInstance;
}

// Export a proxy that lazily initializes the connection
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    return getDrizzleInstance()[prop as keyof ReturnType<typeof drizzle>];
  },
});

// Register shutdown handlers
if (typeof process !== "undefined") {
  process.on("SIGTERM", () => {
    closeDatabaseConnections().catch(console.error);
  });

  process.on("SIGINT", () => {
    closeDatabaseConnections().catch(console.error);
  });

  process.on("beforeExit", () => {
    closeDatabaseConnections().catch(console.error);
  });
}
