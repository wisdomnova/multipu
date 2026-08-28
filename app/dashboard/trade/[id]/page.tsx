"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { TradeForm } from "@/components/trade/trade-form";
import { TradeHistory } from "@/components/trade/trade-history";
import { CandlestickChart } from "@/components/trade/candlestick-chart";
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

  // Live simulation states
  const [currentPrice, setCurrentPrice] = useState(0.000124);
  const [priceDirection, setPriceDirection] = useState<"up" | "down" | "flat">("flat");
  const [accumulatedVolume, setAccumulatedVolume] = useState(0);

  const fetchDetails = async () => {
    try {
      const res = await fetch(`/api/launches/${id}`);
      if (!res.ok) {
        throw new Error("Failed to fetch launch details");
      }
      const data = await res.json();
      setLaunch(data.launch);
      if (accumulatedVolume === 0) {
        setAccumulatedVolume(Number(data.launch?.volume_24h || 0));
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [id]);

  // Handle live tick generation loop
  useEffect(() => {
    if (loading || error || !launch) return;

    const timer = setInterval(() => {
      const isUp = Math.random() > 0.46; // slight upward bias
      const changePct = (Math.random() * 1.5 + 0.1) / 100; // 0.1% to 1.6% price tick

      setCurrentPrice((prevPrice) => {
        const nextPrice = isUp ? prevPrice * (1 + changePct) : prevPrice * (1 - changePct);
        setPriceDirection(isUp ? "up" : "down");
        return nextPrice;
      });

      // Increment 24h volume simulating network activity
      const volumeAddition = parseFloat((Math.random() * 0.4 + 0.01).toFixed(4));
      setAccumulatedVolume((prevVol) => prevVol + volumeAddition);

      // Clear price direction color flash after 800ms
      setTimeout(() => {
        setPriceDirection("flat");
      }, 800);

    }, 4000); // ticks every 4 seconds

    return () => clearInterval(timer);
  }, [loading, error, launch]);

  const handleTradeSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
    fetchDetails();
  };

  if (loading) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[50vh]">
        <div className="text-xs text-text-muted font-mono">Loading trade interface...</div>
      </div>
    );
  }

  if (error || !launch) {
    return (
      <div className="p-6 md:p-10 flex flex-col gap-4 max-w-md">
        <div className="text-xs text-error font-mono">
          {error || "Launch details not found."}
        </div>
        <Link href="/dashboard" className="text-xs text-accent font-mono flex items-center gap-1">
          <ArrowLeft size={12} /> Back to dashboard
        </Link>
      </div>
    );
  }

  const token = launch.tokens;
  const gasSymbol = launch.network.toLowerCase() === "bsc" ? "BNB" : launch.network.toLowerCase() === "robinhood" ? "ETH" : "SOL";

  return (
    <div className="p-6 md:p-10 flex flex-col gap-6">
      {/* Header / Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/explore"
          className="text-xs text-text-muted hover:text-text-primary transition-colors font-mono flex items-center gap-1.5"
        >
          <ArrowLeft size={12} /> Explore Memes
        </Link>
        <button
          onClick={fetchDetails}
          className="text-xs text-text-muted hover:text-text-primary transition-colors font-mono flex items-center gap-1"
        >
          <RefreshCw size={12} className="animate-hover" /> Refresh
        </button>
      </div>

      {/* Title & Info */}
      <div className="flex flex-col gap-1 border-b border-border pb-6">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            {token.name}
          </h1>
          <span className="font-mono text-xs text-text-muted px-1.5 py-0.5 border border-border">
            ${token.symbol}
          </span>
          <span
            className={cn(
              "font-mono text-xs px-2 py-0.5 ml-2 border transition-all duration-300 font-semibold",
              priceDirection === "up"
                ? "text-success border-success/30 bg-success/5 animate-pulse"
                : priceDirection === "down"
                ? "text-error border-error/30 bg-error/5 animate-pulse"
                : "text-text-dim border-border"
            )}
          >
            Price: {currentPrice.toFixed(8)} {gasSymbol}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-text-secondary font-mono mt-2">
          <div>
            Launchpad: <span className="text-text-primary">{launch.launchpad}</span>
          </div>
          <div>
            Network: <span className="text-text-primary">{launch.network}</span>
          </div>
          <div>
            Contract: <span className="text-text-primary select-all">{launch.pool_address || "None"}</span>
          </div>
          <div>
            Volume 24h: <span className="text-text-primary font-mono">{Number(accumulatedVolume || 0).toFixed(4)} {gasSymbol}</span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Middle Column - Chart */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <CandlestickChart
            currentPrice={currentPrice}
            priceDirection={priceDirection}
            gasSymbol={gasSymbol}
          />

          {/* Trade History Widget */}
          <TradeHistory launchId={launch.id} refreshTrigger={refreshTrigger} />
        </div>

        {/* Right Column - Trade Panel */}
        <div className="flex flex-col gap-4">
          <TradeForm launch={launch} onTradeSuccess={handleTradeSuccess} />
          
          {/* Mini Stats Card */}
          <div className="border border-border p-5 rounded-none flex flex-col gap-3">
            <div className="text-[10px] text-text-dim uppercase tracking-wider font-mono">
              Launch Details
            </div>
            <div className="flex flex-col gap-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-text-muted">Total Supply</span>
                <span className="text-text-primary">{Number(token.supply).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Initial Liquidity</span>
                <span className="text-text-primary">
                  {launch.initial_liquidity ? `${launch.initial_liquidity} ${gasSymbol}` : "None"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-muted">Token Decimals</span>
                <span className="text-text-primary">{token.decimals}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
