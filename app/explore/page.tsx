"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Nav } from "@/components/nav";
import { Search, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="min-h-screen bg-background text-white flex flex-col">
      <Nav />
      
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 md:px-10 pt-28 pb-16 flex flex-col gap-8">
        {/* Page Title */}
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-normal tracking-tight">
            Live Memes
          </h1>
          <p className="text-xs text-text-secondary font-normal">
            Search and trade all active token launches across supported chains.
          </p>
        </div>

        {/* Search Input Bar (No borders, no shadows) */}
        <div className="bg-white/[0.02] p-3 rounded flex items-center gap-3">
          <Search size={16} className="text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by token name or symbol..."
            className="bg-transparent text-sm text-white font-normal outline-none w-full"
          />
        </div>

        {/* Explore List */}
        {loading ? (
          <div className="py-12 text-center text-xs text-text-muted font-normal">
            Loading live memes...
          </div>
        ) : error ? (
          <div className="py-12 text-center text-xs text-error font-normal">
            {error}
          </div>
        ) : launches.length === 0 ? (
          <div className="py-12 text-center text-xs text-text-muted font-normal">
            No live memes found.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {launches.map((launch) => {
              const token = launch.tokens;
              const gas = gasSymbol(launch.network);
              return (
                <div
                  key={launch.id}
                  className="bg-white/[0.02] hover:bg-white/[0.04] p-5 rounded-lg flex items-center justify-between transition-colors"
                >
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-normal text-white">
                        {token.name}
                      </span>
                      <span className="font-mono text-xs text-text-muted">
                        ${token.symbol}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 text-[10px] text-text-secondary font-normal font-mono">
                      <span>Launchpad: {launch.launchpad}</span>
                      <span>Network: {launch.network}</span>
                      <span>Volume: {Number(launch.volume_24h || 0).toFixed(4)} {gas}</span>
                    </div>
                  </div>

                  <Link
                    href={`/trade/${launch.id}`}
                    className="text-xs text-accent hover:text-accent-hover transition-colors font-normal flex items-center gap-1"
                  >
                    Trade <ArrowRight size={12} />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
