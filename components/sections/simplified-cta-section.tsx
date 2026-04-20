"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, CheckCircle2 } from "lucide-react";

export function SimplifiedCTASection() {
  return (
    <section className="py-16 relative overflow-hidden">
      <div className="container relative z-10">
        <motion.div
          initial={{ opacity: 1, scale: 1 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-8 max-w-4xl mx-auto"
        >
          <motion.h2
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="font-heading text-3xl md:text-4xl font-bold leading-tight"
          >
            NIN Verification Service
          </motion.h2>

          <motion.p
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto"
          >
            Secure, official NIN verification service. Generate verified
            documents for official use.
          </motion.p>

          {/* Simple feature highlights */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex flex-wrap justify-center gap-8 text-sm"
          >
            {[
              { icon: Shield, text: "NIMC-Verified" },
              { icon: Clock, text: "Instant Processing" },
              { icon: CheckCircle2, text: "Official Documents" },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <item.icon className="h-4 w-4 text-primary" />
                <span>{item.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Action buttons */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Button size="lg" asChild className="group">
              <Link href="/register">
                Get Started
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/dashboard">Access Dashboard</Link>
            </Button>
          </motion.div>

          {/* Simple stats */}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap justify-center gap-8 pt-8 border-t border-border/50"
          >
            {[
              { label: "Processing Time", value: "< 10 seconds" },
              { label: "Verification Cost", value: "₦500" },
              { label: "Success Rate", value: "99.9%" },
            ].map((stat, i) => (
              <div key={i} className="text-center space-y-1">
                <p className="text-xl font-semibold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
