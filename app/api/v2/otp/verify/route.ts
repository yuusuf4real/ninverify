import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OTPService } from "@/lib/otp-service";
import { SessionManager } from "@/lib/session-manager";

const schema = z.object({
  sessionId: z.string(),
  otpCode: z.string().length(6),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, otpCode } = schema.parse(body);

    const otpService = new OTPService();
    const result = await otpService.verifyOTP(sessionId, otpCode);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    // Create verification session
    const clientIP = request.ip || request.headers.get("x-forwarded-for") || "unknown";
    const userAgent = request.headers.get("user-agent") || undefined;

    const session = await SessionManager.createSession(
      result.phoneNumber!,
      sessionId,
      clientIP,
      userAgent
    );

    return NextResponse.json({
      success: true,
      sessionToken: session.sessionToken,
      message: "OTP verified successfully",
    });

  } catch (error) {
    console.error("OTP verify error:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}