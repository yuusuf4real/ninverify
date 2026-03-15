"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  XCircle,
  Trash2,
  UserX,
  Shield,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedLogoLoader } from "@/components/ui/animated-logo-loader";
import { cn } from "@/lib/utils";

export type ConfirmationVariant =
  | "destructive"
  | "warning"
  | "info"
  | "success"
  | "suspend"
  | "delete"
  | "resolve";

export type ConfirmationAction = {
  type: ConfirmationVariant;
  title: string;
  description: string;
  confirmText: string;
  cancelText?: string;
  requiresInput?: boolean;
  inputPlaceholder?: string;
  inputValidation?: string;
};

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (inputValue?: string) => void | Promise<void>;
  action: ConfirmationAction;
  loading?: boolean;
  className?: string;
}

const variantConfig = {
  destructive: {
    icon: Trash2,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
    borderColor: "border-red-200",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-amber-500",
    iconBg: "bg-amber-50",
    confirmButtonClass: "bg-amber-600 hover:bg-amber-700 text-white",
    borderColor: "border-amber-200",
  },
  info: {
    icon: Info,
    iconColor: "text-blue-500",
    iconBg: "bg-blue-50",
    confirmButtonClass: "bg-blue-600 hover:bg-blue-700 text-white",
    borderColor: "border-blue-200",
  },
  success: {
    icon: CheckCircle2,
    iconColor: "text-green-500",
    iconBg: "bg-green-50",
    confirmButtonClass: "bg-green-600 hover:bg-green-700 text-white",
    borderColor: "border-green-200",
  },
  suspend: {
    icon: UserX,
    iconColor: "text-orange-500",
    iconBg: "bg-orange-50",
    confirmButtonClass: "bg-orange-600 hover:bg-orange-700 text-white",
    borderColor: "border-orange-200",
  },
  delete: {
    icon: XCircle,
    iconColor: "text-red-500",
    iconBg: "bg-red-50",
    confirmButtonClass: "bg-red-600 hover:bg-red-700 text-white",
    borderColor: "border-red-200",
  },
  resolve: {
    icon: Shield,
    iconColor: "text-green-500",
    iconBg: "bg-green-50",
    confirmButtonClass: "bg-green-600 hover:bg-green-700 text-white",
    borderColor: "border-green-200",
  },
};

