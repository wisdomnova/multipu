"use client";

import { useState } from "react";
import Link from "next/link";
import { IconCopy, IconCheck, IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface TerminalToken {
  id: string;
  launchpad: string;
  network: string;
  pool_address: string | null;
  volume_24h: number;
  market_cap: number;
  fdv: number;
  price_usd: number;
  price_change_24h: number;
  time_ago: string;
  category: "trending" | "final_stretch" | "migrated" | "new";
  progress: number;
  dev_holding_pct: number;
  top_10_pct: number;
  snipers_pct: number;
  holders_count: number;
  tokens: {
    id: string;
    name: string;
    symbol: string;
    mint_address: string;
    image_url: string;
    header_url: string | null;
    description: string;
    socials: {
      website?: string;
      twitter?: string;
      telegram?: string;
    };
  };
}

interface TerminalColumnBoardProps {
  columns: {
    final_stretch: TerminalToken[];
    migrated: TerminalToken[];
    new_pairs: TerminalToken[];
  };
  columnCounts?: {
    final_stretch: number;
    migrated: number;
    new_pairs: number;
  };
  pagination?: {
    page: number;
    limit: number;
    totalLaunches: number;
    totalPages: number;
  };
  onPageChange?: (page: number) => void;
  onQuickBuy?: (token: TerminalToken, solAmount: number) => void;
}

function formatUSD(num: number): string {
  if (!num) return "$0";
  if (num >= 1_000_000_000) return `$${(num / 1_000_000_000).toFixed(2)}B`;
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(2)}M`;
  if (num >= 1_000) return `$${(num / 1_000).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
}

export function TerminalColumnBoard({
  columns,
  columnCounts,
  pagination,
  onPageChange,
  onQuickBuy,
}: TerminalColumnBoardProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [quickBuyAmount, setQuickBuyAmount] = useState<number>(1);

  const handleCopyAddress = (e: React.MouseEvent, address: string, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const columnConfig = [
    {
      key: "final_stretch",
      title: "Final Stretch",
      subtitle: "Bonding curve completing",
      totalCount: columnCounts?.final_stretch ?? (columns.final_stretch?.length || 0),
      tokens: columns.final_stretch || [],
    },
    {
      key: "migrated",
      title: "Migrated",
      subtitle: "Raydium and DEX pools",
      totalCount: columnCounts?.migrated ?? (columns.migrated?.length || 0),
      tokens: columns.migrated || [],
    },
    {
      key: "new_pairs",
      title: "New Pairs",
      subtitle: "Recent token launches",
      totalCount: columnCounts?.new_pairs ?? (columns.new_pairs?.length || 0),
      tokens: columns.new_pairs || [],
    },
  ];

  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalLaunches || 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Amount Selector Bar */}
      <div className="flex items-center justify-between bg-white/[0.02] border border-border px-4 py-3 rounded-lg flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-text-muted">Preset:</span>
          {[0.1, 0.5, 1, 5, 10].map((amt) => (
            <button
              key={amt}
              onClick={() => setQuickBuyAmount(amt)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono rounded transition-colors",
                quickBuyAmount === amt
                  ? "bg-accent text-white font-medium"
                  : "bg-white/[0.04] text-text-secondary hover:text-text-primary"
              )}
            >
              {amt} SOL
            </button>
          ))}
        </div>

        <div className="text-[11px] font-mono text-text-dim">
          Real-time DEX Data
        </div>
      </div>

      {/* 3 Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {columnConfig.map((col) => (
          <div
            key={col.key}
            className="flex flex-col bg-white/[0.02] border border-border rounded-lg overflow-hidden"
          >
            {/* Column Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-white/[0.01]">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-primary font-mono">
                  {col.title}
                </h3>
                <p className="text-[10px] text-text-dim font-mono mt-0.5">
                  {col.subtitle} ({col.totalCount})
                </p>
              </div>
            </div>

            {/* Column Tokens List */}
            <div className="flex-1 overflow-y-auto divide-y divide-border p-3 space-y-3 min-h-[500px]">
              {col.tokens.map((item) => {
                const t = item.tokens;
                const isCopied = copiedId === item.id;
                const net = item.network?.toLowerCase() || "";
                const gas = net === "bsc" ? "BNB" : net === "robinhood" ? "ROBIN" : "SOL";

                return (
                  <div
                    key={item.id}
                    className="p-3.5 bg-white/[0.02] hover:bg-white/[0.04] border border-border hover:border-border-hover rounded-lg transition-colors flex flex-col gap-3"
                  >
                    {/* Top Row: Thumbnail + Ticker/Name + Price/MC */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded bg-white/[0.04] border border-border flex-shrink-0 overflow-hidden">
                          <img
                            src={t.image_url}
                            alt={t.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${t.symbol}`;
                            }}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-text-primary truncate">
                              {t.name}
                            </span>
                            <button
                              onClick={(e) => handleCopyAddress(e, t.mint_address || item.id, item.id)}
                              className="text-text-dim hover:text-text-secondary transition-colors p-0.5"
                              title="Copy contract address"
                            >
                              {isCopied ? <IconCheck size={11} className="text-success" /> : <IconCopy size={11} />}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs font-mono text-accent">
                              ${t.symbol}
                            </span>
                            <span className="text-[10px] font-mono text-text-dim">
                              {item.time_ago}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: MC & Volume */}
                      <div className="text-right flex-shrink-0 font-mono">
                        <div className="text-xs text-text-primary font-medium">
                          MC: {formatUSD(item.market_cap)}
                        </div>
                        <div className="text-[10px] text-text-dim">
                          Vol: {formatUSD(item.volume_24h)}
                        </div>
                      </div>
                    </div>

                    {/* Middle Row: On-chain Holder Metrics */}
                    <div className="grid grid-cols-4 gap-2 py-2 px-2.5 bg-white/[0.02] rounded border border-border text-[10px] font-mono text-text-muted">
                      <div>
                        <span className="text-text-dim block">Holders</span>
                        <span className="text-text-primary">{item.holders_count}</span>
                      </div>
                      <div>
                        <span className="text-text-dim block">Top 10</span>
                        <span className="text-text-secondary">{item.top_10_pct}%</span>
                      </div>
                      <div>
                        <span className="text-text-dim block">Dev</span>
                        <span className="text-text-secondary">{item.dev_holding_pct}%</span>
                      </div>
                      <div>
                        <span className="text-text-dim block">Snipers</span>
                        <span className="text-text-secondary">{item.snipers_pct}%</span>
                      </div>
                    </div>

                    {/* Bonding curve progress bar */}
                    {item.progress > 0 && (
                      <div className="w-full flex flex-col gap-1">
                        <div className="flex justify-between text-[9px] font-mono text-text-dim">
                          <span>Curve Progress</span>
                          <span className="text-text-secondary">{item.progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/[0.04] rounded overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-300 rounded"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Bottom Row: Social links + Actions */}
                    <div className="flex items-center justify-between pt-1 border-t border-border">
                      {/* Socials */}
                      <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted">
                        {t.socials.website && (
                          <a
                            href={t.socials.website}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-text-primary transition-colors"
                          >
                            Web
                          </a>
                        )}
                        {t.socials.twitter && (
                          <a
                            href={t.socials.twitter}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-text-primary transition-colors"
                          >
                            X
                          </a>
                        )}
                        {t.socials.telegram && (
                          <a
                            href={t.socials.telegram}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:text-text-primary transition-colors"
                          >
                            TG
                          </a>
                        )}
                        <a
                          href={`https://dexscreener.com/${item.network.toLowerCase()}/${item.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-text-primary transition-colors"
                        >
                          Dex
                        </a>
                      </div>

                      {/* Quick Buy & Trade buttons */}
                      <div className="flex items-center gap-2">
                        {onQuickBuy && (
                          <button
                            onClick={() => onQuickBuy(item, quickBuyAmount)}
                            className="px-2.5 py-1 text-xs font-mono text-text-primary bg-white/[0.04] hover:bg-white/[0.08] border border-border rounded transition-colors"
                          >
                            Buy {quickBuyAmount} {gas}
                          </button>
                        )}

                        <Link
                          href={`/dashboard/trade/${item.id}`}
                          className="px-3 py-1 text-xs font-mono text-white bg-accent hover:bg-accent-hover rounded transition-colors"
                        >
                          Trade
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {col.tokens.length === 0 && (
                <div className="py-12 text-center text-xs font-mono text-text-dim">
                  No active tokens
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="border border-border bg-white/[0.02] p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs font-mono text-text-dim">
            Showing page {currentPage} of {totalPages} ({totalItems} total tokens)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-xs font-mono bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-white/[0.04] text-text-secondary hover:text-white border border-border rounded transition-colors flex items-center gap-1"
            >
              <IconChevronLeft size={14} />
              <span>Previous</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = Math.min(currentPage - 2 + i, totalPages - (4 - i));
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange && onPageChange(pageNum)}
                    className={cn(
                      "w-8 h-8 text-xs font-mono rounded transition-colors",
                      currentPage === pageNum
                        ? "bg-accent text-white font-semibold"
                        : "bg-white/[0.04] text-text-secondary hover:text-white border border-border"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-xs font-mono bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:hover:bg-white/[0.04] text-text-secondary hover:text-white border border-border rounded transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <IconChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
