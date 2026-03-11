"use client";

import { motion } from "framer-motion";
import {
  Building2,
  GraduationCap,
  Plane,
  Briefcase,
  Smartphone,
  Landmark
} from "lucide-react";

const fadeIn = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const useCases = [
  {
    icon: Building2,
    title: "Banking & Finance",
    description: "Open bank accounts, link BVN, comply with CBN requirements",
    color: "from-blue-500 to-cyan-500",
    bgColor: "bg-blue-50",
    iconColor: "text-blue-600"
  },
  {
    icon: GraduationCap,
    title: "Education",
    description: "JAMB, WAEC, NECO, NYSC registration and scholarships",
    color: "from-green-500 to-emerald-500",
    bgColor: "bg-green-50",
    iconColor: "text-green-600"
  },
  {
    icon: Plane,
    title: "Travel & Immigration",
    description: "Passport applications, visa requirements, and travel documents",
    color: "from-purple-500 to-pink-500",
    bgColor: "bg-purple-50",
    iconColor: "text-purple-600"
  },
  {
    icon: Briefcase,
    title: "Employment",
    description: "Job applications, professional certifications, and HR verification",
    color: "from-orange-500 to-red-500",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600"
  },
  {
    icon: Smartphone,
    title: "Telecommunications",
    description: "SIM card registration, activation, and mobile services",
    color: "from-indigo-500 to-blue-500",
    bgColor: "bg-indigo-50",
    iconColor: "text-indigo-600"
  },
  {
    icon: Landmark,
    title: "Government Services",
    description: "Driver's license, voter registration, and official documents",
    color: "from-amber-500 to-yellow-500",
    bgColor: "bg-amber-50",
    iconColor: "text-amber-600"
  }
];

export function UseCasesSection() {
  return (
    <section id="use-cases" className="py-20 bg-gradient-to-b from-background to-muted/30">
      <div className="container">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeIn}
          className="mx-auto max-w-3xl text-center mb-16"
        >
          <motion.div
            variants={fadeIn}
            className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
          >
            Why Verify Your NIN?
          </motion.div>
          
          <motion.h2
            variants={fadeIn}
            className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl mb-4"
          >
            One Platform,{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Multiple Uses
            </span>
          </motion.h2>
          
          <motion.p
            variants={fadeIn}
            className="text-lg text-muted-foreground"
          >
            Your NIN is required for almost everything in Nigeria today. 
            Get verified once, use it everywhere.
          </motion.p>
        </motion.div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {useCases.map((useCase, index) => (
            <motion.div
              key={index}
              variants={fadeIn}
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6 shadow-sm hover:shadow-lg transition-all"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${useCase.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
              
              <div className="relative">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${useCase.bgColor} group-hover:scale-110 transition-transform`}>
                  <useCase.icon className={`h-6 w-6 ${useCase.iconColor}`} />
                </div>
                
                <h3 className="mb-2 text-lg font-semibold group-hover:text-primary transition-colors">
                  {useCase.title}
                </h3>
                
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {useCase.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 1, y: 0 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <p className="text-sm text-muted-foreground">
            And many more use cases across Nigeria&apos;s digital economy
          </p>
        </motion.div>
      </div>
    </section>
  );
}
