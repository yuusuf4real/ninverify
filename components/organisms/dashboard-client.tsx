"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  Fingerprint,
  History,
  Info,
  Plus,
  RefreshCw,
  Shield,
  Wallet,
  Zap,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AnimatedLogoLoader } from "@/components/ui/animated-logo-loader";
import { formatNaira } from "@/lib/format";
import { NIN_VERIFICATION_COST_KOBO } from "@/lib/constants";

import { getFriendlyErrorMessage } from "@/lib/utils";

const feeKobo = NIN_VERIFICATION_COST_KOBO;

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

export function DashboardClient() {
  const [balance, setBalance] = useState<number | null>(null);
  const [amount, setAmount] = useState("500");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [nin, setNin] = useState("");
  const [consent, setConsent] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [result, setResult] = useState<{
    status: "success" | "error" | "info";
    message: string;
    verificationId?: string;
    requiresVNin?: boolean;
  } | null>(null);

  const loadBalance = async () => {
    try {
      const res = await fetch("/api/wallet/balance", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setBalance(data.balance);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to load balance:", error);
      return false;
    }
  };

  const handleRefreshBalance = async () => {
    setRefreshing(true);
    await loadBalance();
    setRefreshing(false);
  };

  useEffect(() => {
    loadBalance();
  }, []);

  const amountNumber = Number(amount);
  const amountInvalid = !Number.isFinite(amountNumber) || amountNumber < 500;

  const handleFundWallet = async () => {
    setLoading(true);
    setResult(null);
    try {
      const { default: Paystack } = await import("@paystack/inline-js");

      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amountNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Unable to initialize payment");
      }

      const popup = new Paystack();
      const previousBalance = balance ?? 0;

      const verifyAndRefresh = async (reference: string) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        for (let i = 0; i < 3; i++) {
          try {
            const verifyRes = await fetch(
              `/api/paystack/verify?reference=${reference}`,
              {
                cache: "no-store",
              },
            );
            const contentType = verifyRes.headers.get("content-type");

            if (contentType && contentType.includes("application/json")) {
              await verifyRes.json();
              if (verifyRes.ok) break;
            }
          } catch (error) {
            console.error("Verify error:", error);
          }
          if (i < 2) await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));

        for (let i = 0; i < 6; i++) {
          const res = await fetch("/api/wallet/balance", { cache: "no-store" });
          if (res.ok) {
            const balanceData = await res.json();
            setBalance(balanceData.balance);
            if (balanceData.balance > previousBalance) {
              setResult({
                status: "success",
                message: `Wallet funded! New balance: ${formatNaira(balanceData.balance)}`,
              });
              return;
            }
          }
          if (i < 5) await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        setResult({
          status: "success",
          message: "Payment verified! Refresh if balance doesn't update.",
        });
      };

      popup.resumeTransaction(data.accessCode, {
        onSuccess: async (transaction: { reference?: string }) => {
          await verifyAndRefresh(transaction?.reference || data.reference);
        },
        onCancel: () => {
          setResult({ status: "error", message: "Payment cancelled." });
        },
        onError: (error: { message?: string }) => {
          setResult({
            status: "error",
            message: error?.message || "Payment failed.",
          });
        },
      });
    } catch (error) {
      setResult({
        status: "error",
        message: getFriendlyErrorMessage(
          error,
          "Couldn't start payment. Try again.",
        ),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    setResult(null);
    try {
      const res = await fetch("/api/nin/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nin, consent }),
      });

      // Check if response is JSON
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          "Server returned an invalid response. Please try again.",
        );
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.message || "Verification failed");
      } else {
        setNin("");
        setConsent(false);
        loadBalance();

        // Automatically redirect to receipt page
        window.location.href = `/dashboard/receipts/${data.verificationId}`;
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setResult({ status: "error", message: errorMessage });
      loadBalance();
    } finally {
      setVerifying(false);
    }
  };

  const normalizedNin = nin.replace(/\D/g, "").slice(0, 11);
  const formattedNin = normalizedNin
    .replace(/(\d{3})(\d{4})(\d{0,4})/, (_m, p1, p2, p3) => {
      if (p3) return `${p1} ${p2} ${p3}`;
      if (p2) return `${p1} ${p2}`;
      return p1;
    })
    .trim();
  const hasInsufficientBalance = balance !== null && balance < feeKobo;
  const canVerify =
    normalizedNin.length === 11 &&
    consent &&
    !hasInsufficientBalance &&
    !verifying;
  const verificationsLeft =
    balance === null ? null : Math.floor(balance / feeKobo);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="show"
      className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 pb-12"
    >
      {/* Wallet Balance Header - Compact */}
      <motion.div variants={fadeIn}>
        <Card className="border-border/50 bg-gradient-to-br from-primary/5 via-white to-accent/5 shadow-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Wallet Balance
                </p>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-bold sm:text-4xl">
                    {balance === null ? "—" : formatNaira(balance)}
                  </p>
                  {balance !== null && (
                    <span className="text-sm text-muted-foreground">
                      ({verificationsLeft}{" "}
                      {verificationsLeft === 1
                        ? "verification"
                        : "verifications"}
                      )
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshBalance}
                  disabled={refreshing}
                  className="gap-2"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "opacity-50" : ""}`}
                  />
                  Refresh
                </Button>
                <Button
                  size="sm"
                  onClick={() =>
                    document
                      .getElementById("fund-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Money
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Low Balance Warning */}
      <AnimatePresence>
        {hasInsufficientBalance && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
                  <div>
                    <p className="font-semibold text-amber-900">
                      Insufficient Balance
                    </p>
                    <p className="mt-1 text-sm text-amber-800">
                      You need at least {formatNaira(feeKobo)} to verify a NIN.
                      Please add money to continue.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content - Two Column on Desktop */}
      <motion.div
        variants={fadeIn}
        className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
      >
        {/* Left Column - NIN Verification */}
        <div className="space-y-6">
          {/* NIN Verification Card - Hero */}
          <Card id="verify-section" className="border-border/50 shadow-md">
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                  <Fingerprint className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Verify Your NIN</h2>
                  <p className="text-sm text-muted-foreground">
                    Quick and secure verification
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {/* NIN Input */}
                <div className="space-y-2">
                  <label htmlFor="nin-input" className="text-sm font-semibold">
                    National Identity Number (NIN)
                  </label>
                  <Input
                    id="nin-input"
                    value={formattedNin}
                    onChange={(e) => setNin(e.target.value)}
                    placeholder="123 4567 8901"
                    maxLength={13}
                    className="h-14 text-lg tracking-wider"
                    disabled={verifying}
                  />
                  <div className="flex items-center justify-between text-xs">
                    <span
                      className={
                        normalizedNin.length === 11
                          ? "text-emerald-600 font-medium"
                          : "text-muted-foreground"
                      }
                    >
                      {normalizedNin.length}/11 digits
                    </span>
                    <span className="text-muted-foreground">
                      Fee:{" "}
                      <span className="font-semibold text-foreground">
                        {formatNaira(feeKobo)}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-muted/30 p-4 transition hover:bg-muted/50">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 h-4 w-4 cursor-pointer"
                    disabled={verifying}
                  />
                  <span className="text-sm leading-relaxed">
                    I consent to verify my identity against NIMC records
                  </span>
                </label>

                {/* Verify Button */}
                <Button
                  onClick={handleVerify}
                  disabled={!canVerify}
                  size="lg"
                  className="h-14 w-full text-base font-semibold"
                >
                  {verifying ? (
                    <>
                      <AnimatedLogoLoader size="sm" variant="inline" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <Fingerprint className="h-5 w-5" />
                      Verify NIN
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result Card */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
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
                  <CardContent className="p-5">
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
                            ? "Verification Successful!"
                            : result.status === "info"
                              ? "Information"
                              : "Verification Failed"}
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
                        {result.verificationId && (
                          <Button
                            asChild
                            size="sm"
                            className="mt-3 gap-2 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <Link
                              href={`/dashboard/receipts/${result.verificationId}`}
                            >
                              <Eye className="h-4 w-4" />
                              View Your Data
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Stats */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Available
                    </p>
                    <p className="text-2xl font-bold">
                      {verificationsLeft === null ? "—" : verificationsLeft}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      verifications left
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardContent className="p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                    <Shield className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                      Security
                    </p>
                    <p className="text-lg font-bold text-emerald-800">
                      Protected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Data is encrypted
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History Link */}
          <Card className="border-border/50">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">Transaction History</p>
                    <p className="text-sm text-muted-foreground">
                      View all your activity
                    </p>
                  </div>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/dashboard/transactions">
                    View <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Fund Wallet & Info */}
        <div className="space-y-6">
          {/* Fund Wallet Card */}
          <Card id="fund-section" className="border-border/50 shadow-md">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10">
                  <Wallet className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <h3 className="font-bold">Add Money</h3>
                  <p className="text-xs text-muted-foreground">
                    Fund your wallet
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="amount-input" className="text-sm font-medium">
                    Amount (₦)
                  </label>
                  <Input
                    id="amount-input"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="500"
                    className="h-12 text-lg"
                    min="500"
                    disabled={loading}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000].map((amt) => (
                    <Button
                      key={amt}
                      variant="outline"
                      size="sm"
                      onClick={() => setAmount(String(amt))}
                      disabled={loading}
                      className="h-10"
                    >
                      ₦{amt}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleFundWallet}
                  disabled={loading || amountInvalid}
                  size="lg"
                  className="h-12 w-full font-semibold"
                >
                  {loading ? (
                    <>
                      <AnimatedLogoLoader size="sm" variant="inline" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Wallet className="h-4 w-4" />
                      Add Money
                    </>
                  )}
                </Button>

                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Info className="h-3.5 w-3.5" />
                  Minimum ₦500. Powered by Paystack.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Recovery Shortcut */}
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <RefreshCw className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-bold text-blue-900">Payment Recovery</h3>
                  <p className="text-xs text-blue-700">
                    Fix a debit that didn&apos;t reflect
                  </p>
                </div>
              </div>

              <p className="text-sm text-blue-800 leading-relaxed">
                Use your payment reference to recover a wallet top-up that
                didn&apos;t update after checkout.
              </p>

              <Button
                asChild
                size="lg"
                className="mt-4 w-full font-semibold bg-blue-600 hover:bg-blue-700"
              >
                <Link href="/dashboard/recovery">
                  <RefreshCw className="h-4 w-4" />
                  Open recovery
                </Link>
              </Button>

              <p className="mt-3 text-xs text-blue-700 leading-relaxed">
                Have your payment reference and amount ready before you
                continue.
              </p>
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="border-border/50">
            <CardContent className="p-6">
              <h3 className="mb-4 font-bold">How It Works</h3>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    1
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Enter your 11-digit NIN
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    2
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Ensure wallet has {formatNaira(feeKobo)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    3
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Give consent and verify
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    4
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    View and download your data
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-5">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-900">
                    Your Privacy Matters
                  </p>
                  <p className="mt-1 text-sm text-emerald-800">
                    Your NIN is masked in history and verification documents. We
                    never store sensitive data.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* Dashboard Footer - Important Links */}
      <motion.div variants={fadeIn} className="mt-12">
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-white/80 p-6 sm:p-8">
          <Image
            src="/images/naija.png"
            alt=""
            width={160}
            height={160}
            aria-hidden="true"
            unoptimized
            className="pointer-events-none absolute -left-6 -bottom-6 h-28 w-28 opacity-10"
          />
          <Image
            src="/images/nimc.png"
            alt=""
            width={180}
            height={180}
            aria-hidden="true"
            unoptimized
            className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 opacity-10"
          />

          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Quick Links
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/dashboard/transactions"
                    className="hover:text-primary transition-colors"
                  >
                    Transaction History
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/recovery"
                    className="hover:text-primary transition-colors"
                  >
                    Payment Recovery
                  </Link>
                </li>
                <li>
                  <Link
                    href="/support"
                    className="hover:text-primary transition-colors"
                  >
                    Help & Support
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Legal
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/privacy"
                    className="hover:text-primary transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href="/terms"
                    className="hover:text-primary transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Compliance
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  NDPR Compliant
                </li>
                <li className="flex items-center gap-2">
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  Secure & Encrypted
                </li>
              </ul>
            </div>

            <div>
              <h4 className="mb-3 text-sm font-semibold text-foreground">
                Contact
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <a
                    href="mailto:support@verifynin.ng"
                    className="hover:text-primary transition-colors"
                  >
                    support@verifynin.ng
                  </a>
                </li>
                <li className="text-xs">Made with ❤️ in Nigeria</li>
              </ul>
            </div>
          </div>

          <div className="relative mt-6 pt-6 border-t border-border/50 text-center text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} VerifyNIN. All rights reserved.</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
