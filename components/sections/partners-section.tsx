"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Shield, CheckCircle2, FileCheck } from "lucide-react";

const officialSources = [
  {
    name: "NIMC",
    fullName: "National Identity Management Commission",
    description: "Official NIN database authority",
    accent: "text-emerald-700",
    type: "logo" as const,
    logo: "/images/nimc.png"
  },
  {
    name: "Federal Identity",
    fullName: "National Identity & Records",
    description: "Official records used for compliant verification",
    accent: "text-emerald-700",
    type: "logo" as const,
    logo: "/images/naija.png"
  }
];

const features = [
  {
    icon: CheckCircle2,
    title: "Application-ready",
    description: "Receipts formatted for official submissions and onboarding"
  },
  {
    icon: FileCheck,
    title: "NIMC-Verified",
    description: "Direct integration with official NIN database"
  },
  {
    icon: Shield,
    title: "Secure & Trusted",
    description: "Government-approved verification process"
  }
];

export function PartnersSection() {
  return (
    <section className="py-16 bg-gradient-to-b from-muted/30 to-background">
      <div className="container">
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-4 mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold">
            <Shield className="h-4 w-4" />
            <span>Trusted & Compliant</span>
          </div>
          <h2 className="font-heading text-3xl md:text-4xl font-bold">
            Powered by Official Sources
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Our verification service integrates directly with government-approved databases
            to ensure authenticity and compliance
          </p>
        </motion.div>

        {/* Partner Cards */}
        <div className="mb-12 max-w-4xl mx-auto">
          <div className="rounded-3xl border border-border/60 bg-white/80 p-6 md:p-8">
            <div className="grid gap-6 sm:grid-cols-2">
              {officialSources.map((source, i) => (
                <motion.div
                  key={source.name}
                  initial={{ opacity: 1, y: 0 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 text-center hover:shadow-lg transition-all"
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted">
                      {source.type === "logo" ? (
                        <Image
                          src={source.logo}
                          alt={`${source.name} logo.`}
                          width={72}
                          height={72}
                          unoptimized
                          className="h-16 w-16 object-contain"
                        />
                      ) : (
                        <span className={`text-3xl font-heading font-bold ${source.accent}`}>
                          {source.name}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-heading text-xl font-bold mb-1">
                        {source.name}
                      </h3>
                      <p className="text-sm font-medium text-muted-foreground mb-2">
                        {source.fullName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {source.description}
                      </p>
                    </div>
                  </div>

                  <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl group-hover:scale-150 transition-transform" />
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 1, y: 0 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="text-center space-y-3"
            >
              <div className="inline-flex p-3 rounded-xl bg-primary/10 text-primary">
                <feature.icon className="h-6 w-6" />
              </div>
              <h4 className="font-semibold">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Compliance Notice */}
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 max-w-3xl mx-auto"
        >
          <div className="relative overflow-hidden rounded-xl border border-border/60 bg-muted/30 p-6 text-center">
            <Image
              src="/images/naija.png"
              alt=""
              width={140}
              height={140}
              aria-hidden="true"
              unoptimized
              className="pointer-events-none absolute -right-6 -bottom-6 h-24 w-24 opacity-10"
            />
            <p className="relative text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">Official Compliance:</span> All NIN verifications
              are performed through authorized channels and generate official verification documents accepted
              for banking, education, travel, employment, and government services across Nigeria.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
