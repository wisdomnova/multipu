"use client";

import { useState } from "react";
import { IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface QuickBuyModalProps {
  token: any;
  initialAmount?: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function QuickBuyModal({
  token,
  initialAmount = 1,
  isOpen,
  onClose,
  onSuccess,
}: QuickBuyModalProps) {
  if (!isOpen || !token) return null;

  const [amount, setAmount] = useState<number>(initialAmount);
  const [loading, setLoading] = useState<boolean>(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  const gas = token.network?.toLowerCase() === "bsc" ? "BNB" : "SOL";
  const estimatedReceive = (amount * 45000).toLocaleString();

  const handleExecuteBuy = async () => {
    setLoading(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const res = await fetch("/api/trade/swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          launchId: token.id,
          type: "buy",
          amountPay: amount,
          amountReceive: amount * 45000,
          txSignature: "tx-" + Math.random().toString(36).substring(2, 10),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Swap execution failed");
      }

      setStatus("success");
      if (onSuccess) onSuccess();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "Failed to execute buy order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-sm bg-[#181818] border border-white/[0.08] rounded-2xl p-6 flex flex-col gap-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.04]">
          <div>
            <h3 className="text-base font-semibold text-white font-sans">
              Buy ${token.tokens?.symbol || token.symbol}
            </h3>
            <p className="text-[11px] text-neutral-400 font-mono mt-0.5">{token.network}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/[0.05]"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Token Summary */}
        <div className="flex items-center gap-3 p-3.5 bg-[#141414] rounded-xl border border-white/[0.04]">
          <img
            src={token.tokens?.image_url || token.image_url}
            alt=""
            className="w-10 h-10 rounded-lg object-cover bg-black/40 border border-white/[0.06]"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${token.tokens?.symbol || "token"}`;
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-white font-sans truncate">
              {token.tokens?.name || token.name}
            </div>
            <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
              ${token.tokens?.symbol || token.symbol}
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] text-neutral-400 uppercase tracking-wider font-sans font-medium">
            Pay Amount ({gas})
          </label>
          <div className="bg-[#141414] p-3.5 rounded-xl flex items-center justify-between border border-white/[0.08] focus-within:border-white/30 transition-colors">
            <input
              type="number"
              step="0.1"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
              className="bg-transparent text-white text-sm font-mono outline-none w-full"
            />
            <span className="text-xs text-neutral-400 font-mono font-medium">{gas}</span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5 mt-1">
            {[0.1, 0.5, 1, 5].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={cn(
                  "py-1.5 text-xs font-mono rounded-full transition-colors",
                  amount === preset
                    ? "bg-white text-black font-semibold"
                    : "bg-[#141414] text-neutral-400 hover:text-white border border-white/[0.06]"
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Output */}
        <div className="bg-[#141414] p-3.5 rounded-xl border border-white/[0.04] text-xs font-mono flex justify-between items-center">
          <span className="text-neutral-400">Est. Output:</span>
          <span className="text-white font-medium">
            ~{estimatedReceive} ${token.tokens?.symbol || token.symbol}
          </span>
        </div>

        {/* Status Messages */}
        {status === "success" && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 font-mono text-center">
            Swap completed successfully.
          </div>
        )}

        {status === "error" && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono text-center">
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleExecuteBuy}
          disabled={loading || status === "success"}
          className="w-full py-3 text-xs font-sans font-semibold bg-white hover:bg-neutral-200 disabled:opacity-50 text-black rounded-full transition-colors cursor-pointer mt-1"
        >
          {loading ? "Processing..." : status === "success" ? "Completed" : `Buy with ${amount} ${gas}`}
        </button>
      </div>
    </div>
  );
}
