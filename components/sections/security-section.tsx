"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "@/components/atoms/section-title";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  ShieldCheck,
  Smartphone,
  Eye,
  Database,
  FileKey,
} from "lucide-react";

const safeguards = [
  {
    title: "Consent-driven requests",
    description:
      "Every verification requires explicit consent recorded per request.",
    icon: ShieldCheck,
    color: "from-emerald-500/20 to-primary/10",
  },
  {
    title: "Masked NIN history",
    description: "Transaction logs only store masked NIN values for privacy.",
    icon: Eye,
    color: "from-blue-500/20 to-accent/10",
  },
  {
    title: "Encrypted data storage",
    description: "All sensitive data is encrypted at rest and in transit.",
    icon: Lock,
    color: "from-purple-500/20 to-primary/10",
  },
  {
    title: "Document access on any device",
    description:
      "Download verification documents securely from mobile or desktop dashboards.",
    icon: Smartphone,
    color: "from-orange-500/20 to-secondary/10",
  },
  {
    title: "Audit trail logging",
    description: "Complete audit logs for compliance and transparency.",
    icon: Database,
    color: "from-pink-500/20 to-secondary/10",
  },
  {
    title: "Secure API integration",
    description: "Industry-standard security with YouVerify and Paystack.",
    icon: FileKey,
    color: "from-teal-500/20 to-accent/10",
  },
];

export function SecuritySection() {
  return (
    <section
      id="security"
      className="py-24 relative overflow-hidden bg-gradient-to-b from-transparent via-muted/30 to-transparent"
    >
      {/* Animated grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="container relative z-10 space-y-16">
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mx-auto max-w-3xl"
        >
          <div className="flex flex-col items-center gap-6">
            <SectionTitle
              eyebrow="Privacy & Security"
              title="NDPR-aligned safeguards for candidate data"
              description="NIN verification handles sensitive identity data. Every piece of information is stored minimally and securely."
            />
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            >
              <Badge variant="success" className="text-base px-4 py-2">
                <ShieldCheck className="h-4 w-4 mr-2" />
                NDPR Compliant
              </Badge>
            </motion.div>
          </div>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {safeguards.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="group relative overflow-hidden border-border/60 bg-white/90 hover:shadow-glow transition-all duration-300 h-full">
                {/* Gradient overlay on hover */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${item.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />

                <div className="relative space-y-4 p-6">
                  {/* Icon with animation */}
                  <motion.div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-all duration-300"
                    whileHover={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.5 }}
                  >
                    <item.icon className="h-6 w-6" />
                  </motion.div>

                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Animated corner accent */}
                <motion.div
                  className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-full"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 + 0.2 }}
                />
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex flex-wrap items-center justify-center gap-8 pt-8"
        >
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-5 w-5 text-primary" />
            </div>
            <span>256-bit SSL Encryption</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <span>NDPR Compliant</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <span>Secure Data Storage</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
