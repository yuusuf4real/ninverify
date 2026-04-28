/**
 * Test Session Flow
 *
 * This script tests the complete session flow to identify where the 401 error occurs.
 * Run with: npx tsx scripts/test-session-flow.ts
 */

import { SessionManager } from "@/lib/session-manager";
import { db } from "@/db/client";
import { verificationSessions } from "@/db/new-schema";
import { eq } from "drizzle-orm";

async function testSessionFlow() {
  console.log("=== Testing Session Flow ===\n");

  try {
    // Step 1: Create a test session
    console.log("Step 1: Creating test session...");
    const testPhone = "+2349012345678";
    const testOtpSessionId = "test-otp-session";

    const { sessionId, sessionToken } = await SessionManager.createSession(
      testPhone,
      testOtpSessionId,
      "127.0.0.1",
      "Test User Agent",
    );

    console.log("✅ Session created:");
    console.log("  - Session ID:", sessionId);
    console.log("  - Token:", sessionToken.substring(0, 30) + "...");
    console.log();

    // Step 2: Verify the session token
    console.log("Step 2: Verifying session token...");
    const verifiedSession = await SessionManager.verifySession(sessionToken);

    if (verifiedSession) {
      console.log("✅ Session verified:");
      console.log("  - Session ID:", verifiedSession.sessionId);
      console.log("  - Phone:", verifiedSession.phoneNumber);
      console.log("  - Status:", verifiedSession.status);
      console.log("  - Expires:", verifiedSession.expiresAt);
      console.log();
    } else {
      console.log("❌ Session verification failed!");
      console.log();
      return;
    }

    // Step 3: Update session with NIN
    console.log("Step 3: Updating session with NIN...");
    await SessionManager.updateSessionWithNIN(
      sessionId,
      "123****8901",
      "demographic",
      "encrypted-nin-data",
    );

    const updatedSession = await db.query.verificationSessions.findFirst({
      where: eq(verificationSessions.id, sessionId),
    });

    console.log("✅ Session updated:");
    console.log("  - Status:", updatedSession?.status);
    console.log("  - NIN Masked:", updatedSession?.ninMasked);
    console.log("  - Data Layer:", updatedSession?.dataLayerSelected);
    console.log();

    // Step 4: Verify token again (simulating payment endpoint)
    console.log("Step 4: Verifying token again (payment flow)...");
    const reVerifiedSession = await SessionManager.verifySession(sessionToken);

    if (reVerifiedSession) {
      console.log("✅ Session re-verified successfully!");
      console.log("  - Session ID:", reVerifiedSession.sessionId);
      console.log("  - Status:", reVerifiedSession.status);
      console.log();
    } else {
      console.log("❌ Session re-verification failed!");
      console.log();
      return;
    }

    // Step 5: Get session details (simulating payment endpoint)
    console.log("Step 5: Getting session details...");
    const sessionDetails = await SessionManager.getSessionForAdmin(sessionId);

    if (sessionDetails) {
      console.log("✅ Session details retrieved:");
      console.log("  - Data Layer:", sessionDetails.dataLayerSelected);
      console.log("  - NIN Masked:", sessionDetails.ninMasked);
      console.log("  - Status:", sessionDetails.status);
      console.log();
    } else {
      console.log("❌ Failed to get session details!");
      console.log();
      return;
    }

    // Step 6: Test with invalid token
    console.log("Step 6: Testing with invalid token...");
    const invalidSession = await SessionManager.verifySession("invalid-token");

    if (invalidSession) {
      console.log("❌ Invalid token was accepted (this is bad!)");
      console.log();
    } else {
      console.log("✅ Invalid token correctly rejected");
      console.log();
    }

    // Step 7: Test with expired session
    console.log("Step 7: Testing expired session detection...");
    // Create a session that's already expired
    const expiredSessionId = "expired-test-session";
    await db.insert(verificationSessions).values({
      id: expiredSessionId,
      sessionToken: "expired-token",
      phoneNumber: testPhone,
      otpSessionId: testOtpSessionId,
      status: "otp_verified",
      expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      ipAddress: "127.0.0.1",
      userAgent: "Test",
    });

    const expiredSession = await db.query.verificationSessions.findFirst({
      where: eq(verificationSessions.id, expiredSessionId),
    });

    if (expiredSession && expiredSession.expiresAt < new Date()) {
      console.log("✅ Expired session correctly identified");
      console.log("  - Expired at:", expiredSession.expiresAt);
      console.log("  - Current time:", new Date());
      console.log();
    }

    // Cleanup
    console.log("Cleaning up test data...");
    await db
      .delete(verificationSessions)
      .where(eq(verificationSessions.id, sessionId));
    await db
      .delete(verificationSessions)
      .where(eq(verificationSessions.id, expiredSessionId));

    console.log("✅ Test completed successfully!");
    console.log();
    console.log("=== Summary ===");
    console.log("All session operations are working correctly.");
    console.log("If you're still getting 401 errors, check the following:");
    console.log("1. Session token is being passed correctly from frontend");
    console.log("2. JWT_SECRET is the same in all environments");
    console.log("3. Database connection pool is not exhausted");
    console.log("4. Session hasn't expired (30 minute timeout)");
  } catch (error) {
    console.error("❌ Test failed with error:");
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

testSessionFlow();
