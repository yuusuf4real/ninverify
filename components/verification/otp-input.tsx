"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, RefreshCw, AlertCircle } from "lucide-react";

interface OTPInputProps {
  phoneNumber: string;
  onVerified: (sessionToken: string) => void;
  onBack: () => void;
}

export function OTPInput({ phoneNumber, onVerified, onBack }: OTPInputProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState("");
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  // Send initial OTP
  useEffect(() => {
    const initializeOTP = async () => {
      await sendOTP();
    };
    initializeOTP();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const sendOTP = async () => {
    try {
      setResending(true);
      setError("");

      const response = await fetch("/api/v2/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      setSessionId(data.sessionId);
      setTimeLeft(600); // Reset timer
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setResending(false);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (value.length > 1) return; // Prevent multiple characters

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-verify when all digits entered
    if (newOtp.every((digit) => digit !== "") && !loading) {
      verifyOTP(newOtp.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const verifyOTP = async (otpCode: string) => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch("/api/v2/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, otpCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      onVerified(data.sessionToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Verification failed");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const maskedPhone = phoneNumber.replace(
    /(\+234)(\d{3})(\d{4})(\d{4})/,
    "$1 $2 ***$4",
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex justify-center">
          <div className="p-3 rounded-2xl bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-2xl font-bold">Verify Your Phone</h2>
        <p className="text-muted-foreground">
          We sent a 6-digit code to <br />
          <span className="font-semibold text-foreground">{maskedPhone}</span>
        </p>
      </div>

      {/* OTP Input */}
      <div className="space-y-4">
        <div className="flex gap-3 justify-center">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleOTPChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-12 text-center text-lg font-bold"
              disabled={loading}
            />
          ))}
        </div>

        {/* Timer */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Code expires in{" "}
            <span className="font-semibold text-foreground">
              {formatTime(timeLeft)}
            </span>
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
        >
          <AlertCircle className="h-4 w-4 text-red-600" />
          <p className="text-sm text-red-800">{error}</p>
        </motion.div>
      )}

      {/* Actions */}
      <div className="space-y-3">
        {/* Resend Button */}
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={sendOTP}
            disabled={resending || timeLeft > 540} // Allow resend after 1 minute
            className="gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${resending ? "animate-spin" : ""}`}
            />
            {resending ? "Sending..." : "Resend Code"}
          </Button>
        </div>

        {/* Back Button */}
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="w-full"
        >
          Change Phone Number
        </Button>
      </div>

      {/* Loading State */}
      {loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/5"
        >
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-primary font-medium">Verifying...</p>
        </motion.div>
      )}
    </motion.div>
  );
}
