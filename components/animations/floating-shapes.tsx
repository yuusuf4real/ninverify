"use client";

import { motion } from "framer-motion";

const particlePositions = [
  { left: 15, top: 25 },
  { left: 85, top: 45 },
  { left: 45, top: 75 },
  { left: 70, top: 15 },
  { left: 25, top: 60 },
  { left: 90, top: 80 }
];

export function FloatingShapes() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Large gradient orb - top left */}
      <motion.div
        className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-gradient-to-br from-primary/20 to-emerald-500/10 blur-3xl"
        animate={{
          x: [0, 30, 0],
          y: [0, 50, 0],
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Medium gradient orb - top right */}
      <motion.div
        className="absolute -right-32 top-40 h-80 w-80 rounded-full bg-gradient-to-br from-accent/15 to-blue-400/10 blur-3xl"
        animate={{
          x: [0, -40, 0],
          y: [0, 30, 0],
          scale: [1, 1.15, 1]
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 1
        }}
      />

      {/* Small gradient orb - bottom */}
      <motion.div
        className="absolute -bottom-20 left-1/3 h-64 w-64 rounded-full bg-gradient-to-br from-secondary/15 to-orange-400/10 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
      />

      {/* Floating particles */}
      {particlePositions.map((pos, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full bg-primary/20"
          style={{
            left: `${pos.left}%`,
            top: `${pos.top}%`
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.8
          }}
        />
      ))}
    </div>
  );
}
