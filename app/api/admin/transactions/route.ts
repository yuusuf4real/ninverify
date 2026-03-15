import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { walletTransactions, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and, gte, lte, desc, asc, count, sql } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit-log";

import { logger } from "../../../../lib/security/secure-logger";
export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z
    .enum(["all", "pending", "completed", "failed", "refunded"])
    .default("all"),
  type: z.enum(["all", "credit", "debit"]).default("all"),
  sort: z.enum(["created_at", "amount", "status"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
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

    // Search filter (by user email/name or transaction reference)
    if (query.search) {
      conditions.push(
        sql`(${users.email} ILIKE ${`%${query.search}%`} OR 
            ${users.fullName} ILIKE ${`%${query.search}%`} OR 
            ${walletTransactions.reference} ILIKE ${`%${query.search}%`})`,
      );
    }

    // Status filter
    if (query.status !== "all") {
      conditions.push(eq(walletTransactions.status, query.status));
    }

    // Type filter
    if (query.type !== "all") {
      conditions.push(eq(walletTransactions.type, query.type));
    }

    // Amount range filter
    if (query.amountMin !== undefined) {
      conditions.push(gte(walletTransactions.amount, query.amountMin));
    }
    if (query.amountMax !== undefined) {
      conditions.push(lte(walletTransactions.amount, query.amountMax));
    }

    // Date range filter
    if (query.dateFrom) {
      conditions.push(
        gte(walletTransactions.createdAt, new Date(query.dateFrom)),
      );
    }
    if (query.dateTo) {
      conditions.push(
        lte(walletTransactions.createdAt, new Date(query.dateTo)),
      );
    }

    // User filter
    if (query.userId) {
      conditions.push(eq(walletTransactions.userId, query.userId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(walletTransactions)
      .leftJoin(users, eq(walletTransactions.userId, users.id))
      .where(whereClause);

    const total = totalResult.count;

    // Get transactions with user data
    const offset = (query.page - 1) * query.limit;
    const orderColumn =
      walletTransactions[
        query.sort === "created_at" ? "createdAt" : query.sort
      ];
    const orderDirection = query.order === "asc" ? asc : desc;

    const transactionsList = await db
      .select({
        id: walletTransactions.id,
        type: walletTransactions.type,
        amount: walletTransactions.amount,
        status: walletTransactions.status,
        description: walletTransactions.description,
        reference: walletTransactions.reference,
        metadata: walletTransactions.metadata,
        createdAt: walletTransactions.createdAt,
        userId: walletTransactions.userId,
        userEmail: users.email,
        userFullName: users.fullName,
      })
      .from(walletTransactions)
      .leftJoin(users, eq(walletTransactions.userId, users.id))
      .where(whereClause)
      .orderBy(orderDirection(orderColumn))
      .limit(query.limit)
      .offset(offset);

    // Calculate summary statistics
    const [summaryResult] = await db
      .select({
        totalVolume: sql<number>`COALESCE(SUM(${walletTransactions.amount}), 0)`,
        completedVolume: sql<number>`COALESCE(SUM(CASE WHEN ${walletTransactions.status} = 'completed' THEN ${walletTransactions.amount} ELSE 0 END), 0)`,
        pendingCount: sql<number>`COALESCE(SUM(CASE WHEN ${walletTransactions.status} = 'pending' THEN 1 ELSE 0 END), 0)`,
        failedCount: sql<number>`COALESCE(SUM(CASE WHEN ${walletTransactions.status} = 'failed' THEN 1 ELSE 0 END), 0)`,
        completedCount: sql<number>`COALESCE(SUM(CASE WHEN ${walletTransactions.status} = 'completed' THEN 1 ELSE 0 END), 0)`,
      })
      .from(walletTransactions)
      .leftJoin(users, eq(walletTransactions.userId, users.id))
      .where(whereClause);

    const successRate =
      total > 0 ? (summaryResult.completedCount / total) * 100 : 0;
    const avgAmount = total > 0 ? summaryResult.totalVolume / total : 0;

    // Log admin action
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "api.error", // Using existing event type
      userId: session.userId,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      resource: "transactions",
      action: "list",
      status: "success",
      metadata: {
        query: query,
        resultCount: transactionsList.length,
      },
    });

    return NextResponse.json({
      transactions: transactionsList,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
      summary: {
        totalVolume: Number(summaryResult.totalVolume),
        completedVolume: Number(summaryResult.completedVolume),
        pendingCount: Number(summaryResult.pendingCount),
        failedCount: Number(summaryResult.failedCount),
        completedCount: Number(summaryResult.completedCount),
        successRate: Math.round(successRate * 10) / 10,
        avgAmount: Number(avgAmount),
      },
    });
  } catch (error) {
    logger.error("Admin transactions list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch transactions" },
      { status: 500 },
    );
  }
}
