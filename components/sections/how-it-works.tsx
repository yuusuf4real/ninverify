"use client";

import { motion } from "framer-motion";
import { SectionTitle } from "@/components/atoms/section-title";
import { Card } from "@/components/ui/card";
import { ArrowRight, CreditCard, Fingerprint, FileCheck2 } from "lucide-react";

const steps = [
  {
    title: "Verify your phone number",
    description:
      "Enter your phone number and verify with the OTP code we send you.",
    icon: CreditCard,
    color: "from-emerald-500 to-primary",
  },
  {
    title: "Enter NIN & select data",
    description:
      "Provide the 11-digit NIN and choose what information you need to see.",
    icon: Fingerprint,
    color: "from-blue-500 to-accent",
  },
  {
    title: "Pay & get results instantly",
    description:
      "Secure payment via Paystack, then receive your official NIMC verification document.",
    icon: FileCheck2,
    color: "from-orange-500 to-secondary",
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 relative overflow-hidden">
      {/* Animated background */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="container relative z-10 space-y-16">
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <SectionTitle
            eyebrow="How it works"
            title="No registration required"
            description="Simple phone verification, then pay only for what you need to see."
          />
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
            >
              <Card className="group relative overflow-hidden border-border/60 bg-white/80 hover:shadow-glow transition-all duration-300 h-full">
                {/* Step number */}
                <motion.div
                  className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-transparent flex items-center justify-center"
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.2 + 0.3 }}
                >
                  <span className="text-4xl font-bold text-primary/30">
                    {index + 1}
                  </span>
                </motion.div>

                <div className="relative space-y-5 p-8">
                  {/* Animated icon */}
                  <motion.div
                    className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${step.color} text-white shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ type: "spring", stiffness: 400 }}
                  >
                    <step.icon className="h-8 w-8" />
                  </motion.div>

                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow connector */}
                {index < steps.length - 1 && (
                  <motion.div
                    className="absolute -right-4 top-1/2 -translate-y-1/2 hidden md:flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-lg z-10"
                    initial={{ scale: 0, x: -20 }}
                    whileInView={{ scale: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: index * 0.2 + 0.5 }}
                  >
                    <motion.div
                      animate={{
                        x: [0, 5, 0],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    >
                      <ArrowRight className="h-5 w-5 text-primary" />
                    </motion.div>
                  </motion.div>
                )}

                {/* Progress bar */}
                <motion.div
                  className={`absolute bottom-0 left-0 h-1.5 bg-gradient-to-r ${step.color}`}
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.2 + 0.4 }}
                />
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
