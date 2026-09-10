"use client";

import Link from "next/link";
import { motion, fadeUp, stagger, scaleIn } from "@/components/motion";

export function HeroStatus() {
  return (
    <motion.section
      initial="hidden"
      animate="visible"
      variants={stagger}
      className="relative pt-36 md:pt-48 pb-20 md:pb-32 px-6 md:px-12 max-w-[1360px] mx-auto overflow-hidden"
    >
      {/* Perfectly Balanced Dot Matrix Background Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.18)_1.1px,transparent_1.1px)] [background-size:22px_22px] pointer-events-none opacity-45 [mask-image:radial-gradient(ellipse_at_center,black_75%,transparent_100%)] z-0" />

      {/* Top Hero Typography & Graphic Mark */}
      <div className="relative z-10 mb-16 md:mb-24">
        {/* Powered by X-Agent & OlaXBT Badge */}
        <motion.div
          variants={fadeUp}
          className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs font-mono text-neutral-300 mb-8 backdrop-blur-md"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white font-semibold tracking-tight">Powered by X-Agent</span>
          <span className="text-neutral-500">|</span>
          <span className="text-neutral-400">OlaXBT Strategy Intelligence</span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight text-white leading-[1.05] md:leading-[0.98]"
        >
          <span className="inline-flex items-center gap-4 md:gap-6 flex-wrap">
            <span className="relative inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 align-middle">
              {/* Organic purple highlight blob */}
              <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 w-full h-full text-accent/40 fill-current"
              >
                <path d="M30,15 Q65,5 85,35 Q95,70 65,85 Q25,95 15,65 Q5,30 30,15 Z" />
              </svg>
              {/* Hand-drawn style geometric cursor arrow vector */}
              <svg
                viewBox="0 0 100 100"
                className="relative z-10 w-3/4 h-3/4 stroke-white fill-none"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {/* Outlined spiky organic bubble */}
                <path d="M20,25 Q35,10 55,20 Q75,10 80,30 Q90,50 80,70 Q65,90 45,80 Q20,90 15,70 Q5,45 20,25 Z" />
                {/* Pointer arrow */}
                <path
                  d="M38,35 L62,55 L50,56 L58,72 L50,76 L42,60 L34,68 Z"
                  className="fill-white stroke-black"
                  strokeWidth="2"
                />
              </svg>
            </span>
            <span>Launch</span>
          </span>
          <br />
          <span className="text-neutral-300">on your terms</span>
        </motion.h1>
      </div>

      {/* Sub-hero Row: CTAs, Description, Scroll Prompt */}
      <motion.div
        variants={fadeUp}
        className="grid grid-cols-1 md:grid-cols-12 gap-8 items-end mb-24 md:mb-32"
      >
        {/* CTAs */}
        <div className="md:col-span-4 flex flex-wrap items-center gap-3">
          <Link
            href="/launch"
            className="px-8 py-3.5 rounded-full bg-accent hover:bg-accent-hover text-white text-sm font-semibold transition-colors cursor-pointer shadow-lg hover:scale-105 active:scale-95 duration-200"
          >
            Launch Token
          </Link>
          <Link
            href="/dashboard/explore"
            className="px-8 py-3.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-sm font-semibold transition-colors cursor-pointer hover:scale-105 active:scale-95 duration-200"
          >
            Explore Memes
          </Link>
        </div>

        {/* Description */}
        <div className="md:col-span-5">
          <p className="text-sm md:text-base text-neutral-400 leading-relaxed max-w-md">
            Multipu is the universal launchpad and DEX execution engine powered by X-Agent autonomous intelligence and OlaXBT market momentum signals across Solana, BNB Chain, and Robinhood.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="md:col-span-3 flex md:justify-end">
          <a
            href="#editorial"
            className="inline-flex items-center gap-2 text-xs font-mono text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
          >
            <span>Scroll to learn more</span>
            <span className="text-sm animate-bounce">↓</span>
          </a>
        </div>
      </motion.div>

      {/* Proof Stats Row matching Screenshot 1 */}
      <motion.div
        variants={stagger}
        className="pt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 items-center border-t border-white/[0.08]"
      >
        <motion.div variants={fadeUp} className="lg:col-span-3">
          <div className="text-sm font-medium text-neutral-400">
            Built for decentralized liquidity
          </div>
          <div className="text-xs text-neutral-600 mt-0.5">
            Verified on-chain infrastructure
          </div>
        </motion.div>

        <motion.div variants={scaleIn} className="lg:col-span-3">
          <div className="text-3xl md:text-4xl font-bold font-mono text-white tracking-tight">
            6+ Launchpads
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Solana, BNB, and Robinhood
          </div>
        </motion.div>

        <motion.div variants={scaleIn} className="lg:col-span-3">
          <div className="text-3xl md:text-4xl font-bold font-mono text-white tracking-tight">
            &lt; 1s Routing
          </div>
          <div className="text-xs text-neutral-500 mt-1">
            Simultaneous multi-pool seeding
          </div>
        </motion.div>

        <motion.div variants={scaleIn} className="lg:col-span-3 flex items-center justify-between">
          <div>
            <div className="text-3xl md:text-4xl font-bold font-mono text-white tracking-tight">
              100% Direct
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Instant creator revenue claim
            </div>
          </div>

          {/* Artistic hand-drawn squiggle mark from Screenshot 1 */}
          <div className="w-16 h-16 flex-shrink-0 text-neutral-600">
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full stroke-current fill-none"
              strokeWidth="4"
              strokeLinecap="round"
            >
              <path d="M75,20 C60,40 50,60 55,80 C60,95 80,95 85,80 C90,65 60,65 50,75 C40,85 45,95 50,98" />
              <line x1="85" y1="25" x2="88" y2="40" strokeWidth="3" />
            </svg>
          </div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}
