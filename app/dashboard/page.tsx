"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/components/motion";
import {
  Plus,
  TrendingUp,
  Coins,
  Rocket,
  ExternalLink,
  Copy,
  ChevronDown,
  Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";
import { StatsSkeleton, ListSkeleton } from "@/components/skeleton";
import { DataError } from "@/components/error-boundary";
import { toast } from "sonner";

interface DashboardToken {
  id: string;
  name: string;
  symbol: string;
  mint_address: string | null;
  supply: string;
  status: string;
  created_at: string;
  launches: {
    id: string;
    launchpad: string;
    status: string;
    pool_address: string | null;
  }[];
}

interface DashboardData {
  stats: {
    totalTokens: number;
    activeLaunches: number;
    totalEarnings: number;
    earningsToday: number;
    launchpadsUsed: string[];
  };
  tokens: DashboardToken[];
  recentEarnings: {
    id: string;
    amount: number;
    launchpad: string;
    created_at: string;
  }[];
}

const launchpadImages: Record<string, string> = {
  meteora: "/meteora.png",
  bags: "/bags.png",
  pumpfun: "/pumpfun.png",
};

const launchpadNames: Record<string, string> = {
  meteora: "Meteora",
  bags: "Bags",
  pumpfun: "Pump.fun",
};

function formatAddress(addr: string | null) {
  if (!addr) return "—";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function DashboardPage() {
  const { data, loading, error, refetch } = useApi<DashboardData>("/api/dashboard");
  const [selectedToken, setSelectedToken] = useState<string | null>(null);

  const stats = data?.stats;
  const tokens = data?.tokens || [];

  const statItems = [
    {
      label: "Total Tokens",
      value: stats?.totalTokens?.toString() || "0",
      icon: Coins,
      change: tokens.length > 0 ? `${tokens.length} deployed` : "none yet",
    },
    {
      label: "Active Launches",
      value: stats?.activeLaunches?.toString() || "0",
      icon: Rocket,
      change: stats?.launchpadsUsed?.length
        ? `across ${stats.launchpadsUsed.length} pads`
        : "no launches",
    },
    {
      label: "Total Earnings",
      value: stats?.totalEarnings?.toFixed(2) || "0.00",
      icon: TrendingUp,
      change: stats?.earningsToday
        ? `+${stats.earningsToday.toFixed(2)} today`
        : "no earnings yet",
      unit: "SOL",
    },
    {
      label: "Launchpads Used",
      value: stats?.launchpadsUsed?.length?.toString() || "0",
      icon: Activity,
      change: stats?.launchpadsUsed?.map((p) => launchpadNames[p] || p).join(", ") || "none",
    },
  ];

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="mb-10"
      >
        <motion.div
          variants={fadeUp}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Dashboard
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Track your tokens, launches, and earnings.
            </p>
          </div>
          <Link
            href="/launch"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.3)]"
          >
            <Plus size={16} />
            Launch Token
          </Link>
        </motion.div>
      </motion.div>

      {/* Loading Skeleton */}
      {loading && (
        <>
          <StatsSkeleton count={4} />
          <ListSkeleton count={3} />
        </>
      )}

      {/* Error State */}
      {error && !loading && (
        <DataError message={error} onRetry={refetch} />
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {/* Stats grid */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border mb-10"
          >
            {statItems.map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="bg-background p-6 hover:bg-elevated transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <stat.icon size={14} className="text-text-muted" />
                  <span className="font-mono text-[0.65rem] text-text-muted uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-text-primary">
                    {stat.value}
                  </span>
                  {stat.unit && (
                    <span className="text-sm font-mono text-text-muted">
                      {stat.unit}
                    </span>
                  )}
                </div>
                <span className="mt-1.5 text-xs text-text-dim block">
                  {stat.change}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Tokens table */}
          <motion.div initial="hidden" animate="visible" variants={stagger}>
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-between mb-4"
            >
              <h2 className="text-base font-semibold text-text-primary">
                Your Tokens
              </h2>
              <button className="font-mono text-xs text-text-muted hover:text-text-primary transition-colors flex items-center gap-1">
                Sort by <ChevronDown size={12} />
              </button>
            </motion.div>

            {tokens.length > 0 ? (
              <motion.div
                variants={fadeUp}
                className="border border-border divide-y divide-border"
              >
                {tokens.map((token) => {
                  const totalLive = token.launches.filter(
                    (l) => l.status === "live"
                  ).length;

                  return (
                    <div
                      key={token.id}
                      className="group hover:bg-elevated transition-colors"
                    >
                      <button
                        onClick={() =>
                          setSelectedToken(
                            selectedToken === token.id ? null : token.id
                          )
                        }
                        className="w-full text-left p-5 flex items-center gap-4"
                      >
                        <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                          <Coins size={16} className="text-accent" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-text-primary">
                              {token.name}
                            </span>
                            <span className="font-mono text-xs text-text-muted">
                              ${token.symbol}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="font-mono text-[11px] text-text-dim">
                              {formatAddress(token.mint_address)}
                            </span>
                            <span className="text-[11px] text-text-dim">
                              {timeAgo(token.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="hidden md:flex items-center gap-2">
                          {token.launches.map((launch) => (
                            <div
                              key={launch.id}
                              className="flex items-center gap-1.5 px-2.5 py-1 border border-border text-xs"
                            >
                              <span
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  launch.status === "live"
                                    ? "bg-success"
                                    : "bg-warning"
                                )}
                              />
                              <span className="text-text-secondary font-mono">
                                {launchpadNames[launch.launchpad] ||
                                  launch.launchpad}
                              </span>
                            </div>
                          ))}
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-mono font-semibold text-text-primary">
                            {totalLive} live
                          </div>
                          <div className="text-[11px] text-text-dim">
                            launches
                          </div>
                        </div>

                        <ChevronDown
                          size={14}
                          className={cn(
                            "text-text-dim transition-transform flex-shrink-0",
                            selectedToken === token.id && "rotate-180"
                          )}
                        />
                      </button>

                      {selectedToken === token.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="border-t border-border bg-elevated"
                        >
                          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                              <span className="font-mono text-[0.65rem] text-text-dim uppercase tracking-[0.15em]">
                                // Token Details
                              </span>
                              <div className="space-y-2">
                                {[
                                  {
                                    label: "Address",
                                    value: formatAddress(token.mint_address),
                                  },
                                  { label: "Supply", value: Number(token.supply).toLocaleString() },
                                  {
                                    label: "Deployed",
                                    value: timeAgo(token.created_at),
                                  },
                                  { label: "Status", value: token.status },
                                ].map((row) => (
                                  <div
                                    key={row.label}
                                    className="flex items-center justify-between text-xs"
                                  >
                                    <span className="text-text-muted">
                                      {row.label}
                                    </span>
                                    <span className="font-mono text-text-primary flex items-center gap-1.5">
                                      {row.value}
                                      {row.label === "Address" &&
                                        token.mint_address && (
                                          <Copy
                                            size={10}
                                            className="text-text-dim hover:text-text-muted cursor-pointer"
                                            onClick={() => {
                                              navigator.clipboard.writeText(
                                                token.mint_address!
                                              );
                                              toast.success("Copied!");
                                            }}
                                          />
                                        )}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <span className="font-mono text-[0.65rem] text-text-dim uppercase tracking-[0.15em]">
                                // Launches
                              </span>
                              <div className="space-y-2">
                                {token.launches.map((launch) => (
                                  <div
                                    key={launch.id}
                                    className="flex items-center justify-between p-3 border border-border"
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <div className="relative w-6 h-6 rounded-md overflow-hidden">
                                        <Image
                                          src={
                                            launchpadImages[launch.launchpad] ||
                                            "/meteora.png"
                                          }
                                          alt={launch.launchpad}
                                          fill
                                          className="object-cover"
                                        />
                                      </div>
                                      <span className="text-xs font-medium text-text-primary">
                                        {launchpadNames[launch.launchpad] ||
                                          launch.launchpad}
                                      </span>
                                      <span
                                        className={cn(
                                          "flex items-center gap-1 font-mono text-[10px]",
                                          launch.status === "live"
                                            ? "text-success"
                                            : "text-warning"
                                        )}
                                      >
                                        <span
                                          className={cn(
                                            "w-1 h-1 rounded-full",
                                            launch.status === "live"
                                              ? "bg-success"
                                              : "bg-warning"
                                          )}
                                        />
                                        {launch.status}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono text-xs text-text-dim">
                                        {formatAddress(launch.pool_address)}
                                      </span>
                                      {launch.pool_address && (
                                        <ExternalLink
                                          size={10}
                                          className="text-text-dim hover:text-text-muted cursor-pointer"
                                        />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </motion.div>
            ) : (
              <div className="border border-dashed border-border p-12 text-center">
                <Coins size={32} className="text-text-dim mx-auto mb-4" />
                <h3 className="text-base font-semibold text-text-primary mb-2">
                  No tokens yet
                </h3>
                <p className="text-sm text-text-secondary mb-6">
                  Launch your first token to get started.
                </p>
                <Link
                  href="/launch"
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all"
                >
                  <Plus size={16} />
                  Launch Token
                </Link>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
