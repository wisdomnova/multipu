"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/components/motion";
import { TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";
import { StatsSkeleton, ListSkeleton } from "@/components/skeleton";
import { DataError } from "@/components/error-boundary";

interface EarningEntry {
  id: string;
  amount: number;
  launchpad: string;
  token_id: string;
  tx_signature: string | null;
  created_at: string;
}

interface EarningsResponse {
  earnings: EarningEntry[];
  summary: {
    total: number;
    byLaunchpad: Record<string, number>;
    count: number;
  };
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

function timeAgo(dateStr: string) {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function EarningsPage() {
  // Fetch different time periods
  const {
    data: allData,
    loading: allLoading,
    error: allError,
    refetch,
  } = useApi<EarningsResponse>("/api/earnings?period=all");
  const { data: todayData } = useApi<EarningsResponse>(
    "/api/earnings?period=24h"
  );
  const { data: weekData } = useApi<EarningsResponse>(
    "/api/earnings?period=7d"
  );
  const { data: monthData } = useApi<EarningsResponse>(
    "/api/earnings?period=30d"
  );

  const totalAll = allData?.summary?.total || 0;
  const totalToday = todayData?.summary?.total || 0;
  const totalWeek = weekData?.summary?.total || 0;
  const totalMonth = monthData?.summary?.total || 0;
  const byLaunchpad = allData?.summary?.byLaunchpad || {};
  const recentEarnings = allData?.earnings?.slice(0, 10) || [];

  // Build per-launchpad sections
  const launchpadSections = Object.entries(byLaunchpad).map(([id, total]) => ({
    id,
    name: launchpadNames[id] || id,
    image: launchpadImages[id] || "/meteora.png",
    totalEarnings: total,
    todayEarnings:
      todayData?.summary?.byLaunchpad?.[id] || 0,
  }));

  const loading = allLoading;
  const error = allError;

  return (
    <div className="p-6 md:p-10">
      {/* Header */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="mb-10"
      >
        <motion.div variants={fadeUp}>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Earnings
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Creator fees and revenue from all launchpads.
          </p>
        </motion.div>
      </motion.div>

      {loading && (
        <>
          <StatsSkeleton count={4} />
          <ListSkeleton count={3} />
        </>
      )}

      {error && !loading && <DataError message={error} onRetry={refetch} />}

      {!loading && !error && (
        <>
          {/* Summary cards */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-border border border-border mb-10"
          >
            {[
              {
                label: "Total Earnings",
                value: totalAll,
                period: "all time",
              },
              {
                label: "Today",
                value: totalToday,
                period: "24h",
                positive: totalToday > 0,
              },
              {
                label: "This Week",
                value: totalWeek,
                period: "7d",
                positive: totalWeek > 0,
              },
              {
                label: "This Month",
                value: totalMonth,
                period: "30d",
                positive: totalMonth > 0,
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="bg-background p-5 md:p-6 hover:bg-elevated transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp size={14} className="text-text-muted" />
                  <span className="font-mono text-[0.65rem] text-text-muted uppercase tracking-wider">
                    {stat.label}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-mono text-text-primary">
                    {stat.value.toFixed(2)}
                  </span>
                  <span className="text-sm font-mono text-text-muted">
                    SOL
                  </span>
                </div>
                {stat.positive && (
                  <span className="mt-1.5 text-xs text-success flex items-center gap-0.5">
                    <ArrowUpRight size={10} />+{stat.value.toFixed(2)}{" "}
                    {stat.period}
                  </span>
                )}
              </motion.div>
            ))}
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Earnings by launchpad */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="lg:col-span-3"
            >
              <motion.h2
                variants={fadeUp}
                className="text-base font-semibold text-text-primary mb-4"
              >
                By Launchpad
              </motion.h2>

              {launchpadSections.length > 0 ? (
                <div className="space-y-4">
                  {launchpadSections.map((pad) => (
                    <motion.div
                      key={pad.id}
                      variants={fadeUp}
                      className="border border-border hover:bg-elevated transition-colors"
                    >
                      <div className="p-5 md:p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-border">
                              <Image
                                src={pad.image}
                                alt={pad.name}
                                fill
                                className="object-cover"
                              />
                            </div>
                            <div>
                              <span className="text-sm font-semibold text-text-primary">
                                {pad.name}
                              </span>
                              {pad.todayEarnings > 0 && (
                                <div className="text-[10px] font-mono text-success flex items-center gap-0.5 mt-0.5">
                                  <ArrowUpRight size={8} />+
                                  {pad.todayEarnings.toFixed(2)} SOL today
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold font-mono text-text-primary">
                              {pad.totalEarnings.toFixed(2)} SOL
                            </div>
                            <div className="text-[10px] font-mono text-text-dim">
                              total earned
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="border border-dashed border-border p-8 text-center">
                  <TrendingUp
                    size={24}
                    className="text-text-dim mx-auto mb-3"
                  />
                  <p className="text-sm text-text-secondary">
                    No earnings recorded yet. Creator fees will appear here
                    once your tokens are trading.
                  </p>
                </div>
              )}
            </motion.div>

            {/* Recent transactions */}
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="lg:col-span-2"
            >
              <motion.h2
                variants={fadeUp}
                className="text-base font-semibold text-text-primary mb-4"
              >
                Recent Activity
              </motion.h2>

              {recentEarnings.length > 0 ? (
                <motion.div
                  variants={fadeUp}
                  className="border border-border divide-y divide-border"
                >
                  {recentEarnings.map((tx) => (
                    <div
                      key={tx.id}
                      className="p-4 hover:bg-elevated transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-sm bg-success/10 border border-success/20 flex items-center justify-center">
                            <ArrowUpRight size={12} className="text-success" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-text-primary">
                                Creator fee
                              </span>
                            </div>
                            <div className="text-[10px] text-text-dim font-mono mt-0.5">
                              {launchpadNames[tx.launchpad] || tx.launchpad} ·{" "}
                              {timeAgo(tx.created_at)}
                            </div>
                          </div>
                        </div>
                        <span className="font-mono text-xs font-semibold text-success">
                          +{tx.amount.toFixed(4)} SOL
                        </span>
                      </div>
                    </div>
                  ))}
                </motion.div>
              ) : (
                <div className="border border-dashed border-border p-8 text-center">
                  <p className="text-sm text-text-secondary">
                    No recent activity.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
