"use client";

import { useEffect, useState } from "react";
import { IconSearch, IconRefresh } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { TerminalColumnBoard } from "@/components/explore/terminal-column-board";
import { QuickBuyModal } from "@/components/explore/quick-buy-modal";

export default function ExplorePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeChain, setActiveChain] = useState<string>("all");
  const [page, setPage] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);

  // Quick Buy Modal state
  const [modalToken, setModalToken] = useState<any>(null);
  const [modalAmount, setModalAmount] = useState<number>(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchExploreData = async (query = "", chain = activeChain, pageNum = page, showSpinner = true) => {
    if (showSpinner) setLoading(true);
    setIsRefreshing(true);
    try {
      const qParam = query ? `q=${encodeURIComponent(query)}` : "";
      const chainParam = chain !== "all" ? `chain=${encodeURIComponent(chain)}` : "";
      const pageParam = `page=${pageNum}`;
      const params = [qParam, chainParam, pageParam].filter(Boolean).join("&");
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
    fetchExploreData(search, activeChain, page);
  }, [activeChain, page]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    fetchExploreData(val, activeChain, 1, false);
  };

  const handleChainChange = (chain: string) => {
    setActiveChain(chain);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto flex flex-col gap-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white font-sans">
          Trade &amp; Explore
        </h1>
        <p className="mt-1 text-sm text-neutral-400 font-sans">
          Real-time token discovery, bonding curves, and decentralized execution across Solana, BNB, and Robinhood.
        </p>
      </div>

      {/* Toolbar: Chain Selector & Search */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Chain Selector */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {chains.map((chain) => (
            <button
              key={chain.id}
              onClick={() => handleChainChange(chain.id)}
              className={cn(
                "px-4 py-2 text-xs font-sans rounded-full transition-colors whitespace-nowrap cursor-pointer",
                activeChain === chain.id
                  ? "bg-white text-black font-semibold"
                  : "bg-[#181818] text-neutral-400 hover:text-white border border-white/[0.06]"
              )}
            >
              {chain.label}
            </button>
          ))}
        </div>

        {/* Search & Refresh */}
        <div className="flex items-center gap-2.5 w-full md:w-88">
          <div className="relative flex-1">
            <IconSearch
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500"
            />
            <input
              type="text"
              placeholder="Search by name or symbol..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-[#181818] border border-white/[0.08] focus:border-white/30 rounded-full pl-10 pr-4 py-2 text-xs text-white placeholder:text-neutral-500 font-mono transition-colors focus:outline-none"
            />
          </div>

          <button
            onClick={() => fetchExploreData(search, activeChain, page, false)}
            disabled={isRefreshing}
            className="p-2.5 bg-[#181818] border border-white/[0.06] hover:bg-white/[0.08] text-neutral-400 hover:text-white rounded-full transition-colors cursor-pointer flex-shrink-0"
            title="Refresh"
          >
            <IconRefresh
              size={15}
              className={cn(isRefreshing && "animate-spin text-white")}
            />
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-24 text-center text-xs text-neutral-500 font-mono bg-[#181818] rounded-2xl border border-white/[0.04]">
          Loading live trading pairs...
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="py-12 text-center text-xs text-red-400 font-sans bg-[#181818] border border-red-500/20 p-6 rounded-2xl">
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
          columnCounts={data.column_counts}
          pagination={data.pagination}
          onPageChange={handlePageChange}
          onQuickBuy={handleQuickBuy}
        />
      )}

      {/* Quick Buy Modal Dialog */}
      <QuickBuyModal
        isOpen={isModalOpen}
        token={modalToken}
        initialAmount={modalAmount}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => fetchExploreData(search, activeChain, page, false)}
      />
    </div>
  );
}
