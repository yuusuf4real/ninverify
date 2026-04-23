import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "verifynin_session";
const ADMIN_LOGIN_PATH = "/sys-4a7404d6f114b5b0";
const USER_LOGIN_PATH = "/login";

type SessionPayload = {
  userId: string;
  email: string;
  fullName: string;
  role: "admin" | "super_admin" | "user";
};

// In-memory rate limit store for admin endpoints
const adminRateLimitStore = new Map<
  string,
  { count: number; resetAt: number }
>();

// Admin IP whitelist (in production, this should come from environment variables)
const ADMIN_IP_WHITELIST = process.env.ADMIN_IP_WHITELIST?.split(",") || [];

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify<SessionPayload>(token, secret);
    return payload;
  } catch {
    return null;
  }
}

function checkAdminRateLimit(userId: string): {
  allowed: boolean;
  retryAfter?: number;
} {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 50; // Reduced from 100 for better security

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    for (const [key, entry] of adminRateLimitStore.entries()) {
      if (now > entry.resetAt) {
        adminRateLimitStore.delete(key);
      }
    }
  }

  let entry = adminRateLimitStore.get(userId);

  // Create new entry if doesn't exist or expired
  if (!entry || now > entry.resetAt) {
    entry = {
      count: 0,
      resetAt: now + windowMs,
    };
    adminRateLimitStore.set(userId, entry);
  }

  // Increment count
  entry.count++;

  const allowed = entry.count <= maxRequests;
  const retryAfter = allowed
    ? undefined
    : Math.ceil((entry.resetAt - now) / 1000);

  return { allowed, retryAfter };
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const remoteAddr = request.headers.get("remote-addr");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  return realIP || remoteAddr || "unknown";
}

function isAdminIPAllowed(ip: string): boolean {
  // If no whitelist is configured, allow all IPs (for development)
  if (ADMIN_IP_WHITELIST.length === 0) {
    return true;
  }

  // Normalize IP address for comparison
  let normalizedIP = ip;

  // Handle IPv6-mapped IPv4 addresses (::ffff:127.0.0.1 -> 127.0.0.1)
  if (ip.startsWith("::ffff:")) {
    normalizedIP = ip.substring(7);
  }

  // Check both original and normalized IP
  const ipsToCheck = [ip, normalizedIP];

  // Also check common localhost variations
  if (
    normalizedIP === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1"
  ) {
    ipsToCheck.push("127.0.0.1", "::1", "::ffff:127.0.0.1", "localhost");
  }

  return ipsToCheck.some((checkIP) => ADMIN_IP_WHITELIST.includes(checkIP));
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;
  const clientIP = getClientIP(request);

  // Check if this is an admin route
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginRoute = pathname.startsWith("/sys-4a7404d6f114b5b0");

  // Admin IP whitelist check for admin routes and admin login
  if ((isAdminRoute || isAdminLoginRoute) && !isAdminIPAllowed(clientIP)) {
    // Log suspicious access attempt
    console.warn(
      `Blocked admin access attempt from unauthorized IP: ${clientIP} to ${pathname}`,
    );

    // Return 404 to hide the existence of admin routes
    return new NextResponse("Not Found", { status: 404 });
  }

  // Redirect authenticated admin users away from admin login page
  if (isAdminLoginRoute && token) {
    const session = await verifySession(token);
    if (
      session &&
      (session.role === "admin" || session.role === "super_admin")
    ) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    if (session && session.role === "user") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Require authentication for admin routes
  if (isAdminRoute) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = isAdminRoute ? ADMIN_LOGIN_PATH : USER_LOGIN_PATH;
      return NextResponse.redirect(url);
    }

    // Verify session
    const session = await verifySession(token);

    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = isAdminRoute ? ADMIN_LOGIN_PATH : USER_LOGIN_PATH;
      return NextResponse.redirect(url);
    }

    // Admin route protection - STRICT ENFORCEMENT
    if (isAdminRoute) {
      // Check if user has admin or super_admin role
      if (session.role !== "admin" && session.role !== "super_admin") {
        // Log unauthorized access attempt
        console.warn(
          `Unauthorized admin access attempt by user ${session.userId} (${session.email}) from IP ${clientIP}`,
        );

        // Redirect non-admin users to home page with clear error
        const url = request.nextUrl.clone();
        url.pathname = "/";
        url.searchParams.set("error", "unauthorized_admin_access");
        return NextResponse.redirect(url);
      }

      // Apply rate limiting for admin endpoints
      const rateLimit = checkAdminRateLimit(session.userId);

      if (!rateLimit.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many requests. Please try again later.",
              retryAfter: rateLimit.retryAfter,
            },
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(rateLimit.retryAfter || 60),
            },
          },
        );
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/admin/:path*", "/sys-4a7404d6f114b5b0"],
};
