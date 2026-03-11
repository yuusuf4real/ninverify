"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function AnimatedLogo({ size = "default" }: { size?: "default" | "large" }) {
  const dimensions = size === "large" ? "h-16 w-16" : "h-11 w-11";
  const iconSize = size === "large" ? "h-12 w-12" : "h-9 w-9";

  return (
    <motion.div
      className={`relative flex ${dimensions} items-center justify-center overflow-hidden rounded-2xl bg-white shadow-glow`}
      whileHover={{ scale: 1.05, rotate: 3 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <motion.div
        className="absolute inset-0 rounded-2xl bg-primary/10"
        animate={{
          scale: [1, 1.12, 1],
          opacity: [0.5, 0.1, 0.5]
        }}
        transition={{
          duration: 2.2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className={`relative ${iconSize}`}
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <Image
          src="/images/logo-mark.svg"
          alt="VerifyNIN logo"
          fill
          className="object-contain"
        />
      </motion.div>
    </motion.div>
  );
}
