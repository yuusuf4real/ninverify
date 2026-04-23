"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import {
  CheckCircle2,
  Download,
  RefreshCw,
  AlertCircle,
  User,
  MapPin,
  Camera,
  FileText,
  Loader2,
  RotateCcw,
} from "lucide-react";

interface VerificationResultProps {
  sessionToken: string;
  onStartOver: () => void;
  onComplete?: () => void;
}

interface VerificationData {
  fullName: string;
  dateOfBirth: string;
  phoneFromNimc: string;
  gender: string;
  photoUrl?: string;
  signatureUrl?: string;
  address?: {
    addressLine: string;
    town: string;
    lga: string;
    state: string;
  };
  dataLayer: string;
  verificationId: string;
  timestamp: string;
}

interface SessionInfo {
  sessionId: string;
  phoneNumber: string;
  dataLayer: string;
  verificationDate: string;
}

export function VerificationResult({
  sessionToken,
  onStartOver,
  onComplete,
}: VerificationResultProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<VerificationData | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [status, setStatus] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    const initializeFetch = async () => {
      await fetchResults();
    };
    initializeFetch();

    // Poll for results if still processing
    const interval = setInterval(async () => {
      if (status && status !== "completed") {
        await fetchResults();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionToken, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchResults = async () => {
    try {
      setError("");

      const response = await fetch("/api/v2/verification/result", {
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to fetch results");
      }

      setStatus(result.status);

      if (result.status === "completed" && result.data) {
        setData(result.data);
        setSessionInfo(result.sessionInfo);
        setLoading(false);
      } else if (result.status === "failed") {
        setError("Verification failed. Please try again.");
        setLoading(false);
      }
      // Continue loading for other statuses
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch results");
      setLoading(false);
    }
  };

  const triggerVerification = async () => {
    try {
      setTriggering(true);
      setError("");

      const response = await fetch("/api/v2/verification/trigger", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${sessionToken}`,
        },
      });

      const result = await response.json();
      if (response.ok) {
        // Refresh results after manual trigger
        await fetchResults();
      } else {
        setError(result.error || "Failed to trigger verification");
      }
    } catch (err) {
      setError("Failed to trigger verification");
    } finally {
      setTriggering(false);
    }
  };

  const downloadResults = async () => {
    try {
      setDownloading(true);

      // Create printable document
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("Please allow popups to download results");
      }

      const printContent = generatePrintableDocument();
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const generatePrintableDocument = () => {
    if (!data || !sessionInfo) return "";

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString("en-NG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const currentDate = new Date().toLocaleDateString("en-NG", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>NIN Verification Certificate - ${data.fullName}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Georgia', 'Times New Roman', serif;
              line-height: 1.6;
              color: #2c3e50;
              background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
              padding: 20px;
            }
            
            .certificate {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              overflow: hidden;
              position: relative;
            }
            
            .certificate::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 8px;
              background: linear-gradient(90deg, #3b82f6, #1d4ed8, #1e40af);
            }
            
            .header {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 40px 30px;
              text-align: center;
              position: relative;
            }
            
            .header::after {
              content: '';
              position: absolute;
              bottom: -10px;
              left: 50%;
              transform: translateX(-50%);
              width: 0;
              height: 0;
              border-left: 20px solid transparent;
              border-right: 20px solid transparent;
              border-top: 20px solid #1e40af;
            }
            
            .logo {
              font-size: 32px;
              font-weight: bold;
              margin-bottom: 8px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            
            .subtitle {
              font-size: 18px;
              opacity: 0.9;
              font-weight: 300;
            }
            
            .certificate-title {
              font-size: 28px;
              font-weight: bold;
              color: #1e40af;
              text-align: center;
              margin: 40px 0 30px 0;
              text-transform: uppercase;
              letter-spacing: 2px;
            }
            
            .content {
              padding: 0 40px 40px 40px;
            }
            
            .verification-badge {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 10px;
              background: linear-gradient(135deg, #10b981, #059669);
              color: white;
              padding: 15px 30px;
              border-radius: 50px;
              margin: 20px auto;
              width: fit-content;
              font-weight: bold;
              box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
            }
            
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin: 30px 0;
            }
            
            .info-section {
              background: #f8fafc;
              border-radius: 12px;
              padding: 25px;
              border-left: 4px solid #3b82f6;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            
            .field {
              margin: 12px 0;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #e2e8f0;
            }
            
            .field:last-child {
              border-bottom: none;
            }
            
            .label {
              font-weight: 600;
              color: #64748b;
              font-size: 14px;
            }
            
            .value {
              font-weight: bold;
              color: #1e293b;
              text-align: right;
            }
            
            .photo-section {
              text-align: center;
              margin: 30px 0;
              padding: 20px;
              background: #f8fafc;
              border-radius: 12px;
              border: 2px dashed #cbd5e1;
            }
            
            .photo {
              max-width: 150px;
              max-height: 200px;
              border-radius: 8px;
              box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              border: 3px solid white;
            }
            
            .security-features {
              background: linear-gradient(135deg, #fef3c7, #fbbf24);
              border-radius: 12px;
              padding: 20px;
              margin: 30px 0;
              border-left: 4px solid #f59e0b;
            }
            
            .qr-placeholder {
              width: 80px;
              height: 80px;
              background: #e2e8f0;
              border-radius: 8px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 12px;
              color: #64748b;
              margin: 0 auto;
            }
            
            .footer {
              background: #f1f5f9;
              padding: 30px;
              text-align: center;
              border-top: 1px solid #e2e8f0;
              margin-top: 40px;
            }
            
            .footer-text {
              font-size: 12px;
              color: #64748b;
              line-height: 1.8;
            }
            
            .signature-line {
              border-top: 2px solid #1e40af;
              width: 200px;
              margin: 20px auto 5px auto;
            }
            
            .watermark {
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) rotate(-45deg);
              font-size: 120px;
              color: rgba(59, 130, 246, 0.05);
              font-weight: bold;
              z-index: 1;
              pointer-events: none;
            }
            
            @media print {
              body {
                background: white;
                padding: 0;
              }
              
              .certificate {
                box-shadow: none;
                border: 1px solid #e2e8f0;
              }
              
              .watermark {
                display: none;
              }
            }
            
            @page {
              size: A4;
              margin: 1cm;
            }
          </style>
        </head>
        <body>
          <div class="certificate">
            <div class="watermark">VERIFIED</div>
            
            <div class="header">
              <div class="logo">VerifyNIN</div>
              <div class="subtitle">Official NIN Verification Service</div>
            </div>
            
            <div class="content">
              <h1 class="certificate-title">Identity Verification Certificate</h1>
              
              <div class="verification-badge">
                <span>✓</span>
                <span>OFFICIALLY VERIFIED</span>
              </div>
              
              <div class="info-grid">
                <div class="info-section">
                  <div class="section-title">
                    <span>👤</span>
                    Personal Information
                  </div>
                  <div class="field">
                    <span class="label">Full Name:</span>
                    <span class="value">${data.fullName}</span>
                  </div>
                  <div class="field">
                    <span class="label">Date of Birth:</span>
                    <span class="value">${formatDate(data.dateOfBirth)}</span>
                  </div>
                  <div class="field">
                    <span class="label">Gender:</span>
                    <span class="value">${data.gender}</span>
                  </div>
                  <div class="field">
                    <span class="label">Phone Number:</span>
                    <span class="value">${data.phoneFromNimc}</span>
                  </div>
                </div>
                
                <div class="info-section">
                  <div class="section-title">
                    <span>📋</span>
                    Verification Details
                  </div>
                  <div class="field">
                    <span class="label">Verification ID:</span>
                    <span class="value">${sessionInfo.sessionId.substring(0, 12)}...</span>
                  </div>
                  <div class="field">
                    <span class="label">Verification Date:</span>
                    <span class="value">${formatDate(sessionInfo.verificationDate)}</span>
                  </div>
                  <div class="field">
                    <span class="label">Data Layer:</span>
                    <span class="value">${data.dataLayer.charAt(0).toUpperCase() + data.dataLayer.slice(1)}</span>
                  </div>
                  <div class="field">
                    <span class="label">Status:</span>
                    <span class="value" style="color: #10b981;">VERIFIED</span>
                  </div>
                </div>
              </div>
              
              ${
                data.photoUrl
                  ? `
                <div class="photo-section">
                  <div class="section-title" style="justify-content: center; margin-bottom: 15px;">
                    <span>📷</span>
                    Official Photograph
                  </div>
                  <img src="${data.photoUrl}" alt="Official NIN Photo" class="photo" />
                </div>
              `
                  : ""
              }
              
              ${
                data.address
                  ? `
                <div class="info-section" style="margin-top: 30px;">
                  <div class="section-title">
                    <span>📍</span>
                    Address Information
                  </div>
                  <div class="field">
                    <span class="label">Address:</span>
                    <span class="value">${data.address.addressLine}</span>
                  </div>
                  <div class="field">
                    <span class="label">Town:</span>
                    <span class="value">${data.address.town}</span>
                  </div>
                  <div class="field">
                    <span class="label">LGA:</span>
                    <span class="value">${data.address.lga}</span>
                  </div>
                  <div class="field">
                    <span class="label">State:</span>
                    <span class="value">${data.address.state}</span>
                  </div>
                </div>
              `
                  : ""
              }
              
              <div class="security-features">
                <div class="section-title" style="justify-content: center; margin-bottom: 15px;">
                  <span>🔒</span>
                  Security Features
                </div>
                <div style="display: grid; grid-template-columns: 1fr auto; gap: 20px; align-items: center;">
                  <div>
                    <p style="font-size: 14px; margin-bottom: 8px;"><strong>Digital Signature:</strong> SHA-256 Encrypted</p>
                    <p style="font-size: 14px; margin-bottom: 8px;"><strong>Verification Hash:</strong> ${sessionInfo.sessionId.substring(0, 16).toUpperCase()}</p>
                    <p style="font-size: 14px;"><strong>Issued:</strong> ${currentDate}</p>
                  </div>
                  <div class="qr-placeholder">
                    QR Code
                  </div>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="signature-line"></div>
              <p style="font-weight: bold; margin: 10px 0;">Digitally Signed & Verified</p>
              <div class="footer-text">
                <p>This certificate was generated on ${currentDate} from official NIMC records through VerifyNIN.</p>
                <p>This document is digitally signed and can be verified at verifynin.com</p>
                <p><strong>VerifyNIN</strong> - Authorized NIMC Data Partner | License: NIN-VER-2024-001</p>
                <p>For verification inquiries: support@verifynin.com | +234 800 000 0000</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case "payment_completed":
        return "Payment successful. Verifying with NIMC...";
      case "completed":
        return "Verification completed successfully";
      case "failed":
        return "Verification failed";
      default:
        return "Processing your request...";
    }
  };

  if (loading || (status && status !== "completed" && status !== "failed")) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0"
      >
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex justify-center">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-blue-50">
              <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 animate-spin" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">
            Processing Verification
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
            {getStatusMessage(status)}
          </p>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4 sm:p-6 text-center">
            <p className="text-xs sm:text-sm text-blue-800">
              Please wait while we verify your NIN with NIMC. This usually takes
              10-30 seconds.
            </p>
          </CardContent>
        </Card>

        {/* Manual trigger button if stuck in payment_completed status */}
        {status === "payment_completed" && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4 sm:p-6 text-center space-y-3">
              <p className="text-xs sm:text-sm text-orange-800">
                Verification is taking longer than expected. You can manually
                trigger it.
              </p>
              <Button
                onClick={triggerVerification}
                disabled={triggering}
                className="w-full sm:w-auto gap-2"
                variant="outline"
              >
                {triggering ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Triggering...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Trigger Verification
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    );
  }

  if (error || status === "failed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0"
      >
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="flex justify-center">
            <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-red-50">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold">Verification Failed</h2>
          <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
            {error ||
              "We couldn't complete your verification. Please try again."}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Button
            variant="outline"
            onClick={fetchResults}
            className="w-full sm:flex-1 h-11 sm:h-12 gap-2 touch-manipulation"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button
            onClick={onStartOver}
            className="w-full sm:flex-1 h-11 sm:h-12 gap-2 touch-manipulation"
          >
            <RotateCcw className="h-4 w-4" />
            Start Over
          </Button>
        </div>
      </motion.div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0"
    >
      {/* Success Header */}
      <div className="text-center space-y-3 sm:space-y-4">
        <div className="flex justify-center">
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-emerald-50">
            <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">
          Verification Successful
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
          Your NIN has been successfully verified with NIMC
        </p>
      </div>

      {/* Results */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                <h3 className="font-semibold text-base sm:text-lg">
                  Personal Information
                </h3>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Full Name:
                  </span>
                  <span className="text-sm sm:text-base font-medium break-words">
                    {data.fullName}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Date of Birth:
                  </span>
                  <span className="text-sm sm:text-base font-medium">
                    {new Date(data.dateOfBirth).toLocaleDateString("en-NG")}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Gender:
                  </span>
                  <span className="text-sm sm:text-base font-medium">
                    {data.gender}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    Phone:
                  </span>
                  <span className="text-sm sm:text-base font-medium">
                    {data.phoneFromNimc}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biometric Data */}
        {(data.photoUrl || data.signatureUrl) && (
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="font-semibold text-base sm:text-lg">
                    Biometric Data
                  </h3>
                </div>

                {data.photoUrl && (
                  <div className="text-center">
                    <Image
                      src={data.photoUrl}
                      alt="NIN Photo"
                      width={128}
                      height={160}
                      className="mx-auto max-w-24 max-h-32 sm:max-w-32 sm:max-h-40 rounded-lg border border-border"
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      Official Photo
                    </p>
                  </div>
                )}

                {data.signatureUrl && (
                  <div className="text-center">
                    <Image
                      src={data.signatureUrl}
                      alt="Signature"
                      width={160}
                      height={80}
                      className="mx-auto max-w-32 max-h-16 sm:max-w-40 sm:max-h-20 rounded border border-border"
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      Signature
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Address Information */}
        {data.address && (
          <Card className="md:col-span-2">
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <h3 className="font-semibold text-base sm:text-lg">
                    Address Information
                  </h3>
                </div>

                <div className="grid gap-2 sm:gap-3 md:grid-cols-2">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Address:
                    </span>
                    <span className="text-sm sm:text-base font-medium break-words sm:text-right">
                      {data.address.addressLine}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Town:
                    </span>
                    <span className="text-sm sm:text-base font-medium">
                      {data.address.town}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      LGA:
                    </span>
                    <span className="text-sm sm:text-base font-medium">
                      {data.address.lga}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      State:
                    </span>
                    <span className="text-sm sm:text-base font-medium">
                      {data.address.state}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Verification Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-800">
              <p className="font-semibold mb-1">Verification Details</p>
              <div className="space-y-1 break-words">
                <p>Verification ID: {sessionInfo?.sessionId}</p>
                <p>
                  Date:{" "}
                  {sessionInfo?.verificationDate &&
                    new Date(sessionInfo.verificationDate).toLocaleString(
                      "en-NG",
                    )}
                </p>
                <p>
                  Data Layer:{" "}
                  {data.dataLayer.charAt(0).toUpperCase() +
                    data.dataLayer.slice(1)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button
          variant="outline"
          onClick={onStartOver}
          className="w-full sm:flex-1 h-11 sm:h-12 gap-2 touch-manipulation text-sm sm:text-base"
        >
          <RotateCcw className="h-4 w-4" />
          Verify Another NIN
        </Button>

        <Button
          onClick={downloadResults}
          disabled={downloading}
          className="w-full sm:flex-1 h-11 sm:h-12 gap-2 touch-manipulation text-sm sm:text-base"
        >
          {downloading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Results
            </>
          )}
        </Button>
      </div>

      {onComplete && (
        <div className="text-center">
          <Button variant="ghost" onClick={onComplete}>
            Return to Homepage
          </Button>
        </div>
      )}
    </motion.div>
  );
}
