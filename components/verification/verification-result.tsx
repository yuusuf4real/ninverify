"use client";

import { useState, useEffect, memo } from "react";
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
import { generateNINCertificate } from "@/lib/print-templates/nin-certificate";
import { useVerificationStore } from "@/store/verification-store";
import { useToast } from "@/store/ui-store";

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

interface VerificationResultProps {
  onComplete?: () => void;
}

export const VerificationResult = memo(function VerificationResult({
  onComplete,
}: VerificationResultProps) {
  // Store
  const sessionToken = useVerificationStore((state) => state.sessionToken);
  const reset = useVerificationStore((state) => state.reset);

  // Toast
  const toast = useToast();

  // Local state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState<VerificationData | null>(null);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [status, setStatus] = useState<string>("");
  const [downloading, setDownloading] = useState(false);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    let mounted = true;
    let interval: NodeJS.Timeout | null = null;

    const fetchResults = async () => {
      if (!mounted) return;

      try {
        setError("");

        const response = await fetch("/api/v2/verification/result", {
          headers: {
            Authorization: `Bearer ${sessionToken}`,
          },
        });

        const result = await response.json();

        if (!mounted) return;

        if (!response.ok) {
          throw new Error(result.error || "Failed to fetch results");
        }

        setStatus(result.status);

        if (result.status === "completed" && result.data) {
          setData(result.data);
          setSessionInfo(result.sessionInfo);
          setLoading(false);
          toast.success("Verification completed successfully!");
          // Stop polling when completed
          if (interval) clearInterval(interval);
        } else if (result.status === "failed") {
          setError("Verification failed. Please try again.");
          setLoading(false);
          toast.error("Verification failed. Please try again.");
          // Stop polling on failure
          if (interval) clearInterval(interval);
        }
        // Continue loading for other statuses
      } catch (err) {
        if (!mounted) return;
        setError(
          err instanceof Error ? err.message : "Failed to fetch results",
        );
        setLoading(false);
        // Stop polling on error
        if (interval) clearInterval(interval);
      }
    };

    // Initial fetch
    fetchResults();

    // Start polling - will auto-stop when completed/failed
    interval = setInterval(() => {
      fetchResults();
    }, 3000);

    return () => {
      mounted = false;
      if (interval) clearInterval(interval);
    };
  }, [sessionToken]);

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
      toast.info("Preparing certificate for download...");

      // Create printable document
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        throw new Error("Please allow popups to download results");
      }

      const printContent = generatePrintableDocument();
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();

      toast.success("Certificate ready for download!");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Download failed";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setDownloading(false);
    }
  };

  const generatePrintableDocument = () => {
    if (!data || !sessionInfo) return "";
    return generateNINCertificate(data, sessionInfo);
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
            onClick={() => {
              reset();
              toast.info("Starting new verification...");
            }}
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
          onClick={() => {
            reset();
            toast.info("Starting new verification...");
          }}
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
});
