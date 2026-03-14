import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { users, wallets } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, ilike, and, gte, lte, desc, asc, count, sql } from "drizzle-orm";
import { logAuditEvent } from "@/lib/audit-log";

export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.enum(["active", "suspended", "all"]).default("all"),
  sort: z.enum(["created_at", "email", "fullName", "balance"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  balanceMin: z.coerce.number().optional(),
  balanceMax: z.coerce.number().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional()
});

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = querySchema.parse(Object.fromEntries(searchParams));

    // Build where conditions
    const conditions = [];

    // Search filter
    if (query.search) {
      conditions.push(
        sql`(${users.email} ILIKE ${`%${query.search}%`} OR 
            ${users.fullName} ILIKE ${`%${query.search}%`} OR 
            ${users.phone} ILIKE ${`%${query.search}%`})`
      );
    }

    // Status filter
    if (query.status !== "all") {
      conditions.push(eq(users.isSuspended, query.status === "suspended"));
    }

    // Date range filter
    if (query.dateFrom) {
      conditions.push(gte(users.createdAt, new Date(query.dateFrom)));
    }
    if (query.dateTo) {
      conditions.push(lte(users.createdAt, new Date(query.dateTo)));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(users)
      .where(whereClause);

    const total = totalResult.count;

    // Get users with wallet data
    const offset = (query.page - 1) * query.limit;
    
    let orderColumn;
    if (query.sort === "balance") {
      orderColumn = wallets.balance;
    } else if (query.sort === "created_at") {
      orderColumn = users.createdAt;
    } else if (query.sort === "email") {
      orderColumn = users.email;
    } else if (query.sort === "fullName") {
      orderColumn = users.fullName;
    } else {
      orderColumn = users.createdAt; // default fallback
    }
    
    const orderDirection = query.order === "asc" ? asc : desc;

    const usersList = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        phone: users.phone,
        isSuspended: users.isSuspended,
        createdAt: users.createdAt,
        balance: wallets.balance
      })
      .from(users)
      .leftJoin(wallets, eq(users.id, wallets.userId))
      .where(whereClause)
      .orderBy(orderDirection(orderColumn))
      .limit(query.limit)
      .offset(offset);

    // Apply balance filters if specified (post-query filtering for joined data)
    let filteredUsers = usersList;
    if (query.balanceMin !== undefined || query.balanceMax !== undefined) {
      filteredUsers = usersList.filter(user => {
        const balance = user.balance || 0;
        if (query.balanceMin !== undefined && balance < query.balanceMin) return false;
        if (query.balanceMax !== undefined && balance > query.balanceMax) return false;
        return true;
      });
    }

    // Log admin action
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "api.error", // Using existing event type
      userId: session.userId,
      ipAddress: request.headers.get("x-forwarded-for") || "unknown",
      resource: "users",
      action: "list",
      status: "success",
      metadata: {
        query: query,
        resultCount: filteredUsers.length
      }
    });

    return NextResponse.json({
      users: filteredUsers,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      }
    });

  } catch (error) {
    console.error("Admin users list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}