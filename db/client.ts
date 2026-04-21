import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import * as newSchema from "./new-schema";

// Allow build to succeed without DATABASE_URL, but fail at runtime if not set
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://placeholder:placeholder@localhost:5432/placeholder";

const sql = neon(DATABASE_URL);

// Use both old and new schema for transition period
export const db = drizzle(sql, { schema: { ...schema, ...newSchema } });

// Runtime check helper
export function ensureDatabaseConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is not set. Please configure your database connection.",
    );
  }
}
