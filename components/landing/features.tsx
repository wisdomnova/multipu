"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/components/motion";
import {
  Layers,
  Rocket,
  BarChart3,
  Shield,
  Globe,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: Layers,
    label: "// Token Deploy",
    title: "One-Click Token Creation",
    description:
      "Deploy your SPL token with custom name, symbol, supply, and metadata. No CLI needed.",
    wide: true,
  },
  {
    icon: Rocket,
    label: "// Multi-Launch",
    title: "Multi-Launchpad Push",
    description:
      "Select Meteora, Bags, Pump.fun, or all three. Auto-fill details and launch simultaneously.",
  },
  {
    icon: BarChart3,
    label: "// Earnings",
    title: "Revenue Tracking",
    description:
      "Track creator fees and earnings from each launchpad in real-time.",
  },
  {
    icon: Shield,
    label: "// Security",
    title: "Wallet-Native Auth",
    description: "Connect your Solana wallet. No accounts, no passwords. Your keys, your tokens.",
  },
  {
    icon: Globe,
    label: "// Status",
    title: "Live Deployment Status",
    description:
      "Monitor every launch - see what's live, pending, or completed across all platforms.",
  },
  {
    icon: Zap,
    label: "// Speed",
    title: "Fast Execution",
    description:
      "Optimized for Solana's speed. Deploy and launch in seconds, not minutes.",
    wide: true,
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="mb-16"
        >
          <motion.span
            variants={fadeUp}
            className="font-mono text-xs text-accent uppercase tracking-widest"
          >
            Features
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight"
          >
            Everything you need to launch
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-text-secondary max-w-xl text-lg"
          >
            From token creation to multi-platform distribution - all from one
            dashboard.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border border border-border"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={fadeUp}
              className={`group relative p-8 md:p-10 bg-background hover:bg-elevated transition-colors duration-300 ${
                feature.wide ? "md:col-span-2" : ""
              }`}
            >
              {/* Hover glow */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-accent/[0.03] to-transparent" />

              <span className="relative font-mono text-[0.65rem] text-text-dim uppercase tracking-[0.15em]">
                {feature.label}
              </span>
              <div className="relative mt-4 flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:border-accent/40 transition-colors">
                  <feature.icon size={18} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-primary">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm text-text-secondary leading-relaxed max-w-sm">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
