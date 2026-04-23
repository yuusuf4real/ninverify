"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function PaymentCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      const reference = searchParams.get("reference");
      const trxref = searchParams.get("trxref");

      // Use either reference or trxref (Paystack sends both)
      const paymentReference = reference || trxref;

      if (!paymentReference) {
        setStatus("error");
        setMessage("No payment reference found. Please try again.");
        return;
      }

      try {
        // Get session token from localStorage or sessionStorage
        const sessionToken =
          localStorage.getItem("sessionToken") ||
          sessionStorage.getItem("sessionToken");

        if (!sessionToken) {
          setStatus("error");
          setMessage("Session expired. Please start over.");
          return;
        }

        // Verify payment
        const response = await fetch("/api/v2/payment/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({
            paymentReference,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Payment verification failed");
        }

        if (data.success && data.status === "completed") {
          setStatus("success");
          setMessage("Payment successful! Redirecting to results...");

          // Redirect to verification results after a short delay
          setTimeout(() => {
            router.push("/?step=result");
          }, 2000);
        } else {
          setStatus("error");
          setMessage("Payment was not successful. Please try again.");
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          error instanceof Error
            ? error.message
            : "Payment verification failed",
        );
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <Card className="border-border/50">
          <CardContent className="p-8 text-center">
            {status === "loading" && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-2xl bg-blue-50">
                    <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-2">Processing Payment</h2>
                <p className="text-muted-foreground">
                  Please wait while we verify your payment...
                </p>
              </>
            )}

            {status === "success" && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-2xl bg-emerald-50">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-2 text-emerald-600">
                  Payment Successful
                </h2>
                <p className="text-muted-foreground mb-4">{message}</p>
                <div className="animate-pulse text-sm text-muted-foreground">
                  Redirecting...
                </div>
              </>
            )}

            {status === "error" && (
              <>
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-2xl bg-red-50">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-2 text-red-600">
                  Payment Failed
                </h2>
                <p className="text-muted-foreground mb-4">{message}</p>
                <div className="space-y-2">
                  <Button onClick={() => router.push("/")} className="w-full">
                    Try Again
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/")}
                    className="w-full"
                  >
                    Go Home
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
