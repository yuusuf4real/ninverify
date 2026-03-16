import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "@/db/client";
import { setSessionCookie } from "@/lib/auth";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit-log";

import { logger } from "../../../../lib/security/secure-logger";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  portal: z.enum(["user", "admin"]).optional().default("user"),
});

async function queryWithRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries) {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, i) * 100),
        );
      }
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  // Get IP address for rate limiting
  const ip =
    request.headers.get("x-forwarded-for") ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // Apply rate limiting
  const rateLimitResult = rateLimitMiddleware(
    `login:${ip}`,
    RATE_LIMITS.login,
    "/api/auth/login",
  );

  if (rateLimitResult) {
    return NextResponse.json(
      { message: rateLimitResult.message },
      {
        status: rateLimitResult.status,
        headers: { "Retry-After": String(rateLimitResult.retryAfter) },
      },
    );
  }

  try {
    const body = await request.json();
    const data = schema.parse(body);

    const user = await queryWithRetry(() =>
      db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, data.email),
      }),
    );

    if (!user) {
      await logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "user.login",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || undefined,
        resource: "user",
        action: "login",
        status: "failure",
        errorMessage: "Invalid credentials",
        metadata: { email: data.email },
      });

      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Check password
    const valid = await bcrypt.compare(data.password, user.passwordHash);
    if (!valid) {
      await logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "user.login",
        userId: user.id,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || undefined,
        resource: "user",
        action: "login",
        status: "failure",
        errorMessage: "Invalid password",
        metadata: { email: data.email },
      });

      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    const isAdmin = user.role === "admin" || user.role === "super_admin";
    const portal = data.portal ?? "user";

    // STRICT PORTAL ENFORCEMENT - No cross-portal access allowed
    if (portal === "admin" && !isAdmin) {
      await logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "security.unauthorized_admin_access",
        userId: user.id,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || undefined,
        resource: "admin_portal",
        action: "login_attempt",
        status: "blocked",
        errorMessage: "Non-admin user attempted admin portal access",
        metadata: { email: data.email, portal, userRole: user.role },
      });

      return NextResponse.json(
        {
          message:
            "Access denied. This account does not have administrative privileges.",
        },
        { status: 403 },
      );
    }

    if (portal === "user" && isAdmin) {
      await logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "security.admin_user_portal_access",
        userId: user.id,
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || undefined,
        resource: "user_portal",
        action: "login_attempt",
        status: "blocked",
        errorMessage: "Admin user attempted user portal access",
        metadata: { email: data.email, portal, userRole: user.role },
      });

      return NextResponse.json(
        {
          message:
            "Administrative accounts must use the dedicated admin portal for security reasons.",
        },
        { status: 403 },
      );
    }

    await setSessionCookie({
      userId: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    });

    // Log successful login
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "user.login",
      userId: user.id,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
      resource: "user",
      action: "login",
      status: "success",
      metadata: { email: data.email },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Login error:", error);

    // Log error
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "api.error",
      ipAddress: ip,
      resource: "/api/auth/login",
      action: "login",
      status: "failure",
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    const message = getFriendlyErrorMessage(
      error,
      "We couldn't log you in. Please try again in a few minutes.",
    );
    return NextResponse.json({ message }, { status: 500 });
  }
}
