/**
 * Global Loading Overlay Component
 * Displays a full-screen loading overlay with optional message
 */

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useGlobalLoading, useUIStore } from "@/store/ui-store";

export function LoadingOverlay() {
  const globalLoading = useGlobalLoading();
  const loadingMessage = useUIStore((state) => state.loadingMessage);

  return (
    <AnimatePresence>
      {globalLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 max-w-sm mx-4"
          >
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
            {loadingMessage && (
              <p className="text-center text-gray-700 font-medium">
                {loadingMessage}
              </p>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
