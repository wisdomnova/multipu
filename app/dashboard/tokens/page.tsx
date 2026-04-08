"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/components/motion";
import {
  Plus,
  Coins,
  Copy,
  ExternalLink,
  Search,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";
import { ListSkeleton } from "@/components/skeleton";
import { DataError } from "@/components/error-boundary";
import { toast } from "sonner";
import { useState, useMemo } from "react";

interface Token {
  id: string;
  name: string;
  symbol: string;
  mint_address: string | null;
  supply: string;
  decimals: number;
  status: string;
  created_at: string;
  launches: { id: string; launchpad: string; status: string }[];
}

interface TokensResponse {
  tokens: Token[];
}

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

export default function TokensPage() {
  const { data, loading, error, refetch } =
    useApi<TokensResponse>("/api/tokens");
  const [search, setSearch] = useState("");

  const tokens = useMemo(() => {
    const all = data?.tokens || [];
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.symbol.toLowerCase().includes(q) ||
        t.mint_address?.toLowerCase().includes(q)
    );
  }, [data, search]);

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
              Tokens
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              All your deployed tokens in one place.
            </p>
          </div>
          <Link
            href="/launch"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.3)]"
          >
            <Plus size={16} />
            Create Token
          </Link>
        </motion.div>
      </motion.div>

      {/* Search & Filter bar */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mb-6 flex items-center gap-3"
      >
        <div className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
          />
          <input
            type="text"
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim transition-colors font-mono"
          />
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono text-text-muted border border-border hover:border-border-hover transition-colors">
          Status <ChevronDown size={12} />
        </button>
      </motion.div>

      {/* Loading */}
      {loading && <ListSkeleton count={3} />}

      {/* Error */}
      {error && !loading && <DataError message={error} onRetry={refetch} />}

      {/* Token cards */}
      {!loading && !error && (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-3"
        >
          {tokens.map((token) => (
            <motion.div
              key={token.id}
              variants={fadeUp}
              className="group border border-border hover:bg-elevated transition-colors"
            >
              <div className="p-5 md:p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <Coins size={20} className="text-accent" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-semibold text-text-primary">
                        {token.name}
                      </span>
                      <span className="font-mono text-xs text-text-muted px-1.5 py-0.5 border border-border">
                        ${token.symbol}
                      </span>
                      <span
                        className={cn(
                          "flex items-center gap-1 font-mono text-[10px] ml-1",
                          token.status === "active"
                            ? "text-success"
                            : "text-warning"
                        )}
                      >
                        <span
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            token.status === "active"
                              ? "bg-success"
                              : "bg-warning"
                          )}
                        />
                        {token.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[11px] text-text-dim font-mono">
                      <span className="flex items-center gap-1">
                        {formatAddress(token.mint_address)}
                        {token.mint_address && (
                          <Copy
                            size={10}
                            className="hover:text-text-muted cursor-pointer"
                            onClick={() => {
                              navigator.clipboard.writeText(token.mint_address!);
                              toast.success("Copied!");
                            }}
                          />
                        )}
                      </span>
                      <span>
                        Supply: {Number(token.supply).toLocaleString()}
                      </span>
                      <span>Decimals: {token.decimals}</span>
                    </div>
                  </div>

                  <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-xs text-text-muted">
                      {timeAgo(token.created_at)}
                    </span>
                    <span className="font-mono text-[10px] text-text-dim">
                      {token.launches?.length || 0} launchpad
                      {(token.launches?.length || 0) !== 1 ? "s" : ""}
                    </span>
                  </div>

                  {token.mint_address && (
                    <a
                      href={`https://explorer.solana.com/address/${token.mint_address}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"}`}
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
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && !error && tokens.length === 0 && (
        <div className="border border-dashed border-border p-12 text-center">
          <Coins size={32} className="text-text-dim mx-auto mb-4" />
          <h3 className="text-base font-semibold text-text-primary mb-2">
            {search ? "No matching tokens" : "No tokens yet"}
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            {search
              ? "Try a different search term."
              : "Deploy your first token to see it here."}
          </p>
          {!search && (
            <Link
              href="/launch"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all"
            >
              <Plus size={16} />
              Create Token
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