export const ConfirmationModal = memo<ConfirmationModalProps>(
  ({ isOpen, onClose, onConfirm, action, loading = false, className = "" }) => {
    const [inputValue, setInputValue] = React.useState("");
    const [inputError, setInputError] = React.useState("");

    const config = variantConfig[action.type];
    const IconComponent = config.icon;

    const handleConfirm = async () => {
      if (action.requiresInput) {
        if (!inputValue.trim()) {
          setInputError("This field is required");
          return;
        }

        if (action.inputValidation && inputValue !== action.inputValidation) {
          setInputError(`Please type "${action.inputValidation}" to confirm`);
          return;
        }
      }

      try {
        await onConfirm(inputValue);
        handleClose();
      } catch (error) {
        console.error("Confirmation action failed:", error);
      }
    };

    const handleClose = () => {
      setInputValue("");
      setInputError("");
      onClose();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      } else if (e.key === "Enter" && !loading) {
        handleConfirm();
      }
    };

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onKeyDown={handleKeyDown}
          >
            {/* Backdrop */}
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              className={cn(
                "relative w-full max-w-md mx-auto",
                "bg-white rounded-xl shadow-2xl",
                "border-2",
                config.borderColor,
                className,
              )}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                disabled={loading}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close modal"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>

              {/* Content */}
              <div className="p-6">
                {/* Icon */}
                <div
                  className={cn(
                    "w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center",
                    config.iconBg,
                  )}
                >
                  <IconComponent className={cn("h-8 w-8", config.iconColor)} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  {action.title}
                </h3>

                {/* Description */}
                <p className="text-gray-600 text-center mb-6 leading-relaxed">
                  {action.description}
                </p>

                {/* Input field if required */}
                {action.requiresInput && (
                  <div className="mb-6">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setInputError("");
                      }}
                      placeholder={action.inputPlaceholder}
                      disabled={loading}
                      className={cn(
                        "w-full px-3 py-2 border rounded-lg",
                        "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
                        "disabled:bg-gray-50 disabled:text-gray-500",
                        inputError ? "border-red-300" : "border-gray-300",
                      )}
                      autoFocus
                    />
                    {inputError && (
                      <p className="mt-1 text-sm text-red-600">{inputError}</p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 h-11"
                  >
                    {action.cancelText || "Cancel"}
                  </Button>

                  <Button
                    onClick={handleConfirm}
                    disabled={loading}
                    className={cn("flex-1 h-11", config.confirmButtonClass)}
                  >
                    {loading ? (
                      <>
                        <AnimatedLogoLoader size="sm" variant="inline" />
                        Processing...
                      </>
                    ) : (
                      action.confirmText
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

ConfirmationModal.displayName = "ConfirmationModal";

// Predefined confirmation actions
export const confirmationActions = {
  suspendUser: (userName: string): ConfirmationAction => ({
    type: "suspend",
    title: "Suspend User Account",
    description: `Are you sure you want to suspend ${userName}? This will prevent them from accessing their account until you reactivate it.`,
    confirmText: "Suspend User",
    cancelText: "Keep Active",
  }),

  deleteUser: (userName: string): ConfirmationAction => ({
    type: "delete",
    title: "Delete User Account",
    description: `This will permanently delete ${userName}'s account and all associated data. This action cannot be undone.`,
    confirmText: "Delete Account",
    cancelText: "Cancel",
    requiresInput: true,
    inputPlaceholder: "Type DELETE to confirm",
    inputValidation: "DELETE",
  }),

  resolveTicket: (ticketId: string): ConfirmationAction => ({
    type: "resolve",
    title: "Mark Ticket as Resolved",
    description: `Are you sure you want to mark ticket ${ticketId} as resolved? This will close the ticket and notify the user.`,
    confirmText: "Mark Resolved",
    cancelText: "Keep Open",
  }),

  deleteTicket: (ticketId: string): ConfirmationAction => ({
    type: "delete",
    title: "Delete Support Ticket",
    description: `This will permanently delete ticket ${ticketId} and all its messages. This action cannot be undone.`,
    confirmText: "Delete Ticket",
    cancelText: "Cancel",
    requiresInput: true,
    inputPlaceholder: "Type DELETE to confirm",
    inputValidation: "DELETE",
  }),

  reconcileTransaction: (amount: string): ConfirmationAction => ({
    type: "warning",
    title: "Reconcile Transaction",
    description: `Are you sure you want to reconcile this transaction of ${amount}? This will mark it as verified and update the user's balance.`,
    confirmText: "Reconcile",
    cancelText: "Cancel",
  }),

  refundTransaction: (amount: string): ConfirmationAction => ({
    type: "warning",
    title: "Process Refund",
    description: `This will process a refund of ${amount} to the user's original payment method. This action may take 3-5 business days to complete.`,
    confirmText: "Process Refund",
    cancelText: "Cancel",
  }),
};

// Hook for using confirmation modal
export const useConfirmationModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [currentAction, setCurrentAction] =
    React.useState<ConfirmationAction | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [onConfirmCallback, setOnConfirmCallback] = React.useState<
    ((inputValue?: string) => void | Promise<void>) | null
  >(null);

  const showConfirmation = (
    action: ConfirmationAction,
    onConfirm: (inputValue?: string) => void | Promise<void>,
  ) => {
    setCurrentAction(action);
    setOnConfirmCallback(() => onConfirm);
    setIsOpen(true);
  };

  const handleConfirm = async (inputValue?: string) => {
    if (!onConfirmCallback) return;

    setLoading(true);
    try {
      await onConfirmCallback(inputValue);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setCurrentAction(null);
    setOnConfirmCallback(null);
    setLoading(false);
  };

  const ConfirmationModalComponent = currentAction ? (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={handleClose}
      onConfirm={handleConfirm}
      action={currentAction}
      loading={loading}
    />
  ) : null;

  return {
    showConfirmation,
    ConfirmationModal: ConfirmationModalComponent,
    isOpen,
    loading,
  };
};
