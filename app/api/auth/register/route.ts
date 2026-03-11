import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import { db } from "@/db/client";
import { users, wallets } from "@/db/schema";
import { setSessionCookie } from "@/lib/auth";
import { getFriendlyErrorMessage } from "@/lib/utils";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";
import { logAuditEvent } from "@/lib/audit-log";

export const runtime = "nodejs";

const schema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  phone: z.string().min(8),
  password: z.string().min(6)
});

async function queryWithRetry<T>(fn: () => Promise<T>, retries = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i <= retries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < retries) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 100));
      }
    }
  }
  throw lastError;
}

export async function POST(request: Request) {
  // Get IP address for rate limiting
  const ip = request.headers.get("x-forwarded-for") ||
             request.headers.get("x-real-ip") ||
             "unknown";

  // Apply rate limiting
  const rateLimitResult = rateLimitMiddleware(
    `register:${ip}`,
    RATE_LIMITS.register,
    "/api/auth/register"
  );

  if (rateLimitResult) {
    return NextResponse.json(
      { message: rateLimitResult.message },
      {
        status: rateLimitResult.status,
        headers: { "Retry-After": String(rateLimitResult.retryAfter) }
      }
    );
  }

  try {
    const body = await request.json();
    const data = schema.parse(body);

    const existing = await queryWithRetry(() =>
      db.query.users.findFirst({
        where: (users, { eq }) => eq(users.email, data.email)
      })
    );

    if (existing) {
      await logAuditEvent({
        timestamp: new Date().toISOString(),
        eventType: "user.registered",
        ipAddress: ip,
        userAgent: request.headers.get("user-agent") || undefined,
        resource: "user",
        action: "register",
        status: "failure",
        errorMessage: "Email already registered",
        metadata: { email: data.email }
      });

      return NextResponse.json(
        { message: "Email already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const userId = nanoid();
    const walletId = nanoid();

    // Note: neon-http doesn't support transactions, using sequential queries
    await queryWithRetry(() =>
      db.insert(users).values({
        id: userId,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        passwordHash
      })
    );

    await queryWithRetry(() =>
      db.insert(wallets).values({
        id: walletId,
        userId,
        balance: 0,
        currency: "NGN"
      })
    );

    await setSessionCookie({
      userId,
      email: data.email,
      fullName: data.fullName,
      role: "admin"
    });

    // Log successful registration
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "user.registered",
      userId,
      ipAddress: ip,
      userAgent: request.headers.get("user-agent") || undefined,
      resource: "user",
      action: "register",
      status: "success",
      metadata: { email: data.email, fullName: data.fullName }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Register error:", error);

    // Log error
    await logAuditEvent({
      timestamp: new Date().toISOString(),
      eventType: "api.error",
      ipAddress: ip,
      resource: "/api/auth/register",
      action: "register",
      status: "failure",
      errorMessage: error instanceof Error ? error.message : String(error)
    });

    const message = getFriendlyErrorMessage(
      error,
      "We couldn't create your account. Please try again in a few minutes."
    );
    return NextResponse.json({ message }, { status: 500 });
  }
}
