/**
 * Verification Flow State Management
 *
 * Centralized state management for the NIN verification process using Zustand.
 * Handles the complete verification flow from phone input to results display.
 *
 * Features:
 * - Type-safe state management
 * - Persistent session storage
 * - Automatic cleanup
 * - Step navigation
 * - Error handling
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { devtools } from "zustand/middleware";

// ============================================================================
// Types
// ============================================================================

export type FlowStep =
  | "phone"
  | "otp"
  | "data-selection"
  | "payment"
  | "result";

export type DataLayer = "demographic" | "biometric" | "full";

export interface PaymentData {
  nin: string;
  dataLayer: DataLayer;
  amount: number;
}

export interface VerificationData {
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

export interface SessionInfo {
  sessionId: string;
  phoneNumber: string;
  dataLayer: string;
  verificationDate: string;
}

// ============================================================================
// Store State Interface
// ============================================================================

interface VerificationState {
  // Flow state
  currentStep: FlowStep;
  isLoading: boolean;
  error: string | null;

  // User data
  phoneNumber: string;
  sessionToken: string;
  sessionId: string;
  paymentData: PaymentData | null;
  verificationData: VerificationData | null;
  sessionInfo: SessionInfo | null;

  // Payment state
  paymentReference: string | null;
  paymentStatus: "pending" | "processing" | "completed" | "failed" | null;

  // Verification status
  verificationStatus:
    | "pending"
    | "payment_completed"
    | "processing"
    | "completed"
    | "failed"
    | null;

  // Actions
  setStep: (step: FlowStep) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Phone step
  setPhoneNumber: (phone: string) => void;

  // OTP step
  setSessionToken: (token: string) => void;
  setSessionId: (id: string) => void;

  // Data selection step
  setPaymentData: (data: PaymentData) => void;

  // Payment step
  setPaymentReference: (ref: string) => void;
  setPaymentStatus: (
    status: "pending" | "processing" | "completed" | "failed",
  ) => void;

  // Results step
  setVerificationData: (data: VerificationData) => void;
  setSessionInfo: (info: SessionInfo) => void;
  setVerificationStatus: (
    status:
      | "pending"
      | "payment_completed"
      | "processing"
      | "completed"
      | "failed",
  ) => void;

  // Navigation
  goToNextStep: () => void;
  goToPreviousStep: () => void;
  goToStep: (step: FlowStep) => void;

  // Reset
  reset: () => void;
  resetFromStep: (step: FlowStep) => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  currentStep: "phone" as FlowStep,
  isLoading: false,
  error: null,
  phoneNumber: "",
  sessionToken: "",
  sessionId: "",
  paymentData: null,
  verificationData: null,
  sessionInfo: null,
  paymentReference: null,
  paymentStatus: null,
  verificationStatus: null,
};

// ============================================================================
// Store
// ============================================================================

export const useVerificationStore = create<VerificationState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Basic setters
        setStep: (step) => set({ currentStep: step }, false, "setStep"),
        setLoading: (loading) =>
          set({ isLoading: loading }, false, "setLoading"),
        setError: (error) => set({ error }, false, "setError"),

        // Phone step
        setPhoneNumber: (phone) =>
          set({ phoneNumber: phone }, false, "setPhoneNumber"),

        // OTP step
        setSessionToken: (token) => {
          set({ sessionToken: token }, false, "setSessionToken");
          // Also persist to localStorage for callback page
          if (typeof window !== "undefined") {
            localStorage.setItem("sessionToken", token);
            sessionStorage.setItem("sessionToken", token);
          }
        },
        setSessionId: (id) => set({ sessionId: id }, false, "setSessionId"),

        // Data selection step
        setPaymentData: (data) =>
          set({ paymentData: data }, false, "setPaymentData"),

        // Payment step
        setPaymentReference: (ref) =>
          set({ paymentReference: ref }, false, "setPaymentReference"),
        setPaymentStatus: (status) =>
          set({ paymentStatus: status }, false, "setPaymentStatus"),

        // Results step
        setVerificationData: (data) =>
          set({ verificationData: data }, false, "setVerificationData"),
        setSessionInfo: (info) =>
          set({ sessionInfo: info }, false, "setSessionInfo"),
        setVerificationStatus: (status) =>
          set({ verificationStatus: status }, false, "setVerificationStatus"),

        // Navigation
        goToNextStep: () => {
          const { currentStep } = get();
          const steps: FlowStep[] = [
            "phone",
            "otp",
            "data-selection",
            "payment",
            "result",
          ];
          const currentIndex = steps.indexOf(currentStep);
          if (currentIndex < steps.length - 1) {
            set(
              { currentStep: steps[currentIndex + 1] },
              false,
              "goToNextStep",
            );
          }
        },

        goToPreviousStep: () => {
          const { currentStep } = get();
          const steps: FlowStep[] = [
            "phone",
            "otp",
            "data-selection",
            "payment",
            "result",
          ];
          const currentIndex = steps.indexOf(currentStep);
          if (currentIndex > 0) {
            set(
              { currentStep: steps[currentIndex - 1] },
              false,
              "goToPreviousStep",
            );
          }
        },

        goToStep: (step) => set({ currentStep: step }, false, "goToStep"),

        // Reset functions
        reset: () => {
          set(initialState, false, "reset");
          // Clear localStorage
          if (typeof window !== "undefined") {
            localStorage.removeItem("sessionToken");
            sessionStorage.removeItem("sessionToken");
          }
        },

        resetFromStep: (step) => {
          const steps: FlowStep[] = [
            "phone",
            "otp",
            "data-selection",
            "payment",
            "result",
          ];
          const stepIndex = steps.indexOf(step);

          // Reset data from this step onwards
          const resetData: Partial<VerificationState> = {
            currentStep: step,
            error: null,
          };

          if (stepIndex <= 0) {
            resetData.phoneNumber = "";
            resetData.sessionToken = "";
            resetData.sessionId = "";
            resetData.paymentData = null;
            resetData.verificationData = null;
            resetData.sessionInfo = null;
            resetData.paymentReference = null;
            resetData.paymentStatus = null;
            resetData.verificationStatus = null;
          } else if (stepIndex <= 1) {
            resetData.sessionToken = "";
            resetData.sessionId = "";
            resetData.paymentData = null;
            resetData.verificationData = null;
            resetData.sessionInfo = null;
            resetData.paymentReference = null;
            resetData.paymentStatus = null;
            resetData.verificationStatus = null;
          } else if (stepIndex <= 2) {
            resetData.paymentData = null;
            resetData.verificationData = null;
            resetData.sessionInfo = null;
            resetData.paymentReference = null;
            resetData.paymentStatus = null;
            resetData.verificationStatus = null;
          } else if (stepIndex <= 3) {
            resetData.verificationData = null;
            resetData.sessionInfo = null;
            resetData.paymentReference = null;
            resetData.paymentStatus = null;
            resetData.verificationStatus = null;
          }

          set(resetData, false, "resetFromStep");

          // Clear localStorage if resetting from phone step
          if (stepIndex <= 0 && typeof window !== "undefined") {
            localStorage.removeItem("sessionToken");
            sessionStorage.removeItem("sessionToken");
          }
        },
      }),
      {
        name: "verification-storage",
        storage: createJSONStorage(() => sessionStorage),
        partialize: (state) => ({
          // Only persist essential data
          currentStep: state.currentStep,
          phoneNumber: state.phoneNumber,
          sessionToken: state.sessionToken,
          sessionId: state.sessionId,
          paymentData: state.paymentData,
          paymentReference: state.paymentReference,
        }),
      },
    ),
    {
      name: "VerificationStore",
      enabled: process.env.NODE_ENV === "development",
    },
  ),
);

// ============================================================================
// Selectors (for optimized re-renders)
// ============================================================================

export const useCurrentStep = () =>
  useVerificationStore((state) => state.currentStep);
export const useIsLoading = () =>
  useVerificationStore((state) => state.isLoading);
export const useError = () => useVerificationStore((state) => state.error);
export const usePhoneNumber = () =>
  useVerificationStore((state) => state.phoneNumber);
export const useSessionToken = () =>
  useVerificationStore((state) => state.sessionToken);
export const usePaymentData = () =>
  useVerificationStore((state) => state.paymentData);
export const useVerificationData = () =>
  useVerificationStore((state) => state.verificationData);
export const useVerificationStatus = () =>
  useVerificationStore((state) => state.verificationStatus);

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get step index for progress calculation
 */
export function getStepIndex(step: FlowStep): number {
  const steps: FlowStep[] = [
    "phone",
    "otp",
    "data-selection",
    "payment",
    "result",
  ];
  return steps.indexOf(step);
}

/**
 * Check if a step is completed
 */
export function isStepCompleted(
  currentStep: FlowStep,
  checkStep: FlowStep,
): boolean {
  return getStepIndex(currentStep) > getStepIndex(checkStep);
}

/**
 * Get progress percentage
 */
export function getProgressPercentage(step: FlowStep): number {
  const index = getStepIndex(step);
  return ((index + 1) / 5) * 100;
}
