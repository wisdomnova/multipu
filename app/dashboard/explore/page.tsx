"use client";

import { useEffect, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { TerminalColumnBoard } from "@/components/explore/terminal-column-board";
import { QuickBuyModal } from "@/components/explore/quick-buy-modal";

export default function ExplorePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeChain, setActiveChain] = useState<string>("all");
  const [error, setError] = useState<string | null>(null);

  // Quick Buy Modal state
  const [modalToken, setModalToken] = useState<any>(null);
  const [modalAmount, setModalAmount] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchExploreData = async (query = "", chain = activeChain, showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setIsRefreshing(true);
    try {
      const qParam = query ? `q=${encodeURIComponent(query)}` : "";
      const chainParam = chain !== "all" ? `chain=${encodeURIComponent(chain)}` : "";
      const limitParam = `limit=45`;
      const params = [qParam, chainParam, limitParam].filter(Boolean).join("&");
      const url = `/api/launches/explore?${params}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to fetch explore directory");
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An error occurred while loading explore directory.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExploreData(search, activeChain);
  }, [activeChain]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    fetchExploreData(val, activeChain, false);
  };

  const handleChainChange = (chain: string) => {
    setActiveChain(chain);
  };

  const handleQuickBuy = (token: any, solAmount: number) => {
    setModalToken(token);
    setModalAmount(solAmount);
    setIsModalOpen(true);
  };

  const chains = [
    { id: "all", label: "All Chains" },
    { id: "solana", label: "Solana" },
    { id: "bsc", label: "BNB Chain" },
    { id: "robinhood", label: "Robinhood" },
  ];

  return (
    <div className="p-6 md:p-10 flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-1 border-b border-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-text-primary">
          Explore Memes
        </h1>
        <p className="text-xs text-text-secondary font-mono mt-1">
          Search and trade active token launches across all supported chains.
        </p>
      </div>

      {/* Toolbar: Chain Selector & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Chain Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => handleChainChange(chain.id)}
              className={cn(
                "px-3 py-1.5 text-xs font-mono rounded transition-colors whitespace-nowrap",
                activeChain === chain.id
                  ? "bg-accent/20 text-accent border border-accent/30"
                  : "bg-white/[0.02] text-text-secondary hover:text-text-primary border border-border"
              )}
            >
              {chain.label}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search
              size={13}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
            />
            <input
              type="text"
              placeholder="Search by token name or symbol..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-white/[0.02] border border-border hover:border-border-hover focus:border-accent focus:outline-none pl-8 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-dim font-mono rounded transition-colors"
            />
          </div>

          <button
            onClick={() => fetchExploreData(search, activeChain, false)}
            disabled={isRefreshing}
            className="p-1.5 border border-border hover:border-border-hover bg-white/[0.02] text-text-muted hover:text-text-primary rounded transition-colors"
            title="Refresh"
          >
            <RefreshCw
              size={13}
              className={cn(isRefreshing && "animate-spin text-accent")}
            />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center text-xs text-text-dim font-mono">
          Loading live token pairs...
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="py-12 text-center text-xs text-error font-mono border border-border p-4 rounded">
          {error}
        </div>
      )}

      {/* Main Terminal Content */}
      {!loading && !error && data && (
        <TerminalColumnBoard
          columns={
            data.terminal_columns || {
              final_stretch: [],
              migrated: [],
              new_pairs: [],
            }
          }
          onQuickBuy={handleQuickBuy}
        />
      )}

      {/* Quick Buy Modal Dialog */}
      <QuickBuyModal
        isOpen={isModalOpen}
        token={modalToken}
        initialAmount={modalAmount}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchExploreData(search, activeChain, false)}
      />
    </div>
  );
}
