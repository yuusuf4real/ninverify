import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db/client";
import { supportTickets, ticketMessages, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, desc, and, or, like, count, sql } from "drizzle-orm";

export const runtime = "nodejs";

const querySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(50),
  search: z.string().optional(),
  status: z.enum(["all", "open", "assigned", "in_progress", "resolved", "closed"]).default("all"),
  priority: z.enum(["all", "low", "medium", "high", "urgent"]).default("all"),
  category: z.enum(["all", "payment_issue", "verification_problem", "account_access", "technical_support", "general_inquiry"]).default("all"),
  assignedTo: z.string().optional(),
  sort: z.enum(["created_at", "updated_at", "priority", "status"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
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

    if (query.status !== "all") {
      conditions.push(eq(supportTickets.status, query.status as "open" | "assigned" | "in_progress" | "resolved" | "closed"));
    }

    if (query.priority !== "all") {
      conditions.push(eq(supportTickets.priority, query.priority as "low" | "medium" | "high" | "urgent"));
    }

    if (query.category !== "all") {
      conditions.push(eq(supportTickets.category, query.category as "payment_issue" | "verification_problem" | "account_access" | "technical_support" | "general_inquiry"));
    }

    if (query.assignedTo) {
      conditions.push(eq(supportTickets.assignedTo, query.assignedTo));
    }

    if (query.search) {
      const searchTerm = `%${query.search.toLowerCase()}%`;
      conditions.push(
        or(
          like(sql`LOWER(${supportTickets.subject})`, searchTerm),
          like(sql`LOWER(${supportTickets.description})`, searchTerm),
          like(sql`LOWER(${users.email})`, searchTerm),
          like(sql`LOWER(${users.fullName})`, searchTerm)
        )
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id))
      .where(whereClause);

    const total = totalResult[0]?.count || 0;

    // Fetch tickets with pagination
    const offset = (query.page - 1) * query.limit;
    
    const tickets = await db
      .select({
        id: supportTickets.id,
        userId: supportTickets.userId,
        category: supportTickets.category,
        status: supportTickets.status,
        priority: supportTickets.priority,
        subject: supportTickets.subject,
        description: supportTickets.description,
        paymentReference: supportTickets.paymentReference,
        assignedTo: supportTickets.assignedTo,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        resolvedAt: supportTickets.resolvedAt,
        userEmail: users.email,
        userFullName: users.fullName,
        assignedAdminName: sql<string>`assigned_admin.full_name`
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id))
      .leftJoin(
        sql`${users} as assigned_admin`,
        eq(supportTickets.assignedTo, sql`assigned_admin.id`)
      )
      .where(whereClause)
      .orderBy(
        query.order === "desc" 
          ? desc(supportTickets[query.sort as keyof typeof supportTickets])
          : supportTickets[query.sort as keyof typeof supportTickets]
      )
      .limit(query.limit)
      .offset(offset);

    // Get message counts for each ticket
    const ticketsWithCounts = await Promise.all(
      tickets.map(async (ticket) => {
        const messageCountResult = await db
          .select({ count: count() })
          .from(ticketMessages)
          .where(eq(ticketMessages.ticketId, ticket.id));

        return {
          ...ticket,
          messageCount: messageCountResult[0]?.count || 0
        };
      })
    );

    // Calculate summary statistics
    const summaryResult = await db
      .select({
        status: supportTickets.status,
        priority: supportTickets.priority,
        count: count()
      })
      .from(supportTickets)
      .groupBy(supportTickets.status, supportTickets.priority);

    const summary = {
      openCount: summaryResult.filter(s => s.status === 'open').reduce((acc, s) => acc + s.count, 0),
      assignedCount: summaryResult.filter(s => s.status === 'assigned').reduce((acc, s) => acc + s.count, 0),
      inProgressCount: summaryResult.filter(s => s.status === 'in_progress').reduce((acc, s) => acc + s.count, 0),
      resolvedCount: summaryResult.filter(s => s.status === 'resolved').reduce((acc, s) => acc + s.count, 0),
      urgentCount: summaryResult.filter(s => s.priority === 'urgent').reduce((acc, s) => acc + s.count, 0),
      highCount: summaryResult.filter(s => s.priority === 'high').reduce((acc, s) => acc + s.count, 0)
    };

    return NextResponse.json({
      tickets: ticketsWithCounts,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit)
      },
      summary
    });

  } catch (error) {
    console.error("Admin support tickets list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch support tickets" },
      { status: 500 }
    );
  }
}