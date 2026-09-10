"use client";

import Link from "next/link";

const ecosystems = [
  "Solana",
  "Pump.fun",
  "Meteora",
  "Bags",
  "X-Agent",
  "OlaXBT",
  "BNB Chain",
  "Robinhood",
  "Sherwood",
  "Four.meme",
];

const sampleTokens = [
  { symbol: "$STONKSZN", size: "w-20 h-20", bg: "bg-neutral-800", top: "15%", left: "18%" },
  { symbol: "$BODEN", size: "w-24 h-24", bg: "bg-neutral-700", top: "40%", left: "42%" },
  { symbol: "$CRUMBS", size: "w-16 h-16", bg: "bg-neutral-800", top: "68%", left: "22%" },
  { symbol: "$BATON", size: "w-14 h-14", bg: "bg-neutral-900", top: "22%", left: "68%" },
  { symbol: "$ROBIN", size: "w-18 h-18", bg: "bg-neutral-800", top: "60%", left: "70%" },
];

export function LaunchImpact() {
  return (
    <section className="py-24 md:py-36 px-6 md:px-12 max-w-[1360px] mx-auto">
      {/* Header Split matching Screenshots 4 & 5 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end mb-16 md:mb-20">
        <div className="lg:col-span-8">
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-normal tracking-tight text-white leading-[1.12]">
            Break the mold on launches.
            <br />
            Convert your community into life-long holders
          </h2>
        </div>

        <div className="lg:col-span-4 flex flex-col items-start lg:items-end">
          <p className="text-sm text-neutral-400 leading-relaxed mb-6">
            Tap into multi-chain liquidity pools, capture early volume surges, and expand market depth by deploying directly to every major launchpad simultaneously.
          </p>

          <Link
            href="/launch"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black text-xs font-semibold hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <span>Launch Your Token</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* Two Large Side-by-Side Rounded Cards matching Screenshots 4 & 5 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-20">
        {/* Left Card: Dark Token Constellation & Directional Mark */}
        <div className="relative h-[380px] sm:h-[420px] rounded-3xl bg-[#0d0d0d] p-8 overflow-hidden flex items-center justify-center">
          {/* Constellation of circular token avatars */}
          {sampleTokens.map((tok) => (
            <div
              key={tok.symbol}
              style={{ top: tok.top, left: tok.left }}
              className={`absolute ${tok.size} rounded-full ${tok.bg} flex items-center justify-center p-2 text-center select-none`}
            >
              <span className="font-mono text-xs font-bold text-white tracking-tight">
                {tok.symbol}
              </span>
            </div>
          ))}

          {/* Centered bold downward arrow mark matching Screenshot 5 */}
          <div className="relative z-10 w-20 h-20 rounded-full bg-black/70 flex items-center justify-center text-white text-3xl font-light">
            ↓
          </div>
        </div>

        {/* Right Card: Soft Lavender Metrics & Bold Asterisk Symbol */}
        <div className="relative h-[380px] sm:h-[420px] rounded-3xl bg-[#c4c1f0] p-10 sm:p-14 flex flex-col justify-between overflow-hidden">
          {/* Top Volume Metrics */}
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-neutral-800 mb-2 font-medium">
              TOTAL DEPLOYED VOLUME
            </div>
            <div className="flex items-baseline gap-4 flex-wrap">
              <div className="text-5xl sm:text-6xl md:text-7xl font-bold font-mono text-black tracking-tight">
                $4.8M+
              </div>
              <span className="px-3 py-1 rounded-full bg-green-500 text-white font-mono text-xs font-bold">
                +201% 24H
              </span>
            </div>
          </div>

          {/* Bottom Bold 8-spoke Asterisk Star matching Screenshot 5 */}
          <div className="flex items-end justify-between">
            <div className="text-xs font-mono text-neutral-700 max-w-[200px]">
              Simultaneous liquidity distribution across all supported decentralized protocols.
            </div>
            <div className="text-7xl font-bold text-black select-none leading-none">
              ✱
            </div>
          </div>
        </div>
      </div>

      {/* Partner / Ecosystem Brand Row matching Screenshot 4 */}
      <div className="py-8 flex flex-wrap items-center justify-between gap-6 md:gap-10">
        {ecosystems.map((name) => (
          <span
            key={name}
            className="text-base sm:text-lg font-semibold tracking-tight text-neutral-400 hover:text-white transition-colors select-none font-mono"
          >
            {name}
          </span>
        ))}
      </div>
    </section>
  );
}
