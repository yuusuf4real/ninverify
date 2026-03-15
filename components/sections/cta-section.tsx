"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Zap } from "lucide-react";

const sparklePositions = [
  { left: 20, top: 15 },
  { left: 80, top: 25 },
  { left: 45, top: 70 },
  { left: 65, top: 40 },
  { left: 30, top: 85 },
  { left: 90, top: 60 },
  { left: 15, top: 50 },
  { left: 75, top: 80 },
];

export function CTASection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[40px] border border-border/60 bg-gradient-to-br from-primary via-emerald-600 to-emerald-700 p-12 md:p-16 text-white shadow-2xl"
        >
          {/* Animated background elements */}
          <motion.div
            className="absolute right-10 top-10 h-32 w-32 rounded-full bg-white/10 blur-3xl"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-8 left-12 h-32 w-32 rounded-full bg-white/10 blur-3xl"
            animate={{
              scale: [1, 1.4, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1,
            }}
          />

          {/* Floating sparkles */}
          {sparklePositions.map((pos, i) => (
            <motion.div
              key={i}
              className="absolute"
              style={{
                left: `${pos.left}%`,
                top: `${pos.top}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 3 + i * 0.3,
                repeat: Infinity,
                delay: i * 0.4,
              }}
            >
              <Sparkles className="h-4 w-4 text-white/60" />
            </motion.div>
          ))}

          <div className="relative space-y-8 max-w-3xl">
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm mb-6">
                <Zap className="h-4 w-4" />
                <span className="text-sm font-semibold">Start in seconds</span>
              </div>
            </motion.div>

            <motion.h2
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="font-heading text-4xl md:text-5xl font-bold leading-tight"
            >
              Ready to verify your NIN?
            </motion.h2>

            <motion.p
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-lg md:text-xl text-white/90 leading-relaxed"
            >
              Register once, fund your wallet, and verify any candidate NIN
              instantly. Every verification document is formatted for official
              submissions and onboarding.
            </motion.p>

            <motion.div
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Button
                variant="secondary"
                size="lg"
                asChild
                className="group hover:scale-105 transition-transform shadow-xl"
              >
                <Link href="/register">
                  Create your account
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="bg-white/10 border-white/30 hover:bg-white/20 text-white hover:scale-105 transition-transform"
              >
                <Link href="/dashboard">Go to dashboard</Link>
              </Button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-8 pt-6 border-t border-white/20"
            >
              {[
                { label: "Verification time", value: "< 10 sec" },
                { label: "Success rate", value: "99.9%" },
                { label: "Cost per NIN", value: "₦500" },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <p className="text-2xl md:text-3xl font-bold">{stat.value}</p>
                  <p className="text-sm text-white/70">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
