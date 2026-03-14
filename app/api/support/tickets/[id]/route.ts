import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/client";
import { supportTickets, users } from "@/db/schema";
import { getSession } from "@/lib/auth";
import { eq, and } from "drizzle-orm";

export const runtime = "nodejs";

// GET /api/support/tickets/[id] - Get ticket details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const ticketId = id;

    // Fetch ticket with user and admin details
    const ticket = await db
      .select({
        id: supportTickets.id,
        userId: supportTickets.userId,
        category: supportTickets.category,
        subcategory: supportTickets.subcategory,
        status: supportTickets.status,
        priority: supportTickets.priority,
        subject: supportTickets.subject,
        description: supportTickets.description,
        paymentReference: supportTickets.paymentReference,
        department: supportTickets.department,
        slaTier: supportTickets.slaTier,
        firstResponseDue: supportTickets.firstResponseDue,
        resolutionDue: supportTickets.resolutionDue,
        firstResponseAt: supportTickets.firstResponseAt,
        satisfactionRating: supportTickets.satisfactionRating,
        satisfactionFeedback: supportTickets.satisfactionFeedback,
        sourceChannel: supportTickets.sourceChannel,
        createdAt: supportTickets.createdAt,
        updatedAt: supportTickets.updatedAt,
        resolvedAt: supportTickets.resolvedAt,
        closedAt: supportTickets.closedAt,
        userFullName: users.fullName,
        userEmail: users.email
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id))
      .where(eq(supportTickets.id, ticketId))
      .limit(1);

    if (!ticket.length) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const ticketData = ticket[0];

    // Check access permissions
    const isAdmin = session.role === "admin" || session.role === "super_admin";
    const isOwner = ticketData.userId === session.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json({
      ticket: ticketData
    });

  } catch (error) {
    console.error("Get ticket details error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket details" },
      { status: 500 }
    );
  }
}

// PATCH /api/support/tickets/[id] - Update ticket (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || (session.role !== "admin" && session.role !== "super_admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const ticketId = id;
    const body = await request.json();

    const allowedUpdates = [
      "status",
      "priority", 
      "assignedTo",
      "satisfactionRating",
      "satisfactionFeedback"
    ];

    const updates: Record<string, unknown> = {};
    
    for (const [key, value] of Object.entries(body)) {
      if (allowedUpdates.includes(key)) {
        updates[key] = value;
      }
    }

    // Set timestamps based on status changes
    if (updates.status === "resolved" && !updates.resolvedAt) {
      updates.resolvedAt = new Date();
    }
    if (updates.status === "closed" && !updates.closedAt) {
      updates.closedAt = new Date();
    }

    updates.updatedAt = new Date();

    await db
      .update(supportTickets)
      .set(updates)
      .where(eq(supportTickets.id, ticketId));

    return NextResponse.json({
      message: "Ticket updated successfully"
    });

  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}