"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  AnimatePresence,
} from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Shield,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedLogo } from "@/components/animations/animated-logo";
import { FloatingShapes } from "@/components/animations/floating-shapes";

// Diverse Nigerian names representing different ethnic groups and dual citizenship
const nigerianNames = [
  {
    name: "Aisha Olumide Yusuf",
    ethnicity: "Hausa-Yoruba",
    dob: "12 Nov 2006",
  },
  {
    name: "Chukwuemeka Adebayo Ibrahim",
    ethnicity: "Igbo-Yoruba-Hausa",
    dob: "23 Mar 1998",
  },
  { name: "Ngozi Fatima Bello", ethnicity: "Igbo-Hausa", dob: "08 Jul 2001" },
  {
    name: "Oluwaseun Chidinma Musa",
    ethnicity: "Yoruba-Igbo-Hausa",
    dob: "15 Jan 2003",
  },
  {
    name: "Emeka Abubakar Taiwo",
    ethnicity: "Igbo-Hausa-Yoruba",
    dob: "29 Sep 1999",
  },
  {
    name: "Blessing Zainab Okafor",
    ethnicity: "Igbo-Hausa",
    dob: "04 Dec 2004",
  },
  {
    name: "Tunde Chiamaka Hassan",
    ethnicity: "Yoruba-Igbo-Hausa",
    dob: "18 May 2000",
  },
  {
    name: "Amina Chinedu Adeleke",
    ethnicity: "Hausa-Igbo-Yoruba",
    dob: "21 Aug 2002",
  },
  {
    name: "Ekaette Usman Okoro",
    ethnicity: "Ibibio-Hausa-Igbo",
    dob: "07 Feb 1997",
  },
  {
    name: "Iniobong Adamu Bassey",
    ethnicity: "Efik-Hausa",
    dob: "14 Oct 2005",
  },
  {
    name: "Ogheneovo Yakubu Okpara",
    ethnicity: "Urhobo-Hausa-Igbo",
    dob: "26 Jun 2001",
  },
  {
    name: "Osagie Binta Okonkwo",
    ethnicity: "Edo-Hausa-Igbo",
    dob: "03 Apr 1996",
  },
  { name: "Akpan Folake Udoh", ethnicity: "Ibibio-Yoruba", dob: "19 Nov 2003" },
  { name: "Ifeoma Garba Nwosu", ethnicity: "Igbo-Hausa", dob: "11 Jan 2000" },
  {
    name: "Kelechi Aisha Williams",
    ethnicity: "Igbo-Hausa-British",
    dob: "25 Jul 1999",
  },
  {
    name: "Obinna James Anderson",
    ethnicity: "Igbo-American",
    dob: "09 Mar 2002",
  },
  { name: "Chioma Marie Dubois", ethnicity: "Igbo-French", dob: "16 Sep 1998" },
  {
    name: "Adebayo Michael Chen",
    ethnicity: "Yoruba-Chinese",
    dob: "22 Dec 2004",
  },
  {
    name: "Fatima Rose Martinez",
    ethnicity: "Hausa-Spanish",
    dob: "05 May 2001",
  },
  {
    name: "Chiamaka Sofia Rossi",
    ethnicity: "Igbo-Italian",
    dob: "30 Aug 2003",
  },
];

