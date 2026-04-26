import "server-only";
import type { ProviderType, SSLConfig } from "./config";

/**
 * Provider Adapter Module
 *
 * Detects PostgreSQL provider and applies provider-specific optimizations
 * for connection pooling and performance.
 */

export interface ProviderOptimizations {
  connectionString: string; // Modified connection string with optimizations
  ssl: Partial<SSLConfig>; // Provider-specific SSL configuration
  poolOverrides?: {
    // Provider-specific pool configuration overrides
    max?: number;
    idleTimeoutMillis?: number;
  };
  statementTimeout?: number; // Query timeout in milliseconds
}

/**
 * Get provider-specific optimizations
 */
export function getProviderOptimizations(
  provider: ProviderType,
  connectionString: string,
  currentSsl: SSLConfig,
): ProviderOptimizations {
  switch (provider) {
    case "neon":
      return getNeonOptimizations(connectionString, currentSsl);

    case "supabase":
      return getSupabaseOptimizations(connectionString, currentSsl);

    case "railway":
      return getRailwayOptimizations(connectionString, currentSsl);

    case "rds":
      return getRdsOptimizations(connectionString, currentSsl);

    case "local":
      return getLocalOptimizations(connectionString, currentSsl);

    default:
      return getDefaultOptimizations(connectionString, currentSsl);
  }
}

/**
 * Neon-specific optimizations
 * - Use connection pooler endpoint if available
 * - Ensure SSL is required
 */
function getNeonOptimizations(
  connectionString: string,
  currentSsl: SSLConfig,
): ProviderOptimizations {
  let optimizedUrl = connectionString;

  // Ensure sslmode=require is in the connection string
  if (!optimizedUrl.includes("sslmode=")) {
    const separator = optimizedUrl.includes("?") ? "&" : "?";
    optimizedUrl = `${optimizedUrl}${separator}sslmode=require`;
  }

  return {
    connectionString: optimizedUrl,
    ssl: {
      mode: "require",
      rejectUnauthorized: true,
    },
    poolOverrides: {
      // Neon works well with serverless defaults
      max: 10,
      idleTimeoutMillis: 30000,
    },
  };
}

/**
 * Supabase-specific optimizations
 * - Use connection pooler on port 6543 if not already specified
 * - Enable SSL
 * - Set statement timeout
 */
function getSupabaseOptimizations(
  connectionString: string,
  currentSsl: SSLConfig,
): ProviderOptimizations {
  let optimizedUrl = connectionString;

  // Supabase recommends using port 6543 for connection pooling
  // Only modify if using default port 5432
  try {
    const url = new URL(optimizedUrl);
    if (url.port === "5432" || url.port === "") {
      url.port = "6543";
      optimizedUrl = url.toString();
    }
  } catch {
    // If URL parsing fails, use as-is
  }

  return {
    connectionString: optimizedUrl,
    ssl: {
      mode: "require",
      rejectUnauthorized: true,
    },
    poolOverrides: {
      max: 10,
      idleTimeoutMillis: 30000,
    },
    statementTimeout: 60000, // 60 second query timeout
  };
}

/**
 * Railway-specific optimizations
 * - Enable SSL
 * - Standard connection pooling
 */
function getRailwayOptimizations(
  connectionString: string,
  currentSsl: SSLConfig,
): ProviderOptimizations {
  return {
    connectionString,
    ssl: {
      mode: "require",
      rejectUnauthorized: true,
    },
    poolOverrides: {
      max: 10,
      idleTimeoutMillis: 30000,
    },
  };
}

/**
 * AWS RDS-specific optimizations
 * - Enable SSL
 * - Support RDS Proxy if configured
 */
function getRdsOptimizations(
  connectionString: string,
  currentSsl: SSLConfig,
): ProviderOptimizations {
  return {
    connectionString,
    ssl: {
      mode: "require",
      rejectUnauthorized: true,
    },
    poolOverrides: {
      max: 15, // RDS can handle more connections
      idleTimeoutMillis: 60000, // Keep connections longer
    },
  };
}

/**
 * Local development optimizations
 * - Disable SSL for localhost
 * - Relaxed timeouts
 */
function getLocalOptimizations(
  connectionString: string,
  currentSsl: SSLConfig,
): ProviderOptimizations {
  return {
    connectionString,
    ssl: {
      mode: "disable",
      rejectUnauthorized: false,
    },
    poolOverrides: {
      max: 20, // More connections for local development
      idleTimeoutMillis: 60000, // Keep connections longer
    },
  };
}

/**
 * Default optimizations for unknown providers
 * - Use provided SSL configuration
 * - Standard connection pooling
 */
function getDefaultOptimizations(
  connectionString: string,
  currentSsl: SSLConfig,
): ProviderOptimizations {
  return {
    connectionString,
    ssl: {
      mode: currentSsl.mode,
      rejectUnauthorized: currentSsl.rejectUnauthorized,
    },
    poolOverrides: {
      max: 10,
      idleTimeoutMillis: 30000,
    },
  };
}
