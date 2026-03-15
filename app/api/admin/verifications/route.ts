import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { ninVerifications, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, gte, lte, desc, asc, count, sql } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit-log";

import { logger } from "../../../../lib/security/secure-logger";
export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.enum(["all", "pending", "success", "failed"]).default("all"),
  purpose: z
    .enum([
      "all",
      "banking",
      "education_jamb",
      "education_waec",
      "education_neco",
      "education_nysc",
      "passport",
      "drivers_license",
      "employment",
      "telecommunications",
      "government_service",
      "other",
    ])
    .default("all"),
  sort: z.enum(["created_at", "status", "purpose"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  userId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getSession();
    if (
      !session ||
      (session.role !== "admin" && session.role !== "super_admin")
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Build where conditions
    const conditions = [];

    // Search filter (by user email/name or NIN)
    if (query.search) {
      conditions.push(
        sql`(${users.email} ILIKE ${`%${query.search}%`} OR 
            ${users.fullName} ILIKE ${`%${query.search}%`} OR 
            ${ninVerifications.ninMasked} ILIKE ${`%${query.search}%`} OR
            ${ninVerifications.providerReference} ILIKE ${`%${query.search}%`})`,
      );
    }

    // Status filter
    if (query.status !== "all") {
      conditions.push(eq(ninVerifications.status, query.status));
    }

    // Purpose filter
    if (query.purpose !== "all") {
      conditions.push(eq(ninVerifications.purpose, query.purpose));
    }

    // Date range filter
    if (query.dateFrom) {
      conditions.push(
        gte(ninVerifications.createdAt, new Date(query.dateFrom)),
      );
    }
    if (query.dateTo) {
      conditions.push(lte(ninVerifications.createdAt, new Date(query.dateTo)));
    }

    // User filter
    if (query.userId) {
      conditions.push(eq(ninVerifications.userId, query.userId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(ninVerifications)
      .leftJoin(users, eq(ninVerifications.userId, users.id))
      .where(whereClause);

    const total = totalResult.count;

    // Get verifications with user data
    const offset = (query.page - 1) * query.limit;
    const orderColumn =
      ninVerifications[query.sort === "created_at" ? "createdAt" : query.sort];
    const orderDirection = query.order === "asc" ? asc : desc;

    const verificationsList = await db
      .select({
        id: ninVerifications.id,
        userId: ninVerifications.userId,
        ninMasked: ninVerifications.ninMasked,
        consent: ninVerifications.consent,
        status: ninVerifications.status,
        purpose: ninVerifications.purpose,
        fullName: ninVerifications.fullName,
        dateOfBirth: ninVerifications.dateOfBirth,
        phone: ninVerifications.phone,
        providerReference: ninVerifications.providerReference,
        errorMessage: ninVerifications.errorMessage,
        createdAt: ninVerifications.createdAt,
        userEmail: users.email,
        userFullName: users.fullName,
      })
      .from(ninVerifications)
      .leftJoin(users, eq(ninVerifications.userId, users.id))
      .where(whereClause)
      .orderBy(orderDirection(orderColumn))
      .limit(query.limit)
      .offset(offset);

    // Calculate summary statistics
    const [summaryResult] = await db
      .select({
        totalVerifications: count(),
        successfulVerifications: sql<number>`COALESCE(SUM(CASE WHEN ${ninVerifications.status} = 'success' THEN 1 ELSE 0 END), 0)`,
        failedVerifications: sql<number>`COALESCE(SUM(CASE WHEN ${ninVerifications.status} = 'failed' THEN 1 ELSE 0 END), 0)`,
        pendingVerifications: sql<number>`COALESCE(SUM(CASE WHEN ${ninVerifications.status} = 'pending' THEN 1 ELSE 0 END), 0)`,
      })
      .from(ninVerifications)
      .leftJoin(users, eq(ninVerifications.userId, users.id))
      .where(whereClause);

    const successRate =
      summaryResult.totalVerifications > 0
        ? (Number(summaryResult.successfulVerifications) /
            summaryResult.totalVerifications) *
          100
        : 0;

    // Get today's count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayResult] = await db
      .select({ count: count() })
      .from(ninVerifications)
      .where(gte(ninVerifications.createdAt, today));

    // Log admin action
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "api.error", // Using existing event type
      userId: session.userId,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      resource: "verifications",
      action: "list",
      status: "success",
      metadata: {
        query: query,
        resultCount: verificationsList.length,
      },
    });

    return NextResponse.json({
      verifications: verificationsList,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      summary: {
        totalVerifications: summaryResult.totalVerifications,
        successfulVerifications: Number(summaryResult.successfulVerifications),
        failedVerifications: Number(summaryResult.failedVerifications),
        pendingVerifications: Number(summaryResult.pendingVerifications),
        successRate: Math.round(successRate * 10) / 10,
        todayCount: todayResult.count,
      },
    });
  } catch (error) {
    logger.error("Admin verifications list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch verifications" },
      { status: 500 },
    );
  }
}
