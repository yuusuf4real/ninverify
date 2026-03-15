"use client";

import React, { memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AnimatedLogoLoaderProps {
  show?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  variant?: "default" | "overlay" | "inline";
  message?: string;
  className?: string;
}

const sizeConfig = {
  sm: { logo: 32, container: "h-16 w-16" },
  md: { logo: 48, container: "h-24 w-24" },
  lg: { logo: 64, container: "h-32 w-32" },
  xl: { logo: 80, container: "h-40 w-40" },
};

export const AnimatedLogoLoader = memo<AnimatedLogoLoaderProps>(
  ({
    show = true,
    size = "md",
    variant = "default",
    message = "Loading...",
    className = "",
  }) => {
    const config = sizeConfig[size];

    const logoAnimation = {
      initial: { scale: 0.8, opacity: 0 },
      animate: {
        scale: [0.8, 1.1, 1],
        opacity: 1,
        transition: {
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut",
        },
      },
      exit: { scale: 0.8, opacity: 0 },
    };

    const pulseAnimation = {
      initial: { scale: 1, opacity: 0.3 },
      animate: {
        scale: [1, 1.4, 1],
        opacity: [0.3, 0.1, 0.3],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        },
      },
    };

    const shieldAnimation = {
      initial: { pathLength: 0, opacity: 0 },
      animate: {
        pathLength: 1,
        opacity: 1,
        transition: {
          duration: 2,
          repeat: Infinity,
          repeatType: "reverse" as const,
          ease: "easeInOut",
        },
      },
    };

    if (!show) return null;

    const LoaderContent = () => (
      <div
        className={cn("flex flex-col items-center justify-center", className)}
      >
        <div
          className={cn(
            "relative flex items-center justify-center",
            config.container,
          )}
        >
          {/* Pulse rings */}
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/20"
            variants={pulseAnimation}
            initial="initial"
            animate="animate"
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-primary/30"
            variants={pulseAnimation}
            initial="initial"
            animate="animate"
            transition={{ delay: 0.3 }}
          />

          {/* Main logo container */}
          <motion.div
            className="relative z-10 flex items-center justify-center rounded-full bg-white shadow-lg"
            style={{ width: config.logo, height: config.logo }}
            variants={logoAnimation}
            initial="initial"
            animate="animate"
          >
            <Image
              src="/images/logo-mark.svg"
              alt="VerifyNIN"
              width={config.logo * 0.7}
              height={config.logo * 0.7}
              className="object-contain"
            />
          </motion.div>

          {/* Animated shield overlay */}
          <motion.svg
            className="absolute inset-0 z-20"
            viewBox="0 0 100 100"
            initial="initial"
            animate="animate"
          >
            <motion.path
              d="M50 10 L20 25 L20 50 C20 70 35 85 50 90 C65 85 80 70 80 50 L80 25 Z"
              fill="none"
              stroke="url(#gradient)"
              strokeWidth="2"
              variants={shieldAnimation}
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
          </motion.svg>
        </div>

        {message && (
          <motion.p
            className="mt-4 text-sm font-medium text-gray-600"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            {message}
          </motion.p>
        )}
      </div>
    );

    if (variant === "overlay") {
      return (
        <AnimatePresence>
          {show && (
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-white/95 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <LoaderContent />
            </motion.div>
          )}
        </AnimatePresence>
      );
    }

    return <LoaderContent />;
  },
);

AnimatedLogoLoader.displayName = "AnimatedLogoLoader";
