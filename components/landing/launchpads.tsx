"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/components/motion";
import { ExternalLink } from "lucide-react";

const launchpads = [
  {
    name: "Meteora",
    description:
      "Solana's premier liquidity layer. Dynamic pools, DLMM, and capital-efficient token launches.",
    status: "Supported",
    statusColor: "text-success" as const,
    features: [
      "Dynamic liquidity pools",
      "DLMM integration",
      "Creator fee tracking",
      "Auto-fill token details",
    ],
    image: "/meteora.png",
  },
  {
    name: "Bags",
    description:
      "Community-driven degen launchpad. Fast launches, meme-friendly, and built for the culture.",
    status: "Supported",
    statusColor: "text-success" as const,
    features: [
      "Quick launch setup",
      "Meme-token optimized",
      "Community features",
      "Creator earnings dashboard",
    ],
    image: "/bags.png",
  },
  {
    name: "Pump.fun",
    description:
      "The viral token launcher. Dead-simple bonding curves, instant tradability, and massive reach.",
    status: "Supported",
    statusColor: "text-success" as const,
    features: [
      "Bonding curve launches",
      "Instant tradability",
      "Viral distribution",
      "Low barrier to entry",
    ],
    image: "/pumpfun.png",
  },
  {
    name: "Four.meme",
    description:
      "BNB Smart Chain meme launchpad. Integrated into policy controls and queued for non-Solana execution.",
    status: "Queued",
    statusColor: "text-warning" as const,
    features: [
      "BNB Chain target",
      "Launchpad policy controls",
      "Schema + analytics mapping",
      "Execution adapter pending",
    ],
    image: "/bags.png",
  },
  {
    name: "Base.meme",
    description:
      "Base ecosystem launchpad. Added to backend controls with execution rollout behind safety gates.",
    status: "Queued",
    statusColor: "text-warning" as const,
    features: [
      "Base network target",
      "Admin allow/deny support",
      "Unified launchpad IDs",
      "Execution adapter pending",
    ],
    image: "/pumpfun.png",
  },
];

export function Launchpads() {
  return (
    <section id="launchpads" className="relative py-24 md:py-32">
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
            Integrations
          </motion.span>
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-[clamp(1.75rem,4vw,3rem)] font-bold tracking-tight"
          >
            Supported Launchpads
          </motion.h2>
          <motion.p
            variants={fadeUp}
            className="mt-4 text-text-secondary max-w-xl text-lg"
          >
            Multi-launchpad control plane with staged integrations.
          </motion.p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={stagger}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {launchpads.map((pad) => (
            <motion.div
              key={pad.name}
              variants={fadeUp}
              className="group relative border border-border bg-background hover:bg-elevated transition-all duration-300 overflow-hidden"
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className="p-8 md:p-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-border">
                      <Image
                        src={pad.image}
                        alt={pad.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-text-primary">
                        {pad.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${pad.statusColor.replace("text-", "bg-")}`}
                          style={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                        />
                        <span className={pad.statusColor + " font-mono text-xs"}>
                          {pad.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ExternalLink
                    size={16}
                    className="text-text-dim group-hover:text-text-muted transition-colors"
                  />
                </div>

                <p className="text-sm text-text-secondary leading-relaxed mb-6">
                  {pad.description}
                </p>

                <div className="space-y-2.5">
                  {pad.features.map((feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 text-sm"
                    >
                      <span className="font-mono text-accent text-xs">▸</span>
                      <span className="text-text-secondary">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
