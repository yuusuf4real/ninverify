"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

interface EnhancedLogoProps {
  size?: "default" | "large";
  variant?: "simple" | "glow" | "morph";
}

export function EnhancedLogo({
  size = "default",
  variant = "glow",
}: EnhancedLogoProps) {
  const logoRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const dimensions = size === "large" ? "h-16 w-16" : "h-11 w-11";
  const iconSize = size === "large" ? "h-12 w-12" : "h-9 w-9";

  return (
    <motion.div
      ref={logoRef}
      className={`relative flex ${dimensions} items-center justify-center overflow-hidden rounded-2xl bg-white shadow-glow`}
      whileHover={{
        scale: variant === "simple" ? 1.05 : 1.1,
        rotate: variant === "morph" ? 0 : 3,
      }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      {/* Animated glow background */}
      {variant === "glow" && (
        <div
          ref={glowRef}
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/30 to-accent/20 blur-sm animate-pulse-glow"
        />
      )}

      {/* Base background */}
      <motion.div
        className="absolute inset-0 rounded-2xl bg-primary/10"
        animate={{
          scale: variant === "simple" ? [1, 1.05, 1] : [1, 1.12, 1],
          opacity: [0.5, 0.1, 0.5],
        }}
        transition={{
          duration: variant === "morph" ? 3 : 2.2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Logo icon */}
      <motion.div
        className={`relative ${iconSize} z-10`}
        animate={{
          y: variant === "morph" ? [0, -3, 0] : [0, -2, 0],
          rotateY: variant === "morph" ? [0, 180, 360] : 0,
        }}
        transition={{
          duration: variant === "morph" ? 4 : 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <Image
          src="/images/logo-mark.svg"
          alt="VerifyNIN logo"
          fill
          className="object-contain"
        />
      </motion.div>

      {/* Particle effects for morph variant */}
      {variant === "morph" && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/60 rounded-full"
              style={{
                left: `${20 + i * 10}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                scale: [0, 1, 0],
                opacity: [0, 1, 0],
                rotate: [0, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: "easeInOut",
              }}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
