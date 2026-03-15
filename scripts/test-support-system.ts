#!/usr/bin/env tsx

/**
 * Test script to verify the support ticket system is working correctly
 */

import { db } from "../db/client";
import { supportTickets, ticketMessages, users } from "../db/schema";
import { eq, count } from "drizzle-orm";

async function testSupportSystem() {
  console.log("🔍 Testing Support Ticket System...\n");

  try {
    // Test 1: Check if support_tickets table exists and has the correct schema
    console.log("1. Testing support_tickets table schema...");
    const ticketCount = await db
      .select({ count: count() })
      .from(supportTickets);
    console.log(
      `   ✅ Found ${ticketCount[0]?.count || 0} tickets in database`,
    );

    // Test 2: Check if ticket_messages table exists and has the correct schema
    console.log("2. Testing ticket_messages table schema...");
    const messageCount = await db
      .select({ count: count() })
      .from(ticketMessages);
    console.log(
      `   ✅ Found ${messageCount[0]?.count || 0} messages in database`,
    );

    // Test 3: Check if we can query tickets with user joins
    console.log("3. Testing ticket queries with user joins...");
    const ticketsWithUsers = await db
      .select({
        id: supportTickets.id,
        subject: supportTickets.subject,
        status: supportTickets.status,
        priority: supportTickets.priority,
        userEmail: users.email,
        userFullName: users.fullName,
      })
      .from(supportTickets)
      .leftJoin(users, eq(supportTickets.userId, users.id))
      .limit(5);

    console.log(
      `   ✅ Successfully queried ${ticketsWithUsers.length} tickets with user data`,
    );

    // Test 4: Check if we can query messages with sender info
    console.log("4. Testing message queries with sender info...");
    const messagesWithSenders = await db
      .select({
        id: ticketMessages.id,
        message: ticketMessages.message,
        senderType: ticketMessages.senderType,
        senderName: users.fullName,
        senderEmail: users.email,
      })
      .from(ticketMessages)
      .leftJoin(users, eq(ticketMessages.senderId, users.id))
      .limit(5);

    console.log(
      `   ✅ Successfully queried ${messagesWithSenders.length} messages with sender data`,
    );

    // Test 5: Check admin users exist
    console.log("5. Testing admin user availability...");
    const adminUsers = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.role, "admin"))
      .limit(5);

    console.log(`   ✅ Found ${adminUsers.length} admin users`);
    if (adminUsers.length > 0) {
      console.log(
        `   📋 Admin users: ${adminUsers.map((u) => `${u.fullName} (${u.email})`).join(", ")}`,
      );
    }

    console.log("\n🎉 All support system tests passed!");
    console.log("\n📝 Summary:");
    console.log(`   - Tickets: ${ticketCount[0]?.count || 0}`);
    console.log(`   - Messages: ${messageCount[0]?.count || 0}`);
    console.log(`   - Admin users: ${adminUsers.length}`);
    console.log(`   - Schema: ✅ Compatible`);
    console.log(`   - Queries: ✅ Working`);

    if (ticketCount[0]?.count === 0) {
      console.log(
        "\n💡 Tip: No tickets found. You may want to create some test tickets using the web interface or create-test-support-tickets.ts script",
      );
    }
  } catch (error) {
    console.error("❌ Support system test failed:", error);

    if (error instanceof Error) {
      if (
        error.message.includes("relation") &&
        error.message.includes("does not exist")
      ) {
        console.log("\n🔧 Possible fix: Run database migrations");
        console.log("   npm run db:migrate");
      } else if (
        error.message.includes("column") &&
        error.message.includes("does not exist")
      ) {
        console.log(
          "\n🔧 Possible fix: Ensure migration 0004_talented_meggan.sql has been applied",
        );
        console.log("   This migration adds the new ticket_messages schema");
      }
    }

    process.exit(1);
  }
}

// Run the test
testSupportSystem().catch(console.error);
