#!/usr/bin/env tsx

/**
 * Create Test Support Tickets
 * This script creates sample support tickets for testing admin functionality
 */

import { db } from "../db/client";
import { supportTickets, ticketMessages, users } from "../db/schema";
import { eq } from "drizzle-orm";

async function createTestSupportTickets() {
  try {
    console.log("🎫 Creating test support tickets...");

    // Get a regular user to create tickets for
    const regularUsers = await db
      .select()
      .from(users)
      .where(eq(users.role, "user"))
      .limit(3);

    if (regularUsers.length === 0) {
      console.log("❌ No regular users found. Please create some users first.");
      return;
    }

    console.log(`📋 Found ${regularUsers.length} users to create tickets for`);

    // Check if test tickets already exist
    const existingTickets = await db.select().from(supportTickets).limit(1);

    if (existingTickets.length > 0) {
      console.log("✅ Support tickets already exist. Skipping creation.");
      return;
    }

    // Create sample support tickets
    const testTickets = [
      {
        id: "ticket_test_001",
        userId: regularUsers[0].id,
        category: "payment_issue" as const,
        subcategory: "Failed Payment",
        status: "open" as const,
        priority: "high" as const,
        subject: "Payment Failed - Need Refund",
        description:
          "My payment was deducted but the verification failed. I need a refund urgently. Transaction reference: TXN123456789",
        department: "financial",
        slaTier: "high",
        sourceChannel: "web",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: "ticket_test_002",
        userId: regularUsers[0].id,
        category: "verification_problem" as const,
        subcategory: "NIN Verification Error",
        status: "assigned" as const,
        priority: "medium" as const,
        subject: "NIN Verification Not Working",
        description:
          "I am trying to verify my NIN but getting an error message 'Invalid NIN format'. I have double-checked my NIN and it's correct. Please help.",
        department: "technical",
        slaTier: "medium",
        sourceChannel: "web",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        updatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: "ticket_test_003",
        userId: regularUsers[1] ? regularUsers[1].id : regularUsers[0].id,
        category: "account_access" as const,
        subcategory: "Login Issues",
        status: "in_progress" as const,
        priority: "urgent" as const,
        subject: "Cannot Access My Account",
        description:
          "I forgot my password and the reset email is not coming through. I have checked my spam folder. This is urgent as I need to access my account for work.",
        department: "general",
        slaTier: "critical",
        sourceChannel: "web",
        createdAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        updatedAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: "ticket_test_004",
        userId: regularUsers[2] ? regularUsers[2].id : regularUsers[0].id,
        category: "technical_support" as const,
        subcategory: "Website Issues",
        status: "resolved" as const,
        priority: "low" as const,
        subject: "Page Loading Slowly",
        description:
          "The dashboard page is loading very slowly. It takes more than 30 seconds to load. My internet connection is fine.",
        department: "technical",
        slaTier: "low",
        sourceChannel: "web",
        resolvedAt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: "ticket_test_005",
        userId: regularUsers[0].id,
        category: "general_inquiry" as const,
        subcategory: "Feature Request",
        status: "closed" as const,
        priority: "low" as const,
        subject: "Request for Mobile App",
        description:
          "Do you have plans to release a mobile app? It would be very convenient to verify documents on mobile.",
        department: "management",
        slaTier: "low",
        sourceChannel: "web",
        resolvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        closedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        satisfactionRating: 5,
        satisfactionFeedback:
          "Great support! Thank you for the detailed explanation.",
      },
    ];

    // Insert test tickets
    await db.insert(supportTickets).values(testTickets);
    console.log(`✅ Created ${testTickets.length} test support tickets`);

    // Create sample messages for each ticket
    const testMessages = [
      {
        id: "msg_test_001",
        ticketId: "ticket_test_001",
        senderId: "system",
        senderType: "system" as const,
        message:
          "Thank you for contacting support. Your ticket has been created and assigned to our financial team. Expected response time: 4 hours.",
        messageType: "system_note" as const,
        isSystemGenerated: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      },
      {
        id: "msg_test_002",
        ticketId: "ticket_test_002",
        senderId: "system",
        senderType: "system" as const,
        message:
          "Your ticket has been assigned to our technical support team. We will investigate the NIN verification issue.",
        messageType: "system_note" as const,
        isSystemGenerated: true,
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      },
      {
        id: "msg_test_003",
        ticketId: "ticket_test_003",
        senderId: "system",
        senderType: "system" as const,
        message:
          "URGENT: Account access issue detected. This ticket has been escalated to our priority queue.",
        messageType: "system_note" as const,
        isSystemGenerated: true,
        createdAt: new Date(Date.now() - 30 * 60 * 1000),
      },
      {
        id: "msg_test_004",
        ticketId: "ticket_test_004",
        senderId: "system",
        senderType: "system" as const,
        message:
          "Issue resolved: We have optimized the dashboard loading performance. Please try again and let us know if you still experience slow loading.",
        messageType: "system_note" as const,
        isSystemGenerated: true,
        createdAt: new Date(Date.now() - 60 * 60 * 1000),
      },
      {
        id: "msg_test_005",
        ticketId: "ticket_test_005",
        senderId: "system",
        senderType: "system" as const,
        message:
          "Thank you for your feedback! We are currently working on a mobile app and expect to release it in Q2 2024. We'll notify all users when it's available.",
        messageType: "system_note" as const,
        isSystemGenerated: true,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];

    // Insert test messages
    await db.insert(ticketMessages).values(testMessages);
    console.log(`✅ Created ${testMessages.length} test messages`);

    console.log("\n🎉 Test support tickets created successfully!");
    console.log("\nTicket Summary:");
    console.log("- ticket_test_001: Payment Issue (HIGH priority, OPEN)");
    console.log(
      "- ticket_test_002: NIN Verification (MEDIUM priority, ASSIGNED)",
    );
    console.log(
      "- ticket_test_003: Account Access (URGENT priority, IN_PROGRESS)",
    );
    console.log("- ticket_test_004: Technical Issue (LOW priority, RESOLVED)");
    console.log("- ticket_test_005: General Inquiry (LOW priority, CLOSED)");
    console.log(
      "\n✅ Admins should now be able to view and manage these tickets!",
    );
  } catch (error) {
    console.error("❌ Error creating test support tickets:", error);
    process.exit(1);
  }
}

// Run the script
createTestSupportTickets()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error);
    process.exit(1);
  });
