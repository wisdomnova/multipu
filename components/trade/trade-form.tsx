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
          txSignature: "tx-" + Math.random().toString(36).substr(2, 9),
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
    <div className="bg-[#181818] p-6 rounded-2xl border border-white/[0.04] flex flex-col gap-5">
      {/* Tabs */}
      <div className="grid grid-cols-2 bg-[#141414] p-1 rounded-full border border-white/[0.04]">
        <button
          type="button"
          onClick={() => {
            setActiveTab("buy");
            setPayAmount("");
          }}
          className={cn(
            "py-2 text-center text-xs font-sans font-medium transition-colors rounded-full cursor-pointer",
            activeTab === "buy"
              ? "bg-white text-black font-semibold"
              : "text-neutral-400 hover:text-white"
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
            "py-2 text-center text-xs font-sans font-medium transition-colors rounded-full cursor-pointer",
            activeTab === "sell"
              ? "bg-white text-black font-semibold"
              : "text-neutral-400 hover:text-white"
          )}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSwap} className="flex flex-col gap-4">
        {/* Input Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-sans font-medium">
            Pay Amount ({activeTab === "buy" ? gasSymbol : tokenSymbol})
          </label>
          <div className="bg-[#141414] p-3.5 rounded-xl flex items-center justify-between border border-white/[0.08] focus-within:border-white/30 transition-colors">
            <input
              type="text"
              value={payAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="0.0"
              className="bg-transparent text-white text-sm font-mono outline-none w-full"
            />
            <span className="text-xs text-neutral-400 font-mono font-medium">
              {activeTab === "buy" ? gasSymbol : tokenSymbol}
            </span>
          </div>
        </div>

        {/* Estimated Output Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-sans font-medium">
            Receive Amount ({activeTab === "buy" ? tokenSymbol : gasSymbol})
          </label>
          <div className="bg-[#141414] p-3.5 rounded-xl border border-white/[0.04] flex items-center justify-between">
            <div className="text-white text-sm font-mono font-medium">
              {calculatedOutput()}
            </div>
            <span className="text-xs text-neutral-400 font-mono font-medium">
              {activeTab === "buy" ? tokenSymbol : gasSymbol}
            </span>
          </div>
        </div>

        {/* Slippage Settings */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-sans font-medium">
            Slippage Tolerance (%)
          </label>
          <div className="grid grid-cols-4 gap-2">
            {["0.5", "1.0", "3.0"].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSlippage(s)}
                className={cn(
                  "py-1.5 text-center text-xs font-mono rounded-full transition-colors cursor-pointer",
                  slippage === s
                    ? "bg-white text-black font-semibold"
                    : "bg-[#141414] text-neutral-400 hover:text-white border border-white/[0.06]"
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
              className="bg-[#141414] border border-white/[0.06] text-center text-xs text-white rounded-full font-mono outline-none py-1.5 focus:border-white/30"
            />
          </div>
        </div>

        {/* Submit Swap Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 text-center text-xs font-sans font-semibold bg-white hover:bg-neutral-200 text-black rounded-full transition-colors cursor-pointer disabled:opacity-50 mt-1"
        >
          {loading ? "Processing..." : `Swap to ${activeTab === "buy" ? tokenSymbol : gasSymbol}`}
        </button>
      </form>
    </div>
  );
}
