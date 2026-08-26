"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Trade {
  id: string;
  type: "buy" | "sell";
  amountPay: number;
  amountReceive: number;
  wallet: string;
  timestamp: string;
}

interface TradeHistoryProps {
  launchId: string;
  refreshTrigger: number;
}

export function TradeHistory({ launchId, refreshTrigger }: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);

  // Generate some realistic seed trades when component mounts
  useEffect(() => {
    const list: Trade[] = [];
    const now = Date.now();
    for (let i = 0; i < 5; i++) {
      const type = Math.random() > 0.5 ? ("buy" as const) : ("sell" as const);
      const amountPay = parseFloat((Math.random() * 2 + 0.1).toFixed(4));
      const amountReceive = amountPay * 1000000;
      const wallet = "0x" + Math.random().toString(16).substr(2, 8) + "..." + Math.random().toString(16).substr(2, 4);
      const timeOffset = (i + 1) * 3 * 60 * 1000; // minutes ago
      
      list.push({
        id: "seed-" + i,
        type,
        amountPay,
        amountReceive,
        wallet,
        timestamp: new Date(now - timeOffset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
    }
    setTrades(list);
  }, [launchId]);

  // When a user makes a trade, append it to the trade history list
  useEffect(() => {
    if (refreshTrigger > 0) {
      // Simulate adding a new user transaction locally
      const randomType = Math.random() > 0.5 ? "buy" : "sell";
      const randomAmount = parseFloat((Math.random() * 0.5 + 0.05).toFixed(4));
      const newUserTrade: Trade = {
        id: "user-" + Date.now(),
        type: randomType as "buy" | "sell",
        amountPay: randomAmount,
        amountReceive: randomAmount * 1000000,
        wallet: "You",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setTrades((prev) => [newUserTrade, ...prev]);
    }
  }, [refreshTrigger]);

  return (
    <div className="bg-white/[0.02] p-5 rounded-lg flex flex-col gap-4">
      <div className="text-[10px] text-text-dim uppercase tracking-wider font-normal">
        Recent Trades
      </div>
      
      <div className="flex flex-col gap-3">
        {trades.map((trade) => (
          <div key={trade.id} className="flex items-center justify-between text-xs py-1">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-normal uppercase tracking-wider text-[10px]",
                  trade.type === "buy" ? "text-success" : "text-error"
                )}
              >
                {trade.type}
              </span>
              <span className="font-mono text-text-muted font-normal">
                {trade.wallet}
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="font-mono text-text-primary font-normal">
                {trade.amountPay.toFixed(4)}
              </span>
              <span className="text-[10px] text-text-dim font-normal">
                {trade.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
