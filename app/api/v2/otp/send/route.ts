import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OTPService } from "@/lib/otp-service";
import { rateLimitMiddleware, RATE_LIMITS } from "@/lib/rate-limit";

const schema = z.object({
  phoneNumber: z.string().min(10).max(15),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = schema.parse(body);

    // Rate limiting by IP
    const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown";
    const rateLimitResult = rateLimitMiddleware(
      `otp-send:${clientIP}`,
      { requests: 3, windowMs: 60000 }, // 3 requests per minute
      "/api/v2/otp/send"
    );

    if (rateLimitResult) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        { status: rateLimitResult.status }
      );
    }

    const otpService = new OTPService();
    const result = await otpService.sendOTP(
      phoneNumber,
      clientIP,
      request.headers.get("user-agent") || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: result.sessionId,
      message: "OTP sent successfully",
    });

  } catch (error) {
    console.error("OTP send error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}