import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { SessionManager } from "@/lib/session-manager";
import { DataLayerFilter } from "@/lib/data-layer-filter";
import { isValidNin, maskNin, normalizeNin } from "@/lib/nin";
import { logger } from "@/lib/security/secure-logger";
import { encrypt } from "@/lib/security/encryption";

const schema = z.object({
  nin: z.string(),
  dataLayer: z.enum(["demographic", "biometric", "full"]),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nin, dataLayer } = schema.parse(body);

    // Get session from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Missing or invalid session token" },
        { status: 401 },
      );
    }

    const sessionToken = authHeader.substring(7);
    const session = await SessionManager.verifySession(sessionToken);

    if (!session) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 },
      );
    }

    // Validate NIN
    const cleanNin = normalizeNin(nin);
    if (!isValidNin(cleanNin)) {
      return NextResponse.json(
        { error: "Please enter a valid 11-digit NIN" },
        { status: 400 },
      );
    }

    const maskedNin = maskNin(cleanNin);

    // Encrypt and temporarily store the actual NIN for verification
    const encryptedNin = encrypt(cleanNin);

    // Update session with NIN and data layer
    await SessionManager.updateSessionWithNIN(
      session.sessionId,
      maskedNin,
      dataLayer,
      encryptedNin, // Store encrypted NIN temporarily
    );

    // Get pricing for selected data layer
    const layerInfo = DataLayerFilter.getLayerDescription(dataLayer);

    return NextResponse.json({
      success: true,
      maskedNin,
      dataLayer,
      layerInfo,
      amount: layerInfo.price,
      message: "NIN and data layer saved. Proceed to payment.",
    });
  } catch (error) {
    logger.error("Verification submit error:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
