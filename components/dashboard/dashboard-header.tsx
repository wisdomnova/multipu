"use client";

import { IconRefresh } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useWalletBalances } from "@/hooks/use-wallet-balances";

function formatBalance(val: number) {
  if (val === 0) return "0.00";
  if (val < 0.0001) return "<0.0001";
  if (val < 1) return val.toFixed(4);
  if (val < 1000) return val.toFixed(3);
  return val.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

export function DashboardHeader() {
  const { balances, isLoading, refresh } = useWalletBalances();

  const chains = [
    {
      key: "solana",
      label: "Solana",
      symbol: "SOL",
      data: balances.solana,
    },
    {
      key: "bsc",
      label: "BNB Chain",
      symbol: "BNB",
      data: balances.bsc,
    },
    {
      key: "robinhood",
      label: "Robinhood",
      symbol: "ETH",
      data: balances.robinhood,
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5">
        
        {/* Title: Balance */}
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-bold font-mono tracking-wider text-text-primary uppercase">
            Balance
          </span>
        </div>

        {/* Supported Chain Balances - Prominent & Bold */}
        <div className="flex items-center gap-1 sm:gap-2 bg-elevated/80 border border-border px-3 sm:px-4 py-1.5 sm:py-2 rounded-sm shadow-sm">
          {chains.map((chain, index) => {
            const hasBalance = chain.data.balance > 0;
            return (
              <div
                key={chain.key}
                className={cn(
                  "flex items-baseline gap-2 px-2 sm:px-3 py-0.5 font-mono whitespace-nowrap transition-colors",
                  index > 0 && "border-l border-border pl-3 sm:pl-4",
                  hasBalance ? "text-text-primary" : "text-text-muted"
                )}
                title={`${chain.label}: ${chain.data.balance} ${chain.symbol}`}
              >
                <span className="text-xs font-semibold uppercase tracking-wider text-text-dim">
                  {chain.symbol}
                </span>
                <span className={cn(
                  "text-sm sm:text-base font-bold font-mono tracking-tight",
                  hasBalance ? "text-accent" : "text-text-secondary"
                )}>
                  {formatBalance(chain.data.balance)}
                </span>
              </div>
            );
          })}

          {/* Refresh balances button */}
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-1.5 text-text-dim hover:text-text-primary hover:bg-white/[0.04] rounded transition-colors disabled:opacity-50 ml-1.5 sm:ml-2"
            title="Refresh balances"
            aria-label="Refresh balances"
          >
            <IconRefresh
              size={15}
              className={cn(isLoading && "animate-spin text-accent")}
            />
          </button>
        </div>

      </div>
    </header>
  );
}
