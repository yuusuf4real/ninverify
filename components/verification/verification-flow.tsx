"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Smartphone,
  ShieldCheck,
  FileText,
  CreditCard,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { PhoneInput } from "./phone-input";
import { OTPInput } from "./otp-input";
import { DataLayerSelector } from "./data-layer-selector";
import { PaymentProcessor } from "./payment-processor";
import { VerificationResult } from "./verification-result";

type FlowStep = "phone" | "otp" | "data-selection" | "payment" | "result";

interface VerificationFlowProps {
  onComplete?: () => void;
}

export function VerificationFlow({ onComplete }: VerificationFlowProps) {
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<FlowStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [paymentData, setPaymentData] = useState<{
    nin: string;
    dataLayer: string;
    amount: number;
  } | null>(null);

  // Handle URL parameters for direct navigation (e.g., from callback)
  useEffect(() => {
    const step = searchParams.get("step");
    if (step === "result") {
      // Check if we have a stored session token
      const storedToken = localStorage.getItem("sessionToken");
      if (storedToken) {
        setSessionToken(storedToken);
        setCurrentStep("result");
      }
    }
  }, [searchParams]);

  const handlePhoneSubmit = (phone: string) => {
    setPhoneNumber(phone);
    setCurrentStep("otp");
  };

  const handleOTPVerified = (token: string) => {
    setSessionToken(token);
    // Store session token for callback page
    localStorage.setItem("sessionToken", token);
    setCurrentStep("data-selection");
  };

  const handleDataSubmit = (nin: string, dataLayer: string, amount: number) => {
    setPaymentData({ nin, dataLayer, amount });
    setCurrentStep("payment");
  };

  const handlePaymentComplete = () => {
    setCurrentStep("result");
  };

  const handleStartOver = () => {
    setCurrentStep("phone");
    setPhoneNumber("");
    setSessionToken("");
    setPaymentData(null);
    // Clear stored session token
    localStorage.removeItem("sessionToken");
    sessionStorage.removeItem("sessionToken");
  };

  const handleBackToPhone = () => {
    setCurrentStep("phone");
    setPhoneNumber("");
    setSessionToken("");
    setPaymentData(null);
    // Clear stored session token
    localStorage.removeItem("sessionToken");
    sessionStorage.removeItem("sessionToken");
  };

  const handleBackToOTP = () => {
    setCurrentStep("otp");
    setSessionToken("");
    setPaymentData(null);
    // Clear stored session token
    localStorage.removeItem("sessionToken");
    sessionStorage.removeItem("sessionToken");
  };

  const handleBackToDataSelection = () => {
    setCurrentStep("data-selection");
    setPaymentData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-4 sm:py-8 px-3 sm:px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Enhanced Progress Indicator */}
        <div className="mb-8 sm:mb-12">
          {/* Desktop Progress */}
          <div className="hidden md:flex items-center justify-center space-x-6 mb-6">
            {[
              {
                step: "phone",
                label: "Phone Number",
                icon: Smartphone,
                description: "Enter your phone",
              },
              {
                step: "otp",
                label: "Verification",
                icon: ShieldCheck,
                description: "Verify with OTP",
              },
              {
                step: "data-selection",
                label: "NIN & Data",
                icon: FileText,
                description: "Select data layer",
              },
              {
                step: "payment",
                label: "Payment",
                icon: CreditCard,
                description: "Secure payment",
              },
              {
                step: "result",
                label: "Results",
                icon: CheckCircle2,
                description: "View results",
              },
            ].map((item, index) => {
              const Icon = item.icon;
              const isActive = currentStep === item.step;
              const isCompleted =
                index <
                ["phone", "otp", "data-selection", "payment", "result"].indexOf(
                  currentStep,
                );

              return (
                <div key={item.step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`relative flex items-center justify-center w-16 h-16 rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? "bg-primary border-primary text-white shadow-lg scale-110"
                          : isCompleted
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                      {isActive && (
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-primary"
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      )}
                    </div>
                    <div className="mt-3 text-center">
                      <p
                        className={`text-sm font-medium ${
                          isActive
                            ? "text-primary"
                            : isCompleted
                              ? "text-emerald-600"
                              : "text-gray-500"
                        }`}
                      >
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  {index < 4 && (
                    <div className="flex items-center mx-4">
                      <div
                        className={`w-12 h-0.5 transition-colors duration-300 ${
                          isCompleted ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      />
                      <ChevronRight
                        className={`w-4 h-4 mx-1 ${
                          isCompleted ? "text-emerald-500" : "text-gray-300"
                        }`}
                      />
                      <div
                        className={`w-12 h-0.5 transition-colors duration-300 ${
                          isCompleted ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mobile Progress */}
          <div className="md:hidden">
            <div className="flex items-center justify-center gap-3 mb-4">
              {[
                { step: "phone", icon: Smartphone },
                { step: "otp", icon: ShieldCheck },
                { step: "data-selection", icon: FileText },
                { step: "payment", icon: CreditCard },
                { step: "result", icon: CheckCircle2 },
              ].map((item, index) => {
                const Icon = item.icon;
                const isActive = currentStep === item.step;
                const isCompleted =
                  index <
                  [
                    "phone",
                    "otp",
                    "data-selection",
                    "payment",
                    "result",
                  ].indexOf(currentStep);

                return (
                  <div key={item.step} className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                        isActive
                          ? "bg-primary border-primary text-white shadow-md"
                          : isCompleted
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "bg-white border-gray-300 text-gray-400"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    {index < 4 && (
                      <div
                        className={`w-6 h-0.5 mx-2 transition-colors duration-300 ${
                          isCompleted ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Mobile Step Info */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900 mb-1">
                Step{" "}
                {[
                  "phone",
                  "otp",
                  "data-selection",
                  "payment",
                  "result",
                ].indexOf(currentStep) + 1}{" "}
                of 5
              </p>
              <p className="text-xs text-gray-500">
                {currentStep === "phone" &&
                  "Enter your phone number to get started"}
                {currentStep === "otp" &&
                  "Verify your identity with the code we sent"}
                {currentStep === "data-selection" &&
                  "Enter NIN and choose what information you need"}
                {currentStep === "payment" &&
                  "Secure payment for your verification"}
                {currentStep === "result" &&
                  "Your verification results are ready"}
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Step Content */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 md:p-10 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            {currentStep === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <PhoneInput onSubmit={handlePhoneSubmit} />
              </motion.div>
            )}

            {currentStep === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <OTPInput
                  phoneNumber={phoneNumber}
                  onVerified={handleOTPVerified}
                  onBack={handleBackToPhone}
                />
              </motion.div>
            )}

            {currentStep === "data-selection" && (
              <motion.div
                key="data-selection"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <DataLayerSelector
                  sessionToken={sessionToken}
                  onSubmit={handleDataSubmit}
                  onBack={handleBackToOTP}
                />
              </motion.div>
            )}

            {currentStep === "payment" && paymentData && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <PaymentProcessor
                  sessionToken={sessionToken}
                  nin={paymentData.nin}
                  dataLayer={paymentData.dataLayer}
                  amount={paymentData.amount}
                  onComplete={handlePaymentComplete}
                  onBack={handleBackToDataSelection}
                />
              </motion.div>
            )}

            {currentStep === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <VerificationResult
                  sessionToken={sessionToken}
                  onStartOver={handleStartOver}
                  onComplete={onComplete}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Enhanced Help Section */}
        <div className="mt-8 sm:mt-12 text-center px-4">
          <div className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-gray-100">
            <p className="text-sm text-gray-600 mb-3 font-medium">
              Need assistance? Our support team is here to help
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-6 text-sm">
              <a
                href="mailto:support@verifynin.com"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                support@verifynin.com
              </a>
              <span className="hidden sm:inline text-gray-300">•</span>
              <a
                href="tel:+2348000000000"
                className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                +234 800 000 0000
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
