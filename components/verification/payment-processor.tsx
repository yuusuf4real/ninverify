"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CreditCard,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";

// Declare Paystack types
declare global {
  interface Window {
    PaystackPop?: {
      setup: (config: {
        key: string;
        email: string;
        amount: number;
        ref: string;
        onClose: () => void;
        callback: (response: { reference: string }) => void;
      }) => {
        openIframe: () => void;
      };
    };
  }
}

interface PaymentProcessorProps {
  sessionToken: string;
  nin: string;
  dataLayer: string;
  amount: number;
  onComplete: () => void;
  onBack: () => void;
}

export function PaymentProcessor({
  sessionToken,
  nin,
  dataLayer,
  amount,
  onComplete,
  onBack,
}: PaymentProcessorProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Load Paystack script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://js.paystack.co/v1/inline.js";
    script.async = true;
    script.onload = () => setPaystackLoaded(true);
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const formatAmount = (amountInKobo: number) => {
    return (amountInKobo / 100).toLocaleString("en-NG", {
      style: "currency",
      currency: "NGN",
    });
  };

  const getDataLayerInfo = (layer: string) => {
    switch (layer) {
      case "demographic":
        return {
          title: "Demographic Data",
          description: "Basic identity information",
          fields: ["Full Name", "Date of Birth", "Phone Number", "Gender"],
        };
      case "biometric":
        return {
          title: "Biometric Data",
          description: "Identity with photo verification",
          fields: [
            "Full Name",
            "Date of Birth",
            "Phone Number",
            "Gender",
            "Photo",
            "Signature",
          ],
        };
      case "full":
        return {
          title: "Complete Profile",
          description: "All available information",
          fields: [
            "Full Name",
            "Date of Birth",
            "Phone Number",
            "Gender",
            "Photo",
            "Signature",
            "Full Address",
            "LGA",
            "State",
          ],
        };
      default:
        return {
          title: "Unknown",
          description: "",
          fields: [],
        };
    }
  };

  const initializePayment = async () => {
    try {
      setLoading(true);
      setError("");

      // Validate session token exists
      if (!sessionToken) {
        throw new Error("Session expired. Please start over.");
      }

      console.log(
        "[Payment] Initializing payment with token:",
        sessionToken.substring(0, 20) + "...",
      );
      console.log("[Payment] Amount:", amount, "Data layer:", dataLayer);

      const response = await fetch("/api/v2/payment/initialize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          amount,
          dataLayer,
        }),
      });

      console.log("[Payment] Response status:", response.status);

      const data = await response.json();
      console.log("[Payment] Response data:", data);

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      setPaymentReference(data.reference);

      // Store session token for callback page
      localStorage.setItem("sessionToken", sessionToken);
      sessionStorage.setItem("sessionToken", sessionToken);

      // Try inline first, fallback to redirect if it fails
      if (paystackLoaded && window.PaystackPop) {
        try {
          // Initialize Paystack inline popup
          const handler = window.PaystackPop.setup({
            key: data.publicKey,
            email: data.email,
            amount: amount,
            ref: data.reference,
            onClose: function () {
              setLoading(false);
              setError("Payment was cancelled. Please try again.");
            },
            callback: function (response: { reference: string }) {
              console.log("Payment successful:", response);
              // Payment successful, verify it
              verifyPayment(response.reference);
            },
          });

          // Open the Paystack modal
          handler.openIframe();
        } catch (inlineError) {
          console.warn(
            "Inline payment failed, falling back to redirect:",
            inlineError,
          );
          // Fallback to redirect with callback URL
          const callbackUrl = `${window.location.origin}/verification/callback`;
          const redirectUrl = `${data.authorizationUrl}&callback_url=${encodeURIComponent(callbackUrl)}`;
          window.location.href = redirectUrl;
        }
      } else {
        // Paystack not loaded, use redirect with callback
        const callbackUrl = `${window.location.origin}/verification/callback`;
        const redirectUrl = `${data.authorizationUrl}&callback_url=${encodeURIComponent(callbackUrl)}`;
        window.location.href = redirectUrl;
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Payment initialization failed",
      );
      setLoading(false);
    }
  };

  const verifyPayment = async (reference: string) => {
    try {
      setVerifying(true);
      setError("");

      const response = await fetch("/api/v2/payment/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
        },
        body: JSON.stringify({
          paymentReference: reference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment verification failed");
      }

      if (data.success && data.status === "completed") {
        // Payment successful, proceed to results
        onComplete();
      } else {
        setError("Payment was not successful. Please try again.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Payment verification failed",
      );
    } finally {
      setVerifying(false);
    }
  };

  const layerInfo = getDataLayerInfo(dataLayer);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0"
    >
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="flex justify-center">
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-primary/10">
            <CreditCard className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">Secure Payment</h2>
        <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
          Complete your payment to proceed with NIN verification
        </p>
      </div>

      {/* Order Summary */}
      <Card className="border-border/50">
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="font-semibold text-base sm:text-lg">
              Order Summary
            </h3>

            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                <div>
                  <p className="font-medium text-sm sm:text-base">
                    {layerInfo.title}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {layerInfo.description}
                  </p>
                </div>
                <p className="font-bold text-lg sm:text-xl">
                  {formatAmount(amount)}
                </p>
              </div>

              <div className="pt-3 border-t border-border/50">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                  NIN to verify:
                </p>
                <p className="font-mono text-base sm:text-lg break-all">
                  {nin}
                </p>
              </div>

              <div className="pt-3 border-t border-border/50">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-2">
                  Information included:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-1">
                  {layerInfo.fields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs sm:text-sm"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" />
                      <span>{field}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-3 sm:p-4">
          <div className="flex gap-2 sm:gap-3">
            <Shield className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs sm:text-sm text-blue-800">
              <p className="font-semibold mb-1">Secure Payment</p>
              <p>
                Your payment is processed securely through Paystack. We never
                store your card details and all transactions are encrypted.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 p-3 sm:p-4 rounded-lg bg-red-50 border border-red-200"
        >
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <p className="text-xs sm:text-sm text-red-800">{error}</p>
        </motion.div>
      )}

      {/* Payment Status */}
      {verifying && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-200"
        >
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin flex-shrink-0" />
          <p className="text-xs sm:text-sm text-blue-800 font-medium">
            Verifying payment and processing your request...
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading || verifying}
          className="w-full sm:flex-1 h-11 sm:h-12 gap-2 touch-manipulation"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Button
          onClick={initializePayment}
          disabled={loading || verifying}
          className="w-full sm:flex-1 h-11 sm:h-12 gap-2 touch-manipulation text-sm sm:text-base"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              Pay {formatAmount(amount)}
              <CreditCard className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {/* Payment Reference */}
      {paymentReference && (
        <div className="text-center text-xs text-muted-foreground break-all px-4 sm:px-0">
          <p>Payment Reference: {paymentReference}</p>
        </div>
      )}
    </motion.div>
  );
}
