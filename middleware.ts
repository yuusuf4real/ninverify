import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "verifynin_session";

type SessionPayload = {
  userId: string;
  email: string;
  fullName: string;
  role: "admin" | "super_admin" | "user";
};

// In-memory rate limit store for admin endpoints
const adminRateLimitStore = new Map<string, { count: number; resetAt: number }>();

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
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

function checkAdminRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 100;
  
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
      resetAt: now + windowMs
    };
    adminRateLimitStore.set(userId, entry);
  }
  
  // Increment count
  entry.count++;
  
  const allowed = entry.count <= maxRequests;
  const retryAfter = allowed ? undefined : Math.ceil((entry.resetAt - now) / 1000);
  
  return { allowed, retryAfter };
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const pathname = request.nextUrl.pathname;
  
  // Check if this is an admin route
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLoginPage = false; // Admin login is now handled by route groups
  
  // Skip middleware for admin login page
  if (isAdminLoginPage) {
    return NextResponse.next();
  }
  
  // Require authentication for dashboard and admin routes
  if (pathname.startsWith("/dashboard") || isAdminRoute) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = isAdminRoute ? "/admin-login" : "/login";
      return NextResponse.redirect(url);
    }
    
    // Verify session
    const session = await verifySession(token);
    
    if (!session) {
      const url = request.nextUrl.clone();
      url.pathname = isAdminRoute ? "/admin-login" : "/login";
      return NextResponse.redirect(url);
    }
    
    // Admin route protection
    if (isAdminRoute) {
      // Check if user has admin or super_admin role
      if (session.role !== "admin" && session.role !== "super_admin") {
        // Redirect non-admin users to dashboard with 401 status
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        const response = NextResponse.redirect(url);
        response.headers.set("X-Auth-Error", "Unauthorized");
        return response;
      }
      
      // Apply rate limiting for admin endpoints (100 req/min)
      const rateLimit = checkAdminRateLimit(session.userId);
      
      if (!rateLimit.allowed) {
        return new NextResponse(
          JSON.stringify({
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Too many requests. Please try again later.",
              retryAfter: rateLimit.retryAfter
            }
          }),
          {
            status: 429,
            headers: {
              "Content-Type": "application/json",
              "Retry-After": String(rateLimit.retryAfter || 60)
            }
          }
        );
      }
    }
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"]
};
