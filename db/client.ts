import "server-only";
import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as newSchema from "./new-schema";

// Allow build to succeed without DATABASE_URL, but fail at runtime if not set
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

// Configure Neon client with proper connection settings for Next.js 15
// This prevents "Connection closed" errors in production
let sqlClient: NeonQueryFunction<false, false> | null = null;

function getSqlClient() {
  if (!sqlClient) {
    sqlClient = neon(DATABASE_URL, {
      fetchOptions: {
        cache: "no-store", // Disable caching to prevent stale connections
      },
      // Add connection timeout and retry settings
      fullResults: false,
    });
  }
  return sqlClient;
}

// Use both old and new schema for transition period
export const db = drizzle(getSqlClient(), {
  schema: { ...schema, ...newSchema },
});

// Runtime check helper
export function ensureDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your database connection.",
    );
  }
}
