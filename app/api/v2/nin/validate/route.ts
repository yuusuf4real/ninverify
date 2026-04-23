import { NextRequest, NextResponse } from "next/server";
import { NINValidationService } from "@/lib/nin-validation";
import { logger } from "@/lib/security/secure-logger";

export async function POST(request: NextRequest) {
  try {
    const { nin } = await request.json();

    if (!nin) {
      return NextResponse.json({ error: "NIN is required" }, { status: 400 });
    }

    // Validate NIN
    const validation = await NINValidationService.validateNIN(nin);

    logger.info("NIN validation request", {
      nin: nin.substring(0, 3) + "****" + nin.substring(7), // Masked for security
      isValid: validation.isValid,
      exists: validation.exists,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.error,
          isValid: false,
          exists: false,
        },
        { status: 400 },
      );
    }

    if (!validation.exists) {
      return NextResponse.json(
        {
          error:
            "NIN does not exist in NIMC database. Please verify your NIN and try again.",
          isValid: true,
          exists: false,
          message: validation.message,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      isValid: true,
      exists: true,
      message: validation.message || "NIN is valid and exists in NIMC database",
    });
  } catch (error) {
    logger.error("NIN validation endpoint error", {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: "Internal server error during NIN validation" },
      { status: 500 },
    );
  }
}
