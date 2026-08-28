"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight, Coins } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/components/motion";

interface TokenData {
  name: string;
  symbol: string;
  mint_address: string | null;
  supply: string;
}

interface LaunchData {
  id: string;
  launchpad: string;
  network: string;
  pool_address: string | null;
  volume_24h: number;
  tokens: TokenData;
}

export default function ExplorePage() {
  const [launches, setLaunches] = useState<LaunchData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchLaunches = async (query = "") => {
    try {
      const url = query ? `/api/launches/explore?q=${encodeURIComponent(query)}` : "/api/launches/explore";
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch live memes");
      }
      const data = await res.json();
      setLaunches(data.launches || []);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaunches();
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    fetchLaunches(val);
  };

  const gasSymbol = (network: string) => {
    const net = network.toLowerCase();
    return net === "bsc" ? "BNB" : net === "robinhood" ? "ETH" : "SOL";
  };

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="mb-10"
      >
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Explore Memes
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Search and trade active token launches across all supported chains.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mb-6 flex items-center gap-3"
      >
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
          />
          <input
            type="text"
            placeholder="Search memes by token name or symbol..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim transition-colors font-mono"
          />
        </div>
      </motion.div>

      {/* Loading & Error states */}
      {loading && (
        <div className="py-12 text-center text-xs text-text-dim font-mono">
          Loading live memes...
        </div>
      )}

      {error && !loading && (
        <div className="py-12 text-center text-xs text-error font-mono">
          {error}
        </div>
      )}

      {/* List cards */}
      {!loading && !error && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-3"
        >
          {launches.map((launch) => {
            const token = launch.tokens;
            const gas = gasSymbol(launch.network);
            return (
              <motion.div
                key={launch.id}
                variants={fadeUp}
                className="group border border-border hover:bg-elevated transition-colors"
              >
                <div className="p-5 md:p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                      <Coins size={20} className="text-accent" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base font-semibold text-text-primary">
                          {token.name}
                        </span>
                        <span className="font-mono text-xs text-text-muted px-1.5 py-0.5 border border-border">
                          ${token.symbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-text-dim font-mono">
                        <span>Launchpad: {launch.launchpad}</span>
                        <span>Network: {launch.network}</span>
                        <span>
                          Volume: {Number(launch.volume_24h || 0).toFixed(4)} {gas}
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/dashboard/trade/${launch.id}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all duration-300 hover:-translate-y-0.5"
                    >
                      Trade <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {launches.length === 0 && (
            <div className="border border-dashed border-border p-12 text-center">
              <Coins size={32} className="text-text-dim mx-auto mb-4" />
              <h3 className="text-base font-semibold text-text-primary mb-2">
                No live memes found
              </h3>
              <p className="text-sm text-text-secondary">
                No launches match your current search query.
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
