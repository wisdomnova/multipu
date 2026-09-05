"use client";

import { useState } from "react";
import { X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-surface border border-border rounded-lg p-5 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h3 className="text-sm font-semibold text-text-primary">
              Buy ${token.tokens?.symbol || token.symbol}
            </h3>
            <p className="text-[10px] text-text-dim font-mono">{token.network}</p>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text-primary transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

        {/* Token Summary */}
        <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded border border-border">
          <img
            src={token.tokens?.image_url || token.image_url}
            alt=""
            className="w-9 h-9 rounded object-cover bg-white/[0.04] border border-border"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${token.tokens?.symbol || "token"}`;
            }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-text-primary truncate">
              {token.tokens?.name || token.name}
            </div>
            <div className="text-[11px] text-accent font-mono">
              ${token.tokens?.symbol || token.symbol}
            </div>
          </div>
        </div>

        {/* Amount Input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] text-text-dim uppercase tracking-wider font-mono">
            Pay Amount ({gas})
          </label>
          <div className="bg-white/[0.04] p-3 rounded flex items-center justify-between border border-border">
            <input
              type="number"
              step="0.1"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(Math.max(0.01, parseFloat(e.target.value) || 0))}
              className="bg-transparent text-white text-sm font-mono outline-none w-full"
            />
            <span className="text-xs text-text-muted font-mono">{gas}</span>
          </div>

          {/* Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5 mt-1">
            {[0.1, 0.5, 1, 5].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setAmount(preset)}
                className={cn(
                  "py-1 text-xs font-mono rounded transition-colors",
                  amount === preset
                    ? "bg-accent/20 text-accent border border-accent/40"
                    : "bg-white/[0.04] text-text-secondary hover:text-text-primary"
                )}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Estimated Output */}
        <div className="bg-white/[0.02] p-3 rounded border border-border text-xs font-mono flex justify-between">
          <span className="text-text-dim">Est. Output:</span>
          <span className="text-text-primary">
            ~{estimatedReceive} ${token.tokens?.symbol || token.symbol}
          </span>
        </div>

        {/* Status Messages */}
        {status === "success" && (
          <div className="p-2.5 bg-success/10 border border-success/20 rounded text-xs text-success font-mono text-center">
            Swap completed successfully.
          </div>
        )}

        {status === "error" && (
          <div className="p-2.5 bg-error/10 border border-error/20 rounded text-xs text-error font-mono text-center">
            {errorMessage}
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleExecuteBuy}
          disabled={loading || status === "success"}
          className="w-full py-2.5 text-xs font-mono bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded transition-colors"
        >
          {loading ? "Processing..." : status === "success" ? "Completed" : `Buy with ${amount} ${gas}`}
        </button>
      </div>
    </div>
  );
}
