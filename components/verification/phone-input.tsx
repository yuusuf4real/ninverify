"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Smartphone, ArrowRight, AlertCircle } from "lucide-react";

interface PhoneInputProps {
  onSubmit: (phoneNumber: string) => void;
}

export function PhoneInput({ onSubmit }: PhoneInputProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Format Nigerian phone number
  const handlePhoneChange = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, "");

    // Format based on length
    let formatted = "";
    if (digits.startsWith("234")) {
      // International format
      formatted = digits.replace(
        /(\d{3})(\d{3})(\d{4})(\d{0,4})/,
        (_, p1, p2, p3, p4) => {
          if (p4) return `+${p1} ${p2} ${p3} ${p4}`;
          if (p3) return `+${p1} ${p2} ${p3}`;
          if (p2) return `+${p1} ${p2}`;
          return `+${p1}`;
        },
      );
    } else if (digits.startsWith("0")) {
      // Local format starting with 0
      formatted = digits.replace(
        /(\d{1})(\d{3})(\d{3})(\d{0,4})/,
        (_, p1, p2, p3, p4) => {
          if (p4) return `${p1}${p2} ${p3} ${p4}`;
          if (p3) return `${p1}${p2} ${p3}`;
          if (p2) return `${p1}${p2}`;
          return p1;
        },
      );
    } else if (digits.length > 0) {
      // Assume local format without leading 0
      formatted = digits.replace(/(\d{3})(\d{3})(\d{0,4})/, (_, p1, p2, p3) => {
        if (p3) return `${p1} ${p2} ${p3}`;
        if (p2) return `${p1} ${p2}`;
        return p1;
      });
    }

    setPhone(formatted);
  };

  const validatePhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, "");

    // Check various valid formats
    if (digits.startsWith("234") && digits.length === 13) return true; // +234XXXXXXXXXX
    if (digits.startsWith("0") && digits.length === 11) return true; // 0XXXXXXXXXX
    if (digits.length === 10) return true; // XXXXXXXXXX

    return false;
  };

  const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, "");

    if (digits.startsWith("234") && digits.length === 13) {
      return `+${digits}`;
    } else if (digits.startsWith("0") && digits.length === 11) {
      return `+234${digits.substring(1)}`;
    } else if (digits.length === 10) {
      return `+234${digits}`;
    }

    return phone;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePhone(phone)) {
      setError("Please enter a valid Nigerian phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const normalizedPhone = normalizePhone(phone);
      onSubmit(normalizedPhone);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const isValid = validatePhone(phone);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto space-y-4 sm:space-y-6 px-4 sm:px-0"
    >
      {/* Header */}
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="flex justify-center">
          <div className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-primary/10">
            <Smartphone className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
          </div>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">
          Enter Your Phone Number
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground px-4 sm:px-0">
          We&apos;ll send you a verification code to confirm your identity
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="phone-input" className="text-sm font-semibold">
            Phone Number
          </label>
          <Input
            id="phone-input"
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="0803 123 4567"
            className="h-12 sm:h-14 text-base sm:text-lg touch-manipulation"
            disabled={loading}
            maxLength={18}
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Nigerian numbers only</span>
            {isValid && (
              <div className="flex items-center gap-1 text-emerald-600">
                <div className="w-2 h-2 rounded-full bg-emerald-600" />
                <span className="font-medium">Valid format</span>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200"
          >
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </motion.div>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isValid || loading}
          className="w-full h-11 sm:h-12 gap-2 touch-manipulation text-sm sm:text-base"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Sending Code...
            </>
          ) : (
            <>
              Send Verification Code
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Info */}
      <div className="text-center text-xs sm:text-sm text-muted-foreground px-4 sm:px-0">
        <p>
          By continuing, you agree to our{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
        </p>
      </div>
    </motion.div>
  );
}
