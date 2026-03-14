import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";

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

    // Return mock data for now since support tickets table might not be fully set up
    const mockTickets = [
      {
        id: "ticket_1",
        userId: "user_1",
        category: "payment_issue",
        status: "open",
        priority: "high",
        subject: "Payment not processed",
        description: "My payment was deducted but verification failed",
        paymentReference: "PAY_123456789",
        assignedTo: null,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        resolvedAt: null,
        userEmail: "user@example.com",
        userFullName: "John Doe",
        assignedAdminEmail: null,
        assignedAdminName: null,
        messageCount: 3
      },
      {
        id: "ticket_2",
        userId: "user_2",
        category: "verification_problem",
        status: "in_progress",
        priority: "medium",
        subject: "NIN verification failed",
        description: "Getting error when trying to verify my NIN",
        paymentReference: null,
        assignedTo: session.userId,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        resolvedAt: null,
        userEmail: "jane@example.com",
        userFullName: "Jane Smith",
        assignedAdminEmail: session.email,
        assignedAdminName: "Admin User",
        messageCount: 5
      },
      {
        id: "ticket_3",
        userId: "user_3",
        category: "account_access",
        status: "resolved",
        priority: "low",
        subject: "Cannot login to account",
        description: "Forgot password and reset link not working",
        paymentReference: null,
        assignedTo: session.userId,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        resolvedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        userEmail: "bob@example.com",
        userFullName: "Bob Johnson",
        assignedAdminEmail: session.email,
        assignedAdminName: "Admin User",
        messageCount: 2
      }
    ];

    // Apply filters to mock data
    let filteredTickets = mockTickets;

    if (query.status !== "all") {
      filteredTickets = filteredTickets.filter(ticket => ticket.status === query.status);
    }

    if (query.priority !== "all") {
      filteredTickets = filteredTickets.filter(ticket => ticket.priority === query.priority);
    }

    if (query.category !== "all") {
      filteredTickets = filteredTickets.filter(ticket => ticket.category === query.category);
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredTickets = filteredTickets.filter(ticket => 
        ticket.subject.toLowerCase().includes(searchLower) ||
        ticket.description.toLowerCase().includes(searchLower) ||
        ticket.userEmail.toLowerCase().includes(searchLower) ||
        ticket.userFullName.toLowerCase().includes(searchLower)
      );
    }

    // Apply pagination
    const total = filteredTickets.length;
    const offset = (query.page - 1) * query.limit;
    const paginatedTickets = filteredTickets.slice(offset, offset + query.limit);

    // Calculate summary statistics
    const summary = {
      openCount: mockTickets.filter(t => t.status === 'open').length,
      assignedCount: mockTickets.filter(t => t.status === 'assigned').length,
      inProgressCount: mockTickets.filter(t => t.status === 'in_progress').length,
      resolvedCount: mockTickets.filter(t => t.status === 'resolved').length,
      urgentCount: mockTickets.filter(t => t.priority === 'urgent').length,
      highCount: mockTickets.filter(t => t.priority === 'high').length
    };

    return NextResponse.json({
      tickets: paginatedTickets,
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