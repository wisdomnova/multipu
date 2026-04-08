"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/components/motion";
import { ArrowRight, Zap } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden dot-grid">
      {/* Gradient orb */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-accent/[0.07] blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

      <div className="relative z-20 mx-auto max-w-[1400px] px-6 md:px-10 pt-24 pb-20">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col items-center text-center"
        >
          {/* Status badge */}
          {/* <motion.div variants={fadeUp} className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border bg-elevated font-mono text-xs text-text-muted">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
              <span>v0.1.0 - Building in public</span>
            </div>
          </motion.div> */}

          {/* Brand mark */}
          {/* <motion.div variants={fadeUp} className="mb-8">
            <div className="relative w-20 h-20 mx-auto">
              <Image
                src="/1.jpg"
                alt="Multipu"
                fill
                className="object-cover rounded-2xl border border-border"
                priority
              />
            </div>
          </motion.div> */}

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold leading-[1.05] tracking-tight max-w-4xl"
          >
            Deploy once.{" "}
            <span className="gradient-text">Launch everywhere.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl leading-relaxed"
          >
            The multi-launchpad deployer for Solana tokens. Create your token,
            push it to multiple launchpads, and track everything from one
            dashboard.
          </motion.p>

          {/* CTAs */}
          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col sm:flex-row items-center gap-4"
          >
            <Link
              href="/launch"
              className="group inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(139,92,246,0.35)]"
            >
              Launch a Token
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-medium text-text-primary bg-transparent border border-border hover:border-border-hover hover:bg-elevated rounded-full transition-all duration-300"
            >
              View Dashboard
            </Link>
          </motion.div>

          {/* Metrics */}
          <motion.div
            variants={fadeUp}
            className="mt-20 grid grid-cols-3 gap-8 md:gap-16"
          >
            {[
              { value: "3", label: "Launchpads" },
              { value: "1-Click", label: "Deploy" },
              { value: "Real-time", label: "Tracking" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl md:text-3xl font-bold font-mono text-text-primary">
                  {stat.value}
                </div>
                <div className="mt-1 text-xs font-mono text-text-muted uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
