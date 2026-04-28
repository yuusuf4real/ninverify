/**
 * Toast Notification Component
 * Displays toast notifications from the UI store
 */

"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
} from "lucide-react";
import { useToasts, useUIStore } from "@/store/ui-store";

export function ToastContainer() {
  const toasts = useToasts();
  const removeToast = useUIStore((state) => state.removeToast);

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            type={toast.type}
            message={toast.message}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastProps {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  onClose: () => void;
}

function Toast({ id, type, message, onClose }: ToastProps) {
  const config = {
    success: {
      icon: CheckCircle2,
      className: "bg-emerald-50 border-emerald-200 text-emerald-900",
      iconClassName: "text-emerald-600",
    },
    error: {
      icon: AlertCircle,
      className: "bg-red-50 border-red-200 text-red-900",
      iconClassName: "text-red-600",
    },
    warning: {
      icon: AlertTriangle,
      className: "bg-orange-50 border-orange-200 text-orange-900",
      iconClassName: "text-orange-600",
    },
    info: {
      icon: Info,
      className: "bg-blue-50 border-blue-200 text-blue-900",
      iconClassName: "text-blue-600",
    },
  };

  const { icon: Icon, className, iconClassName } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`pointer-events-auto flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md ${className}`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconClassName}`} />
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className="flex-shrink-0 hover:opacity-70 transition-opacity"
        aria-label="Close notification"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
