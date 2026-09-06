"use client";

import Link from "next/link";
import Image from "next/image";

const sitelinks = {
  products: [
    { label: "Token Orchestrator", href: "/launch" },
    { label: "Meme Coin Explorer", href: "/dashboard/explore" },
    { label: "DEX Trading Terminal", href: "/dashboard/trade" },
    { label: "Multi-Chain Balances", href: "/dashboard" },
    { label: "Creator Earnings", href: "/dashboard/earnings" },
  ],
  protocols: [
    { label: "Pump.fun (Solana)", href: "/launch" },
    { label: "Meteora DLMM (Solana)", href: "/launch" },
    { label: "Bags App (Solana)", href: "/launch" },
    { label: "Four.meme (BNB Chain)", href: "/launch" },
    { label: "Pons Protocol (Robinhood)", href: "/launch" },
  ],
  developers: [
    { label: "REST API Reference", href: "/dashboard/api" },
    { label: "KeeperHub MCP Server", href: "/dashboard/api" },
    { label: "OlaXBT Strategy Signals", href: "/dashboard/api" },
    { label: "Webhooks & Events", href: "/dashboard/api" },
    { label: "Developer Keys", href: "/dashboard/api" },
  ],
  ecosystem: [
    { label: "Token Manager", href: "/dashboard/tokens" },
    { label: "Launch History", href: "/dashboard/launches" },
    { label: "GitHub Repository", href: "https://github.com/wisdomnova/multipu" },
    { label: "Network Telemetry", href: "/dashboard" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-[#050608] text-text-secondary">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 py-16 md:py-20">
        
        {/* Sitelinks Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 pb-16 border-b border-white/[0.06]">
          
          {/* Brand Info Column */}
          <div className="col-span-2 md:col-span-4 lg:col-span-1 space-y-4">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 flex-shrink-0">
                <Image src="/logo.png" alt="Multipu" fill sizes="28px" className="object-contain" />
              </div>
              <span className="text-base font-bold tracking-tight text-white">
                Multipu
              </span>
            </Link>
            <p className="text-xs text-text-muted leading-relaxed font-normal">
              Multi-chain token orchestrator, real-time DEX terminal, and autonomous agent protocol across Solana, BNB Chain, and Robinhood Chain.
            </p>
          </div>

          {/* Sitelinks Column 1: Products */}
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-white font-semibold">
              Platform
            </div>
            <ul className="space-y-2 text-xs">
              {sitelinks.products.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-white transition-colors duration-150"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sitelinks Column 2: Supported Protocols */}
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-white font-semibold">
              Launchpads
            </div>
            <ul className="space-y-2 text-xs">
              {sitelinks.protocols.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-white transition-colors duration-150"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sitelinks Column 3: Developers */}
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-white font-semibold">
              Agents &amp; API
            </div>
            <ul className="space-y-2 text-xs">
              {sitelinks.developers.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="hover:text-white transition-colors duration-150"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sitelinks Column 4: Ecosystem */}
          <div className="space-y-3">
            <div className="font-mono text-[11px] uppercase tracking-wider text-white font-semibold">
              Ecosystem
            </div>
            <ul className="space-y-2 text-xs">
              {sitelinks.ecosystem.map((item) => (
                <li key={item.label}>
                  {item.href.startsWith("http") ? (
                    <a
                      href={item.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white transition-colors duration-150"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <Link
                      href={item.href}
                      className="hover:text-white transition-colors duration-150"
                    >
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-8 gap-4 font-mono text-xs text-text-muted">
          <div>
            &copy; {new Date().getFullYear()} Multipu. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/dashboard/api" className="hover:text-white transition-colors">
              API
            </Link>
            <Link href="/dashboard/explore" className="hover:text-white transition-colors">
              Explorer
            </Link>
            <a
              href="https://github.com/wisdomnova/multipu"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}
