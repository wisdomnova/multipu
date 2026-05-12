"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/components/motion";

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center pt-24 pb-20 border-b border-white/[0.05]">
      {/* Background patterns */}
      <div className="absolute inset-0 z-0 bg-white/[0.01]" />
      <div className="absolute top-0 right-0 w-1/3 h-full border-l border-white/[0.05] z-0 hidden lg:block" />

      <div className="relative z-10 mx-auto max-w-[1400px] px-6 md:px-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-0 border-l border-white/10">
          
          {/* Main Content Column */}
          <div className="lg:col-span-3 px-8 py-20 md:py-32 border-r border-white/10 flex flex-col justify-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.span
                variants={fadeUp}
                className="font-mono text-xs text-accent uppercase tracking-[0.3em] mb-8 block"
              >
                Protocol v1.0
              </motion.span>
              
              <motion.h1
                variants={fadeUp}
                className="text-[clamp(2.5rem,7vw,5.5rem)] font-normal leading-[1.0] tracking-tight text-white mb-10 max-w-4xl"
              >
                Deploy once. <br/> Launch everywhere.
              </motion.h1>

              <motion.p
                variants={fadeUp}
                className="text-lg md:text-xl text-text-secondary max-w-xl leading-relaxed font-light mb-12 opacity-80"
              >
                The multi-launchpad control plane for Solana tokens. 
                Create locally, distribute globally across the ecosystem&apos;s 
                premier liquidity layers.
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
              >
                <Link
                  href="/launch"
                  className="px-8 py-4 bg-white text-black text-[11px] font-mono tracking-[0.2em] font-bold hover:bg-accent hover:text-white transition-all text-center uppercase"
                >
                  Start Launching {">"}
                </Link>
                <Link
                  href="/dashboard"
                  className="px-8 py-4 border border-white/20 text-white text-[11px] font-mono tracking-[0.2em] hover:bg-white/5 transition-all text-center uppercase"
                >
                  Access Dashboard
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Metrics Column */}
          <div className="lg:col-span-1 border-r border-white/10 flex flex-col divide-y divide-white/10">
            {[
              { value: "03", label: "Launchpads", detail: "Active integrations" },
              { value: "1-Click", label: "Deploy", detail: "Zero CLI required" },
              { value: "Real-time", label: "Tracking", detail: "Live node sync" },
              { value: "Fast", label: "Execution", detail: "Solana optimized" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + (i * 0.1) }}
                className="p-8 flex-1 flex flex-col justify-center bg-white/[0.01] hover:bg-white/[0.02] transition-colors group"
              >
                <div className="text-3xl font-serif text-white mb-2 group-hover:text-accent transition-colors tracking-tighter">
                  {stat.value}
                </div>
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em] mb-4">
                  {stat.label}
                </div>
                <div className="text-[11px] text-text-secondary font-light opacity-60 leading-relaxed">
                  {stat.detail}
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
