"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { TradeForm } from "@/components/trade/trade-form";
import { TradeHistory } from "@/components/trade/trade-history";
import { ArrowLeft, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface TokenData {
  id: string;
  name: string;
  symbol: string;
  mint_address: string | null;
  supply: string;
  decimals: number;
}

interface LaunchData {
  id: string;
  launchpad: string;
  network: string;
  pool_address: string | null;
  volume_24h: number;
  initial_liquidity: number | null;
  tokens: TokenData;
}

export default function TradePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [launch, setLaunch] = useState<LaunchData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/launches/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch launch details");
      }
      const data = await res.json();
      setLaunch(data.launch);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const handleTradeSuccess = () => {
    // Increment trigger to notify components (e.g. TradeHistory) to refresh
    setRefreshTrigger((prev) => prev + 1);
    fetchDetails();
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-text-muted font-normal">Loading trade interface...</div>
      </div>
    );
  }

  if (error || !launch) {
    return (
      <div className="p-6 md:p-10 flex flex-col gap-4 max-w-md">
        <div className="text-xs text-error font-normal">
          {error || "Launch details not found."}
        </div>
        <Link href="/dashboard" className="text-xs text-accent font-normal flex items-center gap-1">
          <ArrowLeft size={12} /> Back to dashboard
        </Link>
      </div>
    );
  }

  const token = launch.tokens;
  const gasSymbol = launch.network.toLowerCase() === "bsc" ? "BNB" : launch.network.toLowerCase() === "robinhood" ? "ETH" : "SOL";

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto flex flex-col gap-6 text-white bg-background">
      {/* Header / Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-xs text-text-muted hover:text-white transition-colors font-normal flex items-center gap-1.5">
          <ArrowLeft size={12} /> Dashboard
        </Link>
        <button
          onClick={fetchDetails}
          className="text-xs text-text-muted hover:text-white transition-colors font-normal flex items-center gap-1"
        >
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Title & Info */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-normal tracking-tight text-white">
            {token.name}
          </h1>
          <span className="font-mono text-xs text-text-muted">
            ${token.symbol}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-secondary font-normal">
          <div>
            Launchpad: <span className="font-mono text-text-primary">{launch.launchpad}</span>
          </div>
          <div>
            Network: <span className="font-mono text-text-primary">{launch.network}</span>
          </div>
          <div>
            Contract: <span className="font-mono text-text-primary">{launch.pool_address || "None"}</span>
          </div>
          <div>
            Volume 24h: <span className="font-mono text-text-primary">{Number(launch.volume_24h || 0).toFixed(4)} {gasSymbol}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column - Chart */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white/[0.02] p-5 rounded-lg flex flex-col gap-4">
            <div className="text-[10px] text-text-dim uppercase tracking-wider font-normal">
              Price Chart
            </div>
            
            {/* Minimal Grid Chart Mock */}
            <div className="h-[300px] flex flex-col justify-between p-2 bg-white/[0.01]">
              <div className="flex-1 flex items-end justify-between gap-1 pb-4">
                {/* Visualizing simple trade bars */}
                {[
                  { h: "35%", c: "bg-error/40" },
                  { h: "45%", c: "bg-success/40" },
                  { h: "40%", c: "bg-error/40" },
                  { h: "55%", c: "bg-success/40" },
                  { h: "60%", c: "bg-success/40" },
                  { h: "50%", c: "bg-error/40" },
                  { h: "65%", c: "bg-success/40" },
                  { h: "75%", c: "bg-success/40" },
                  { h: "70%", c: "bg-error/40" },
                  { h: "85%", c: "bg-success/40" },
                  { h: "80%", c: "bg-error/40" },
                  { h: "95%", c: "bg-success/40" },
                ].map((bar, idx) => (
                  <div
                    key={idx}
                    style={{ height: bar.h }}
                    className={cn("w-full transition-all duration-500 rounded-sm", bar.c)}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[9px] text-text-dim font-mono font-normal">
                <span>12:00</span>
                <span>12:15</span>
                <span>12:30</span>
                <span>12:45</span>
                <span>Now</span>
              </div>
            </div>
          </div>

          {/* Trade History Widget */}
          <TradeHistory launchId={launch.id} refreshTrigger={refreshTrigger} />
        </div>

        {/* Right Column - Trade Panel */}
        <div className="flex flex-col gap-4">
          <TradeForm launch={launch} onTradeSuccess={handleTradeSuccess} />
          
          {/* Mini Stats Card */}
          <div className="bg-white/[0.02] p-5 rounded-lg flex flex-col gap-3">
            <div className="text-[10px] text-text-dim uppercase tracking-wider font-normal">
              Launch Details
            </div>
            <div className="flex flex-col gap-2 text-xs">
              <div className="flex justify-between font-normal">
                <span className="text-text-muted">Total Supply</span>
                <span className="font-mono text-text-primary">{Number(token.supply).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-normal">
                <span className="text-text-muted">Initial Liquidity</span>
                <span className="font-mono text-text-primary">
                  {launch.initial_liquidity ? `${launch.initial_liquidity} ${gasSymbol}` : "None"}
                </span>
              </div>
              <div className="flex justify-between font-normal">
                <span className="text-text-muted">Token Decimals</span>
                <span className="font-mono text-text-primary">{token.decimals}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
