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

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>NIN Verification Result</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 24px; font-weight: bold; color: #2563eb; }
            .field { margin: 15px 0; display: flex; }
            .label { font-weight: bold; width: 150px; }
            .value { flex: 1; }
            .section { margin: 30px 0; }
            .section-title { font-size: 18px; font-weight: bold; border-bottom: 1px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            .photo { max-width: 150px; max-height: 200px; border: 1px solid #ccc; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="logo">VerifyNIN</div>
            <h2>National Identity Number Verification Result</h2>
          </div>

          <div class="section">
            <div class="section-title">Verification Details</div>
            <div class="field">
              <div class="label">Verification ID:</div>
              <div class="value">${sessionInfo.sessionId}</div>
            </div>
            <div class="field">
              <div class="label">Date:</div>
              <div class="value">${formatDate(sessionInfo.verificationDate)}</div>
            </div>
            <div class="field">
              <div class="label">Data Layer:</div>
              <div class="value">${data.dataLayer.charAt(0).toUpperCase() + data.dataLayer.slice(1)}</div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Personal Information</div>
            <div class="field">
              <div class="label">Full Name:</div>
              <div class="value">${data.fullName}</div>
            </div>
            <div class="field">
              <div class="label">Date of Birth:</div>
              <div class="value">${formatDate(data.dateOfBirth)}</div>
            </div>
            <div class="field">
              <div class="label">Gender:</div>
              <div class="value">${data.gender}</div>
            </div>
            <div class="field">
              <div class="label">Phone Number:</div>
              <div class="value">${data.phoneFromNimc}</div>
            </div>
          </div>

          ${
            data.photoUrl
              ? `
            <div class="section">
              <div class="section-title">Biometric Data</div>
              <div class="field">
                <div class="label">Photograph:</div>
                <div class="value"><img src="${data.photoUrl}" alt="NIN Photo" class="photo" /></div>
              </div>
            </div>
          `
              : ""
          }

          ${
            data.address
              ? `
            <div class="section">
              <div class="section-title">Address Information</div>
              <div class="field">
                <div class="label">Address:</div>
                <div class="value">${data.address.addressLine}</div>
              </div>
              <div class="field">
                <div class="label">Town:</div>
                <div class="value">${data.address.town}</div>
              </div>
              <div class="field">
                <div class="label">LGA:</div>
                <div class="value">${data.address.lga}</div>
              </div>
              <div class="field">
                <div class="label">State:</div>
                <div class="value">${data.address.state}</div>
              </div>
            </div>
          `
              : ""
          }

          <div class="footer">
            <p>This document was generated on ${new Date().toLocaleString("en-NG")} from official NIMC records.</p>
            <p>Verification performed by VerifyNIN - Authorized NIMC Data Partner</p>
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
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-blue-50">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Processing Verification</h2>
          <p className="text-muted-foreground">{getStatusMessage(status)}</p>
        </div>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6 text-center">
            <p className="text-blue-800">
              Please wait while we verify your NIN with NIMC. This usually takes
              10-30 seconds.
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  if (error || status === "failed") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-2xl bg-red-50">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold">Verification Failed</h2>
          <p className="text-muted-foreground">
            {error ||
              "We couldn't complete your verification. Please try again."}
          </p>
        </div>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={fetchResults}
            className="flex-1 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
          <Button onClick={onStartOver} className="flex-1 gap-2">
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
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Success Header */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="p-3 rounded-2xl bg-emerald-50">
            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Verification Successful</h2>
        <p className="text-muted-foreground">
          Your NIN has been successfully verified with NIMC
        </p>
      </div>

      {/* Results */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Personal Information */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">Personal Information</h3>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Full Name:</span>
                  <span className="font-medium">{data.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="font-medium">
                    {new Date(data.dateOfBirth).toLocaleDateString("en-NG")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="font-medium">{data.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{data.phoneFromNimc}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Biometric Data */}
        {(data.photoUrl || data.signatureUrl) && (
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Camera className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Biometric Data</h3>
                </div>

                {data.photoUrl && (
                  <div className="text-center">
                    <Image
                      src={data.photoUrl}
                      alt="NIN Photo"
                      width={128}
                      height={160}
                      className="mx-auto max-w-32 max-h-40 rounded-lg border border-border"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
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
                      className="mx-auto max-w-40 max-h-20 rounded border border-border"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
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
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-lg">Address Information</h3>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium text-right">
                      {data.address.addressLine}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Town:</span>
                    <span className="font-medium">{data.address.town}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">LGA:</span>
                    <span className="font-medium">{data.address.lga}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">State:</span>
                    <span className="font-medium">{data.address.state}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Verification Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Verification Details</p>
              <div className="space-y-1">
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
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onStartOver}
          className="flex-1 gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Verify Another NIN
        </Button>

        <Button
          onClick={downloadResults}
          disabled={downloading}
          className="flex-1 gap-2"
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
