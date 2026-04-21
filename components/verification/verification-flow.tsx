"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  const [currentStep, setCurrentStep] = useState<FlowStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [paymentData, setPaymentData] = useState<{
    nin: string;
    dataLayer: string;
    amount: number;
  } | null>(null);

  const handlePhoneSubmit = (phone: string) => {
    setPhoneNumber(phone);
    setCurrentStep("otp");
  };

  const handleOTPVerified = (token: string) => {
    setSessionToken(token);
    setCurrentStep("data-selection");
  };

  const handleDataSubmit = (nin: string, dataLayer: string, amount: number) => {
    setPaymentData({ nin, dataLayer, amount });
    setCurrentStep("payment");
  };

  const handlePaymentComplete = () => {
    setCurrentStep("result");
  };

  const handleBackToPhone = () => {
    setCurrentStep("phone");
    setPhoneNumber("");
    setSessionToken("");
    setPaymentData(null);
  };

  const handleBackToOTP = () => {
    setCurrentStep("otp");
    setSessionToken("");
    setPaymentData(null);
  };

  const handleBackToDataSelection = () => {
    setCurrentStep("data-selection");
    setPaymentData(null);
  };

  const handleStartOver = () => {
    setCurrentStep("phone");
    setPhoneNumber("");
    setSessionToken("");
    setPaymentData(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4 mb-4">
            {[
              { step: "phone", label: "Phone", icon: "📱" },
              { step: "otp", label: "Verify", icon: "🔐" },
              { step: "data-selection", label: "Select Data", icon: "📋" },
              { step: "payment", label: "Payment", icon: "💳" },
              { step: "result", label: "Result", icon: "✅" },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-colors ${
                    currentStep === item.step
                      ? "bg-primary text-white"
                      : index < ["phone", "otp", "data-selection", "payment", "result"].indexOf(currentStep)
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {item.icon}
                </div>
                {index < 4 && (
                  <div
                    className={`w-8 h-0.5 mx-2 transition-colors ${
                      index < ["phone", "otp", "data-selection", "payment", "result"].indexOf(currentStep)
                        ? "bg-emerald-500"
                        : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground">
            {currentStep === "phone" && "Enter your phone number to get started"}
            {currentStep === "otp" && "Verify your identity with the code we sent"}
            {currentStep === "data-selection" && "Enter NIN and choose what information you need"}
            {currentStep === "payment" && "Secure payment for your verification"}
            {currentStep === "result" && "Your verification results are ready"}
          </p>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <AnimatePresence mode="wait">
            {currentStep === "phone" && (
              <motion.div
                key="phone"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
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
                transition={{ duration: 0.3 }}
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
                transition={{ duration: 0.3 }}
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
                transition={{ duration: 0.3 }}
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
                transition={{ duration: 0.3 }}
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

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Need help? Contact our support team
          </p>
          <div className="flex justify-center space-x-4 text-sm">
            <a
              href="mailto:support@verifynin.com"
              className="text-primary hover:underline"
            >
              support@verifynin.com
            </a>
            <span className="text-muted-foreground">•</span>
            <a
              href="tel:+2348000000000"
              className="text-primary hover:underline"
            >
              +234 800 000 0000
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}