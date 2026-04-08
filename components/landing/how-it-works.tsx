"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/components/motion";
import { Wallet, Coins, Rocket, BarChart3 } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Wallet,
    title: "Connect Wallet",
    description: "Link your Solana wallet to get started. Phantom, Solflare, or any compatible wallet.",
  },
  {
    number: "02",
    icon: Coins,
    title: "Create Token",
    description: "Set your token name, symbol, supply, and metadata. We handle the on-chain deployment.",
  },
  {
    number: "03",
    icon: Rocket,
    title: "Select Launchpads",
    description: "Choose Meteora, Bags, Pump.fun, or all three. Token details auto-fill. Confirm and launch.",
  },
  {
    number: "04",
    icon: BarChart3,
    title: "Track Everything",
    description: "Monitor deployment status, live launchpads, and earnings - all from your dashboard.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-24 md:py-32 dot-grid">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={stagger}
          className="mb-16 text-center"
        >
          <motion.span
            variants={fadeUp}
            className="font-mono text-xs text-accent uppercase tracking-widest"
          >
            How it works
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight"
          >
            Four steps to launch
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-text-secondary max-w-xl mx-auto text-lg"
          >
            From wallet connection to live tracking in under 5 minutes.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              variants={fadeUp}
              className="group relative"
            >
              <div className="relative p-8 rounded-none border border-border bg-background hover:bg-elevated transition-all duration-300">
                {/* Connecting line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 w-6 h-px bg-border" />
                )}

                <span className="font-mono text-3xl font-bold text-accent/20 group-hover:text-accent/40 transition-colors">
                  {step.number}
                </span>
                <div className="mt-4 w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center group-hover:border-accent/40 transition-colors">
                  <step.icon size={18} className="text-accent" />
                </div>
                <h3 className="mt-5 text-base font-semibold text-text-primary">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
