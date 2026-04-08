"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/components/motion";
import {
  Plus,
  Rocket,
  ExternalLink,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";
import { StatsSkeleton, ListSkeleton } from "@/components/skeleton";
import { DataError } from "@/components/error-boundary";

interface Launch {
  id: string;
  launchpad: string;
  status: string;
  pool_address: string | null;
  initial_liquidity: number | null;
  launch_tx: string | null;
  launched_at: string | null;
  created_at: string;
  token: {
    name: string;
    symbol: string;
    mint_address: string | null;
  };
}

interface LaunchesResponse {
  launches: Launch[];
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

const statusConfig: Record<
  string,
  {
    label: string;
    icon: typeof CheckCircle2;
    color: string;
    dotColor: string;
    bgColor: string;
  }
> = {
  live: {
    label: "Live",
    icon: CheckCircle2,
    color: "text-success",
    dotColor: "bg-success",
    bgColor: "bg-success/5 border-success/20",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-warning",
    dotColor: "bg-warning",
    bgColor: "bg-warning/5 border-warning/20",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    color: "text-error",
    dotColor: "bg-error",
    bgColor: "bg-error/5 border-error/20",
  },
};

function formatAddress(addr: string | null) {
  if (!addr) return "—";
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

function timeAgo(dateStr: string | null) {
  if (!dateStr) return "—";
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function LaunchesPage() {
  const { data, loading, error, refetch } =
    useApi<LaunchesResponse>("/api/launches");

  const launches = data?.launches || [];
  const liveCount = launches.filter((l) => l.status === "live").length;
  const pendingCount = launches.filter((l) => l.status === "pending").length;

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
              Launches
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Track all your launchpad deployments.
            </p>
          </div>
          <Link
            href="/launch"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.3)]"
          >
            <Plus size={16} />
            New Launch
          </Link>
        </motion.div>
      </motion.div>

      {loading && (
        <>
          <StatsSkeleton count={3} />
          <ListSkeleton count={4} />
        </>
      )}

      {error && !loading && (
        <DataError message={error} onRetry={refetch} />
      )}

      {!loading && !error && (
        <>
          {/* Status summary */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-3 gap-px bg-border border border-border mb-10"
          >
            {[
              { label: "Total Launches", value: launches.length.toString() },
              {
                label: "Live",
                value: liveCount.toString(),
                color: "text-success",
              },
              {
                label: "Pending",
                value: pendingCount.toString(),
                color: "text-warning",
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="bg-background p-5 hover:bg-elevated transition-colors"
              >
                <span className="font-mono text-[0.65rem] text-text-muted uppercase tracking-wider block mb-2">
                  {stat.label}
                </span>
                <span
                  className={cn(
                    "text-2xl font-bold font-mono",
                    stat.color || "text-text-primary"
                  )}
                >
                  {stat.value}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Launches list */}
          <motion.div
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="space-y-3"
          >
            <motion.div
              variants={fadeUp}
              className="flex items-center justify-between mb-2"
            >
              <h2 className="text-base font-semibold text-text-primary">
                All Launches
              </h2>
            </motion.div>

            {launches.map((launch) => {
              const status =
                statusConfig[launch.status] || statusConfig.pending;
              return (
                <motion.div
                  key={launch.id}
                  variants={fadeUp}
                  className="group border border-border hover:bg-elevated transition-colors"
                >
                  <div className="p-5 md:p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-border flex-shrink-0">
                        <Image
                          src={
                            launchpadImages[launch.launchpad] || "/meteora.png"
                          }
                          alt={launch.launchpad}
                          fill
                          className="object-cover"
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-text-primary">
                            {launch.token?.name || "Unknown"}
                          </span>
                          <span className="font-mono text-xs text-text-muted">
                            ${launch.token?.symbol || "???"}
                          </span>
                          <span className="text-text-dim mx-1">→</span>
                          <span className="text-sm text-text-secondary">
                            {launchpadNames[launch.launchpad] ||
                              launch.launchpad}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] text-text-dim font-mono">
                          <span>
                            Pool: {formatAddress(launch.pool_address)}
                          </span>
                          <span>
                            {timeAgo(launch.launched_at || launch.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="hidden md:flex items-center gap-6 flex-shrink-0">
                        <div className="text-right">
                          <div className="text-[10px] font-mono text-text-dim uppercase tracking-wider mb-0.5">
                            Liquidity
                          </div>
                          <div className="text-xs font-mono text-text-primary">
                            {launch.initial_liquidity
                              ? `${launch.initial_liquidity} SOL`
                              : "—"}
                          </div>
                        </div>
                      </div>

                      <div
                        className={cn(
                          "flex items-center gap-1.5 px-2.5 py-1 border text-xs font-mono flex-shrink-0",
                          status.bgColor
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            status.dotColor
                          )}
                        />
                        <span className={status.color}>{status.label}</span>
                      </div>

                      {launch.launch_tx && (
                        <a
                          href={`https://explorer.solana.com/tx/${launch.launch_tx}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <ExternalLink
                            size={14}
                            className="text-text-dim hover:text-text-muted cursor-pointer flex-shrink-0"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Empty state */}
          {launches.length === 0 && (
            <div className="border border-dashed border-border p-12 text-center">
              <Rocket size={32} className="text-text-dim mx-auto mb-4" />
              <h3 className="text-base font-semibold text-text-primary mb-2">
                No launches yet
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                Deploy a token and push it to a launchpad.
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
        </>
      )}
    </div>
  );
}
