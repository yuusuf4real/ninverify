"use client";

import { useState } from "react";
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
  ExternalLink,
} from "lucide-react";

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
  const [paymentUrl, setPaymentUrl] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [verifying, setVerifying] = useState(false);

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Payment initialization failed");
      }

      setPaymentUrl(data.authorizationUrl);
      setPaymentReference(data.reference);

      // Open payment in new window
      const paymentWindow = window.open(
        data.authorizationUrl,
        "paystack-payment",
        "width=500,height=600,scrollbars=yes,resizable=yes",
      );

      // Poll for payment completion
      const pollPayment = setInterval(async () => {
        if (paymentWindow?.closed) {
          clearInterval(pollPayment);
          await verifyPayment(data.reference);
        }
      }, 1000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Payment initialization failed",
      );
    } finally {
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
      className="max-w-2xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-3 rounded-2xl bg-primary/10">
            <CreditCard className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Secure Payment</h2>
        <p className="text-muted-foreground">
          Complete your payment to proceed with NIN verification
        </p>
      </div>

      {/* Order Summary */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Order Summary</h3>

            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{layerInfo.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {layerInfo.description}
                  </p>
                </div>
                <p className="font-bold text-lg">{formatAmount(amount)}</p>
              </div>

              <div className="pt-3 border-t border-border/50">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  NIN to verify:
                </p>
                <p className="font-mono text-lg">{nin}</p>
              </div>

              <div className="pt-3 border-t border-border/50">
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Information included:
                </p>
                <div className="grid grid-cols-2 gap-1">
                  {layerInfo.fields.map((field, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
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
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Shield className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
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
          className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200"
        >
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </motion.div>
      )}

      {/* Payment Status */}
      {verifying && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 p-4 rounded-lg bg-blue-50 border border-blue-200"
        >
          <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
          <p className="text-sm text-blue-800 font-medium">
            Verifying payment and processing your request...
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading || verifying}
          className="flex-1 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {!paymentUrl ? (
          <Button
            onClick={initializePayment}
            disabled={loading || verifying}
            className="flex-1 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                Pay {formatAmount(amount)}
                <ExternalLink className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            onClick={() =>
              window.open(
                paymentUrl,
                "paystack-payment",
                "width=500,height=600",
              )
            }
            disabled={verifying}
            className="flex-1 gap-2"
          >
            Open Payment Window
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Payment Reference */}
      {paymentReference && (
        <div className="text-center text-xs text-muted-foreground">
          <p>Payment Reference: {paymentReference}</p>
        </div>
      )}
    </motion.div>
  );
}
