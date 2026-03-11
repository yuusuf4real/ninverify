"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { AnimatedLogo } from "@/components/animations/animated-logo";
import { Facebook, Twitter, Mail, ArrowUp } from "lucide-react";
import { useState, useEffect } from "react";

export function FooterSection() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative border-t border-border/70 bg-white/70 backdrop-blur-sm py-16">
      <div className="container">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <AnimatedLogo />
              <div className="space-y-1">
                <Image
                  src="/images/logo-wordmark.svg"
                  alt="VerifyNIN wordmark"
                  width={150}
                  height={40}
                  className="h-7 w-auto"
                />
                <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Nigeria
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Fast, secure, and NDPR-compliant NIN verification for all your needs.
            </p>
            <div className="flex items-center gap-3">
              <motion.a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Twitter className="h-4 w-4" />
              </motion.a>
              <motion.a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Facebook className="h-4 w-4" />
              </motion.a>
              <motion.a
                href="mailto:support@verifynin.ng"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors"
                whileHover={{ scale: 1.1, rotate: 5 }}
                whileTap={{ scale: 0.95 }}
              >
                <Mail className="h-4 w-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Product */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-foreground">Product</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { label: "Features", href: "#features" },
                { label: "How it works", href: "#how-it-works" },
                { label: "Use cases", href: "#use-cases" },
                { label: "Privacy & Security", href: "#security" }
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-primary transition-colors inline-flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-foreground">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[{ label: "Contact Us", href: "/support" }].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-primary transition-colors inline-flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-foreground">Legal</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {[
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" }
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-primary transition-colors inline-flex items-center group"
                  >
                    <span className="group-hover:translate-x-1 transition-transform">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 1 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-border/70 flex flex-wrap items-center justify-between gap-4"
        >
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} VerifyNIN. All rights reserved.
          </p>
          <a
            href="mailto:support@verifynin.ng"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            support@verifynin.ng
          </a>
        </motion.div>
      </div>

      {/* Scroll to top button */}
      {showScrollTop && (
        <motion.button
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-glow hover:scale-110 transition-transform"
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <ArrowUp className="h-5 w-5" />
        </motion.button>
      )}
    </footer>
  );
}
