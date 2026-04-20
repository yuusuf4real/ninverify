"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { AnimatedLogo } from "@/components/animations/animated-logo";

export function FooterSection() {
  return (
    <footer className="border-t border-border/50 bg-white/50 py-8">
      <div className="container">
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col items-center gap-6 text-center"
        >
          {/* Logo */}
          <div className="flex items-center gap-3">
            <AnimatedLogo />
            <div>
              <p className="text-lg font-semibold">VerifyNIN</p>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Nigeria
              </p>
            </div>
          </div>

          {/* Essential Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/support"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Support
            </Link>
          </div>

          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VerifyNIN. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}