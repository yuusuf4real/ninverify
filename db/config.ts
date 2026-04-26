import "server-only";

/**
 * Database Configuration Module
 *
 * Parses environment variables and provides configuration for PostgreSQL connection pool.
 * Optimized for serverless environments (Vercel) with sensible defaults.
 */

export interface DatabaseConfig {
  connectionString: string;
  pool: PoolConfig;
  ssl: SSLConfig;
  provider: ProviderType;
}

export interface PoolConfig {
  min: number; // Minimum connections (0 for serverless)
  max: number; // Maximum connections
  idleTimeoutMillis: number; // Close idle connections after this time
  connectionTimeoutMillis: number; // Connection timeout
  allowExitOnIdle: boolean; // Allow process exit when idle (true for serverless)
}

export interface SSLConfig {
  rejectUnauthorized: boolean;
  ca?: string;
  mode: "require" | "prefer" | "disable";
}

export type ProviderType =
  | "neon"
  | "supabase"
  | "railway"
  | "rds"
  | "local"
  | "unknown";

export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

/**
 * Get database configuration from environment variables
 */
export function getDatabaseConfig(): DatabaseConfig {
  const connectionString =
    process.env.DATABASE_URL ||
    "postgresql://placeholder:placeholder@localhost:5432/placeholder";

  // Validate configuration
  validateConfig(connectionString);

  // Parse pool configuration with serverless-optimized defaults
  const pool: PoolConfig = {
    min: parseInt(process.env.DB_POOL_MIN || "0", 10),
    max: parseInt(process.env.DB_POOL_MAX || "10", 10),
    idleTimeoutMillis: parseInt(
      process.env.DB_POOL_IDLE_TIMEOUT || "30000",
      10,
    ),
    connectionTimeoutMillis: parseInt(
      process.env.DB_POOL_CONNECTION_TIMEOUT || "10000",
      10,
    ),
    allowExitOnIdle: process.env.DB_POOL_ALLOW_EXIT_ON_IDLE !== "false", // Default true for serverless
  };

  // Validate pool configuration
  if (pool.max < pool.min) {
    throw new DatabaseConfigError(
      `DB_POOL_MAX (${pool.max}) must be greater than or equal to DB_POOL_MIN (${pool.min})`,
    );
  }

  // Parse SSL configuration
  const sslMode = (process.env.DB_SSL_MODE || "prefer") as SSLConfig["mode"];
  const ssl: SSLConfig = {
    mode: sslMode,
    rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false", // Default true
    ca: process.env.DB_SSL_CA,
  };

  // Detect provider (can be overridden)
  const provider =
    (process.env.DB_PROVIDER as ProviderType) ||
    detectProvider(connectionString);

  return {
    connectionString,
    pool,
    ssl,
    provider,
  };
}

/**
 * Validate database configuration
 */
function validateConfig(connectionString: string): void {
  if (!connectionString || connectionString.includes("placeholder")) {
    throw new DatabaseConfigError(
      "DATABASE_URL environment variable is required and must be a valid PostgreSQL connection string",
    );
  }

  // Validate connection string format
  try {
    const url = new URL(connectionString);
    if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
      throw new Error("Invalid protocol");
    }
  } catch (error) {
    throw new DatabaseConfigError(
      `DATABASE_URL must be a valid PostgreSQL connection string (postgresql://user:pass@host:port/db). Error: ${error instanceof Error ? error.message : "Invalid format"}`,
    );
  }
}

/**
 * Detect PostgreSQL provider from connection string
 */
function detectProvider(connectionString: string): ProviderType {
  const lowerUrl = connectionString.toLowerCase();

  if (lowerUrl.includes("neon.tech")) return "neon";
  if (lowerUrl.includes("supabase.co")) return "supabase";
  if (lowerUrl.includes("railway.app")) return "railway";
  if (lowerUrl.includes("rds.amazonaws.com")) return "rds";
  if (lowerUrl.includes("localhost") || lowerUrl.includes("127.0.0.1")) {
    return "local";
  }

  return "unknown";
}

/**
 * Sanitize connection string for logging (mask password)
 */
export function sanitizeConnectionString(url: string): string {
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = "***";
    }
    return parsed.toString();
  } catch {
    return "[invalid connection string]";
  }
}
