"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SectionTitle } from "@/components/atoms/section-title";
import {
  CreditCard,
  FileCheck2,
  Fingerprint,
  RefreshCcw,
  ShieldCheck,
  Wallet
} from "lucide-react";

const features = [
  {
    title: "Wallet funding with Paystack",
    description: "Add ₦500 or more via card or bank transfer with instant confirmation.",
    icon: Wallet,
    color: "from-emerald-500/20 to-primary/10"
  },
  {
    title: "11-digit NIN formatting",
    description: "Smart input keeps the NIN readable and validates before submission.",
    icon: Fingerprint,
    color: "from-blue-500/20 to-accent/10"
  },
  {
    title: "Consent-first verification",
    description: "NDPR-compliant consent capture before every identity check.",
    icon: ShieldCheck,
    color: "from-purple-500/20 to-primary/10"
  },
  {
    title: "YouVerify instant lookup",
    description: "Real-time NIMC data response for name, DOB, and phone number.",
    icon: FileCheck2,
    color: "from-orange-500/20 to-secondary/10"
  },
  {
    title: "Auto-refund on failure",
    description: "No charge for invalid NINs; wallet refunds happen instantly.",
    icon: RefreshCcw,
    color: "from-pink-500/20 to-secondary/10"
  },
  {
    title: "Verification document",
    description: "Download an official verification document with verified identity data for any purpose.",
    icon: CreditCard,
    color: "from-teal-500/20 to-accent/10"
  }
];

const container = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
};

const item = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

export function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
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
              eyebrow="Features"
              title="Built for reliable NIN verification"
              description="Every feature designed for fast, secure verification: wallet funding, NIN validation, and instant verification documents."
            />
            <motion.div
              initial={{ scale: 1 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
            >
              <Badge variant="warning" className="text-base px-4 py-2">
                ₦500 per verification
              </Badge>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
        >
          {features.map((feature, index) => (
            <motion.div key={feature.title} variants={item}>
              <Card className="group relative overflow-hidden border-border/60 bg-white/80 hover:shadow-glow transition-all duration-300 h-full">
                {/* Gradient background on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                
                <div className="relative space-y-4 p-6">
                  <motion.div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary group-hover:scale-110 group-hover:rotate-6 transition-all duration-300"
                    whileHover={{ rotate: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <feature.icon className="h-6 w-6" />
                  </motion.div>
                  
                  <h3 className="text-xl font-bold group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
                
                {/* Animated border */}
                <motion.div
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-emerald-500"
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                />
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
