"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { RefreshCw, AlertCircle, CheckCircle2, Info, ArrowLeft } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/format";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function RecoveryPage() {
  const [reference, setReference] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<{
    status: "success" | "error" | "info";
    message: string;
    details?: {
      amount?: number;
      status?: string;
      previousBalance?: number;
      newBalance?: number;
    };
  } | null>(null);

  const handleCheckPayment = async () => {
    if (!reference.trim()) {
      setResult({
        status: "error",
        message: "Please enter a payment reference"
      });
      return;
    }

    setChecking(true);
    setResult(null);

    try {
      const res = await fetch("/api/wallet/check-pending-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({
          status: "error",
          message: data.message || "Failed to check payment status"
        });
      } else {
        setResult({
          status: "success",
          message: data.message,
          details: {
            amount: data.amount,
            status: data.status,
            previousBalance: data.previousBalance,
            newBalance: data.newBalance
          }
        });
        setReference("");
      }
    } catch {
      setResult({
        status: "error",
        message: "Network error. Please check your connection and try again."
      });
    } finally {
      setChecking(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={fadeIn}
      className="mx-auto max-w-3xl space-y-6"
    >
      {/* Header */}
      <div className="space-y-2">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100">
            <RefreshCw className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">Payment Recovery</h1>
            <p className="text-sm text-muted-foreground">
              Recover wallet top-ups that didn&apos;t reflect after payment
            </p>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex gap-3">
            <Info className="h-5 w-5 shrink-0 text-blue-600" />
            <div className="space-y-2 text-sm text-blue-900">
              <p className="font-semibold">When to use this tool:</p>
              <ul className="ml-4 list-disc space-y-1 text-blue-800">
                <li>You completed payment but your wallet balance didn&apos;t update</li>
                <li>You were debited but the transaction shows as pending</li>
                <li>Your internet connection dropped during payment verification</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recovery Form */}
      <Card className="border-border/50 shadow-md">
        <CardContent className="p-6 sm:p-8">
          <div className="space-y-6">
            <div>
              <h2 className="mb-4 text-xl font-bold">Check Payment Status</h2>
              <p className="text-sm text-muted-foreground">
                Enter your Paystack payment reference to check if the payment was successful and update your wallet balance.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="reference" className="text-sm font-semibold">
                  Payment Reference
                </label>
                <Input
                  id="reference"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="e.g., T123456789"
                  className="h-12 text-base"
                  disabled={checking}
                />
                <p className="text-xs text-muted-foreground">
                  You can find this in your payment confirmation email or bank statement
                </p>
              </div>

              <Button
                onClick={handleCheckPayment}
                disabled={checking || !reference.trim()}
                size="lg"
                className="h-12 w-full font-semibold"
              >
                {checking ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5" />
                    Check Payment Status
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Card */}
      {result && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Card
            className={`border-2 ${
              result.status === "success"
                ? "border-emerald-200 bg-emerald-50"
                : result.status === "info"
                ? "border-blue-200 bg-blue-50"
                : "border-red-200 bg-red-50"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                    result.status === "success"
                      ? "bg-emerald-100"
                      : result.status === "info"
                      ? "bg-blue-100"
                      : "bg-red-100"
                  }`}
                >
                  {result.status === "success" ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  ) : result.status === "info" ? (
                    <Info className="h-5 w-5 text-blue-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-semibold ${
                      result.status === "success"
                        ? "text-emerald-900"
                        : result.status === "info"
                        ? "text-blue-900"
                        : "text-red-900"
                    }`}
                  >
                    {result.status === "success"
                      ? "Payment Recovered!"
                      : result.status === "info"
                      ? "Information"
                      : "Unable to Recover"}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      result.status === "success"
                        ? "text-emerald-800"
                        : result.status === "info"
                        ? "text-blue-800"
                        : "text-red-800"
                    }`}
                  >
                    {result.message}
                  </p>

                  {result.details && result.status === "success" && (
                    <div className="mt-4 space-y-2 rounded-lg bg-white/50 p-4 text-sm">
                      {result.details.amount && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-semibold">{formatNaira(result.details.amount)}</span>
                        </div>
                      )}
                      {result.details.previousBalance !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Previous Balance:</span>
                          <span className="font-semibold">{formatNaira(result.details.previousBalance)}</span>
                        </div>
                      )}
                      {result.details.newBalance !== undefined && (
                        <div className="flex justify-between border-t border-emerald-200 pt-2">
                          <span className="font-semibold text-emerald-900">New Balance:</span>
                          <span className="font-bold text-emerald-900">{formatNaira(result.details.newBalance)}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {result.status === "success" && (
                    <Button asChild size="sm" className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                      <Link href="/dashboard">View Dashboard</Link>
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Help Section */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="mb-4 font-semibold">Still Having Issues?</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>If the automatic recovery doesn&apos;t work, you can:</p>
            <div className="space-y-2">
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  1
                </div>
                <p>Wait a few minutes and try again (payments can take time to process)</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  2
                </div>
                <p>Check your bank statement to confirm the debit</p>
              </div>
              <div className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                  3
                </div>
                <p>
                  Contact our support team at{" "}
                  <a href="mailto:support@verifynin.ng" className="font-semibold text-primary hover:underline">
                    support@verifynin.ng
                  </a>{" "}
                  with your payment reference
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Where to Find Reference */}
      <Card className="border-border/50">
        <CardContent className="p-6">
          <h3 className="mb-4 font-semibold">Where to Find Your Payment Reference</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="mb-2 font-semibold text-sm">Email Confirmation</p>
              <p className="text-xs text-muted-foreground">
                Check your email for a payment confirmation from Paystack. The reference is usually in the subject or body.
              </p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/30 p-4">
              <p className="mb-2 font-semibold text-sm">Bank Statement</p>
              <p className="text-xs text-muted-foreground">
                Look for the transaction in your bank app or statement. The reference may appear as &quot;Paystack&quot; followed by numbers.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
