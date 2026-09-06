"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TradeFormProps {
  launch: {
    id: string;
    launchpad: string;
    network: string;
    pool_address: string | null;
    tokens?: {
      name: string;
      symbol: string;
      mint_address: string | null;
    };
  };
  onTradeSuccess: () => void;
}

export function TradeForm({ launch, onTradeSuccess }: TradeFormProps) {
  const [activeTab, setActiveTab] = useState<"buy" | "sell">("buy");
  const [payAmount, setPayAmount] = useState("");
  const [slippage, setSlippage] = useState("1.0");
  const [loading, setLoading] = useState(false);

  const tokenSymbol = launch.tokens?.symbol || "TOKEN";
  
  // Determine gas token symbol based on network name
  const network = launch.network.toLowerCase();
  const gasSymbol = network === "bsc" ? "BNB" : network === "robinhood" ? "ETH" : "SOL";

  // Mock rate: 1 SOL/BNB/ETH = 1,000,000 meme tokens
  const exchangeRate = 1000000;

  const handleAmountChange = (val: string) => {
    // Only allow numeric inputs
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setPayAmount(val);
    }
  };

  const calculatedOutput = () => {
    const num = parseFloat(payAmount || "0");
    if (activeTab === "buy") {
      return (num * exchangeRate).toLocaleString();
    } else {
      return (num / exchangeRate).toFixed(6);
    }
  };

  const handleSwap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const amountNum = parseFloat(payAmount);
      const amountReceiveNum = activeTab === "buy" ? amountNum * exchangeRate : amountNum / exchangeRate;

      // Call API to record swap in database
      const res = await fetch("/api/trade/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          launchId: launch.id,
          type: activeTab,
          amountPay: amountNum,
          amountReceive: amountReceiveNum,
          txSignature: "mock-tx-sig-" + Math.random().toString(36).substr(2, 9),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to process trade");
      }

      toast.success(`Successfully swapped ${payAmount} ${activeTab === "buy" ? gasSymbol : tokenSymbol}`);
      setPayAmount("");
      onTradeSuccess();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong during the trade");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/[0.02] p-5 rounded-lg flex flex-col gap-4">
      {/* Tabs */}
      <div className="grid grid-cols-2 bg-white/[0.04] p-1 rounded">
        <button
          type="button"
          onClick={() => {
            setActiveTab("buy");
            setPayAmount("");
          }}
          className={cn(
            "py-2 text-center text-xs font-normal transition-colors rounded",
            activeTab === "buy" ? "bg-white/[0.06] text-white" : "text-text-secondary"
          )}
        >
          Buy
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("sell");
            setPayAmount("");
          }}
          className={cn(
            "py-2 text-center text-xs font-normal transition-colors rounded",
            activeTab === "sell" ? "bg-white/[0.06] text-white" : "text-text-secondary"
          )}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSwap} className="flex flex-col gap-4">
        {/* Input Field */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-normal">
            Pay Amount ({activeTab === "buy" ? gasSymbol : tokenSymbol})
          </label>
          <div className="bg-white/[0.04] p-3 rounded flex items-center justify-between">
            <input
              type="text"
              value={payAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="bg-transparent text-white text-base font-normal outline-none w-full"
            />
            <span className="text-xs text-text-muted font-normal">
              {activeTab === "buy" ? gasSymbol : tokenSymbol}
            </span>
          </div>
        </div>

        {/* Estimated Output Field */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-normal">
            Receive Amount ({activeTab === "buy" ? tokenSymbol : gasSymbol})
          </label>
          <div className="bg-white/[0.04] p-3 rounded flex items-center justify-between">
            <div className="text-text-secondary text-base font-normal">
              {calculatedOutput()}
            </div>
            <span className="text-xs text-text-muted font-normal">
              {activeTab === "buy" ? tokenSymbol : gasSymbol}
            </span>
          </div>
        </div>

        {/* Slippage Settings */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-normal">
            Slippage Tolerance (%)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {["0.5", "1.0", "3.0"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlippage(s)}
                className={cn(
                  "py-1.5 text-center text-xs font-normal rounded",
                  slippage === s ? "bg-accent/20 text-accent" : "bg-white/[0.04] text-text-secondary"
                )}
              >
                {s}%
              </button>
            ))}
            <input
              type="text"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
              placeholder="Custom"
              className="bg-white/[0.04] text-center text-xs text-white rounded font-normal outline-none py-1.5"
            />
          </div>
        </div>

        {/* Submit Swap Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-center text-xs font-normal bg-accent hover:bg-accent-hover text-white rounded transition-colors"
        >
          {loading ? "Swapping..." : `Swap to ${activeTab === "buy" ? tokenSymbol : gasSymbol}`}
        </button>
      </form>
    </div>
  );
}
