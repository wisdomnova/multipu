"use client";

import Link from "next/link";
import { motion, fadeUp, stagger, scaleIn, slideInLeft } from "@/components/motion";

export function BauhausShowcase() {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-80px" }}
      variants={stagger}
      className="py-16 md:py-24 px-6 md:px-12 max-w-[1360px] mx-auto"
    >
      {/* Outer rounded dark canvas */}
      <motion.div variants={fadeUp} className="relative w-full rounded-[40px] bg-neutral-950 p-8 sm:p-12 lg:p-16 overflow-hidden">
        {/* Perfectly Balanced Dot Matrix Background Pattern */}
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.18)_1.1px,transparent_1.1px)] [background-size:22px_22px] pointer-events-none opacity-45 [mask-image:radial-gradient(ellipse_at_center,black_80%,transparent_100%)] z-0" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column: Editorial & Bauhaus Geometric Composition */}
          <motion.div variants={slideInLeft} className="lg:col-span-5 flex flex-col justify-between h-full min-h-[580px]">
            <div>
              <div className="flex items-center gap-4 text-xs font-mono text-neutral-400 mb-8">
                <span>Architecture</span>
                <span>●</span>
                <span>Multi-Chain</span>
              </div>

              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight text-white leading-[1.1] mb-6">
                It&apos;s never too late to deploy something new
              </h2>

              <p className="text-sm text-neutral-400 leading-relaxed mb-8 max-w-md">
                Three paths lead to liquidity: the path of reflection is the noblest, the path of imitation is the easiest, and the path of innovation is the most rewarding.
              </p>

              <Link
                href="/launch"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-mono transition-colors cursor-pointer"
              >
                <span>Start Deploying</span>
                <span>→</span>
              </Link>
            </div>

            {/* Bauhaus Abstract Geometric SVG composition */}
            <div className="relative w-full h-56 mt-8 overflow-hidden rounded-2xl bg-neutral-900/50 p-6 flex items-center justify-center">
              {/* Angled orange bar */}
              <div className="absolute w-28 h-2.5 rounded-full bg-orange-500 rotate-[-35deg] translate-x-[-40px] translate-y-[-10px]" />
              {/* Blue circle */}
              <div className="absolute w-10 h-10 rounded-full bg-blue-600 translate-x-[-50px] translate-y-[-50px]" />
              {/* Lavender horizontal bar */}
              <div className="absolute w-16 h-2 rounded-full bg-indigo-400 translate-x-[-40px] translate-y-[45px]" />
              {/* Orange circle with wavy line */}
              <div className="absolute w-14 h-14 rounded-full bg-orange-600 translate-x-[40px] translate-y-[35px]" />
              {/* Fine vector squiggle */}
              <svg className="absolute w-full h-full stroke-neutral-500/40 fill-none" strokeWidth="1.5">
                <path d="M40,160 Q80,120 120,160 T200,160 T280,140" />
              </svg>
              {/* Textured angled pill capsule */}
              <div className="absolute w-16 h-32 rounded-full bg-neutral-800 rotate-[40deg] translate-x-[45px] translate-y-[-20px] overflow-hidden flex items-center justify-center">
                <div className="w-full h-full bg-neutral-700/60" />
              </div>
            </div>
          </motion.div>

          {/* Right Column: 2x2 Grid of 4 rounded colored feature tiles */}
          <motion.div variants={stagger} className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tile 1: Explore (Electric Blue) */}
            <motion.div variants={scaleIn}>
              <Link
                href="/dashboard/explore"
                className="h-72 sm:h-80 rounded-3xl bg-[#2b4fff] p-8 flex flex-col justify-between group transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  {/* Abstract vector illustration */}
                  <div className="relative w-24 h-16">
                    <div className="absolute w-16 h-2 rounded-full bg-orange-400 rotate-[-25deg] top-2" />
                    <div className="absolute w-12 h-1.5 rounded-full bg-white/40 top-8 left-1" />
                    <svg className="w-full h-full stroke-white/40 fill-none" strokeWidth="1">
                      <path d="M0,35 Q30,10 60,30 T100,20" />
                    </svg>
                  </div>
                  <span className="text-xl font-mono text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    ↗
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Explore</h3>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Discover trending bonding curves and new tokens across Solana, BNB, and Robinhood Chain.
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Tile 2: Launches (Vibrant Warm Orange) */}
            <motion.div variants={scaleIn}>
              <Link
                href="/dashboard/launches"
                className="h-72 sm:h-80 rounded-3xl bg-[#ff5520] p-8 flex flex-col justify-between group transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  {/* Geometric shapes */}
                  <div className="relative w-24 h-16">
                    <div className="w-7 h-7 rounded-full bg-white mb-2" />
                    <div className="w-16 h-2 rounded-full bg-white rotate-[-15deg]" />
                    <div className="w-10 h-1.5 rounded-full bg-blue-300 mt-2 ml-8" />
                  </div>
                  <span className="text-xl font-mono text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    ↗
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Launches</h3>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Simultaneous push to Meteora, Pump.fun, Bags, Four.meme, and Pons.
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Tile 3: Agents (Soft Ice / Lavender Tint) */}
            <motion.div variants={scaleIn}>
              <Link
                href="/dashboard"
                className="h-72 sm:h-80 rounded-3xl bg-[#ede9fe] p-8 flex flex-col justify-between group transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  {/* Soft shapes */}
                  <div className="relative w-24 h-16">
                    <div className="w-8 h-8 rounded-full bg-blue-600 mb-1" />
                    <div className="w-3 h-3 rounded-full bg-orange-500 absolute top-0 right-8" />
                    <svg className="w-full h-full stroke-neutral-400 fill-none" strokeWidth="1">
                      <path d="M10,25 Q40,5 70,30" />
                    </svg>
                  </div>
                  <span className="text-xl font-mono text-neutral-900 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    ↗
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-2">Agents</h3>
                  <p className="text-xs text-neutral-700 leading-relaxed">
                    OlaXBT signals and automated KeeperHub arbitrage execution right in your terminal.
                  </p>
                </div>
              </Link>
            </motion.div>

            {/* Tile 4: Earnings (Periwinkle Violet) */}
            <motion.div variants={scaleIn}>
              <Link
                href="/dashboard/earnings"
                className="h-72 sm:h-80 rounded-3xl bg-[#7c65c1] p-8 flex flex-col justify-between group transition-transform duration-300 hover:scale-[1.02] cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  {/* Switch toggle illustration */}
                  <div className="w-24 h-10 rounded-full bg-black/20 p-1 flex items-center justify-between">
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center" />
                    <div className="w-8 h-8 rounded-full bg-orange-500" />
                  </div>
                  <span className="text-xl font-mono text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                    ↗
                  </span>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Earnings</h3>
                  <p className="text-xs text-white/80 leading-relaxed">
                    Creator royalties and protocol fees collected across every launchpad in real time.
                  </p>
                </div>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </motion.section>
  );
}