const staggerContainer = {
  hidden: { opacity: 1 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export function HeroSection() {
  const [currentNameIndex, setCurrentNameIndex] = useState(0);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 300], [0, 50]);

  // Rotate through names every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNameIndex((prev) => (prev + 1) % nigerianNames.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden pb-20 pt-6">
      <FloatingShapes />

      <div className="container relative z-10">
        {/* Navigation */}
        <motion.nav
          initial={{ y: 0, opacity: 1 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap items-center justify-between gap-6"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <AnimatedLogo />
            <div>
              <p className="text-lg font-semibold group-hover:text-primary transition-colors">
                VerifyNIN
              </p>
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Nigeria
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex">
            {[
              { label: "How it works", href: "#how-it-works" },
              { label: "Privacy", href: "/privacy" },
              { label: "Terms", href: "/terms" },
            ].map((item, i) => (
              <motion.a
                key={item.label}
                href={item.href}
                className="hover:text-foreground transition-colors relative group"
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
              >
                {item.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 1, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hover:scale-105 transition-transform"
            >
              <Link href="/login">Sign in</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="hover:scale-105 transition-transform"
            >
              <Link href="/register">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </motion.nav>

        {/* Hero Content */}
        <div className="mt-20 grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="space-y-8"
            style={{ y }}
          >
            <motion.div variants={staggerItem}>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 border border-green-300 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <span className="text-sm font-semibold">
                  NIMC-Verified • Secure • Instant
                </span>
              </div>
            </motion.div>

            <motion.h1
              variants={staggerItem}
              className="font-heading text-5xl font-bold leading-tight md:text-6xl lg:text-7xl bg-gradient-to-br from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent"
            >
              Verify Your NIN{" "}
              <span className="bg-gradient-to-r from-green-600 via-emerald-500 to-green-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                in Minutes
              </span>
            </motion.h1>

            <motion.p
              variants={staggerItem}
              className="text-xl text-muted-foreground max-w-2xl leading-relaxed"
            >
              Official NIN verification service for banking, education, travel, and 
              government requirements. Get your NIMC-verified document instantly.
            </motion.p>

            <motion.div variants={staggerItem} className="flex flex-wrap gap-4">
              <Button
                size="lg"
                asChild
                className="group hover:shadow-glow transition-all"
              >
                <Link href="/register">
                  Start verification
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="hover:bg-primary/5"
              >
                <Link href="#how-it-works">See how it works</Link>
              </Button>
            </motion.div>

            <motion.div
              variants={staggerContainer}
              className="flex flex-wrap gap-6 text-sm"
            >
              {[
                { icon: Shield, text: "Secure verification" },
                { icon: Zap, text: "Instant processing" },
                { icon: Clock, text: "Available 24/7" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  variants={staggerItem}
                  className="flex items-center gap-2 text-muted-foreground group"
                >
                  <item.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                  <span className="group-hover:text-foreground transition-colors">
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Animated Card */}
          <motion.div
            initial={{ opacity: 1, x: 0, rotateY: 0 }}
            animate={{ opacity: 1, x: 0, rotateY: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
            className="relative perspective-1000"
          >
            {/* Floating orbs */}
            <motion.div
              className="absolute -left-8 -top-8 h-40 w-40 rounded-full bg-primary/20 blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -bottom-10 -right-6 h-40 w-40 rounded-full bg-accent/20 blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />

            <motion.div
              className="glass relative space-y-6 rounded-[32px] p-8 shadow-card hover:shadow-glow transition-shadow"
              whileHover={{ scale: 1.02, rotateY: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Image
                src="/images/naija.png"
                alt=""
                width={96}
                height={96}
                aria-hidden="true"
                unoptimized
                className="pointer-events-none absolute right-6 top-6 h-16 w-16 opacity-10"
              />
              <div className="flex items-center justify-between">
                <div>
                  <motion.p
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    NIMC Snapshot
                  </motion.p>
                  <p className="text-xl font-bold mt-1">
                    Verification Document
                  </p>
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <Sparkles className="h-6 w-6 text-secondary" />
                </motion.div>
              </div>

              <div className="grid gap-4">
                <motion.div
                  className="rounded-2xl border border-border/70 bg-gradient-to-br from-white/90 to-white/70 p-5"
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <p className="text-xs text-muted-foreground mb-2">
                    Candidate
                  </p>
                  <div className="relative h-7 overflow-hidden">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentNameIndex}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{ duration: 0.5, ease: "easeInOut" }}
                        className="text-lg font-bold absolute inset-0"
                      >
                        {nigerianNames[currentNameIndex].name}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                  <div className="relative h-5 overflow-hidden mt-1">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`dob-${currentNameIndex}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        transition={{
                          duration: 0.5,
                          ease: "easeInOut",
                          delay: 0.1,
                        }}
                        className="text-sm text-muted-foreground absolute inset-0"
                      >
                        DOB: {nigerianNames[currentNameIndex].dob}
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </motion.div>

                <motion.div
                  className="flex items-center gap-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-emerald-500/5 p-5"
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary"
                    animate={{ rotate: [0, 360] }}
                    transition={{
                      duration: 20,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                  >
                    <CheckCircle2 className="h-6 w-6" />
                  </motion.div>
                  <div>
                    <p className="text-sm font-bold">
                      NIN verified successfully
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Official NIMC verification
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.div
                className="relative h-48 w-full overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=800&q=80')] bg-cover bg-center opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-xs font-semibold">Verified Identity</p>
                  <p className="text-sm opacity-90">Ready for Any Purpose</p>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
