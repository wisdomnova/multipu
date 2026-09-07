"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { fadeUp, stagger } from "@/components/motion";
import {
  IconPlus,
  IconCoins,
  IconCopy,
  IconExternalLink,
  IconSearch,
  IconChevronDown,
  IconEdit,
  IconRocket,
  IconTrash,
  IconX,
  IconUpload,
  IconLoader2,
  IconCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useApi } from "@/hooks/use-api";
import { ListSkeleton } from "@/components/skeleton";
import { DataError } from "@/components/error-boundary";
import { toast } from "sonner";
import { useState, useMemo, useCallback } from "react";

interface Token {
  id: string;
  name: string;
  symbol: string;
  mint_address: string | null;
  image_url?: string | null;
  supply: string;
  decimals: number;
  description?: string | null;
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
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "pending">("all");

  // Edit Modal State
  const [editingToken, setEditingToken] = useState<Token | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    symbol: "",
    supply: "",
    decimals: 9,
    description: "",
    imageUrl: "",
  });
  const [editImageFile, setEditImageFile] = useState<File | null>(null);
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const tokens = useMemo(() => {
    let all = data?.tokens || [];
    if (statusFilter !== "all") {
      all = all.filter((t) => t.status === statusFilter);
    }
    if (!search) return all;
    const q = search.toLowerCase();
    return all.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.symbol.toLowerCase().includes(q) ||
        t.mint_address?.toLowerCase().includes(q)
    );
  }, [data, search, statusFilter]);

  const openEditModal = (token: Token) => {
    setEditingToken(token);
    setEditForm({
      name: token.name,
      symbol: token.symbol,
      supply: token.supply,
      decimals: token.decimals || 9,
      description: token.description || "",
      imageUrl: token.image_url || "",
    });
    setEditImageFile(null);
    setEditImagePreview(token.image_url || null);
  };

  const handleImageSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB");
        return;
      }

      setEditImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setEditImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    },
    []
  );

  const handleSaveEdit = async () => {
    if (!editingToken) return;
    setIsSaving(true);
    try {
      let finalImageUrl = editForm.imageUrl || null;

      if (editImageFile) {
        const formData = new FormData();
        formData.append("file", editImageFile);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          finalImageUrl = url;
        } else {
          toast.error("Image upload failed, preserving previous image.");
        }
      }

      const res = await fetch("/api/tokens", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenId: editingToken.id,
          name: editForm.name,
          symbol: editForm.symbol.toUpperCase(),
          supply: editForm.supply,
          decimals: editForm.decimals,
          description: editForm.description,
          imageUrl: finalImageUrl,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update token");
      }

      toast.success("Draft token updated successfully!");
      setEditingToken(null);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDraft = async (tokenId: string) => {
    if (!confirm("Are you sure you want to delete this draft token?")) return;
    setIsDeleting(tokenId);
    try {
      const res = await fetch(`/api/tokens?id=${tokenId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete token");
      }
      toast.success("Draft token deleted");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(null);
    }
  };

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
              All your deployed and draft tokens in one place.
            </p>
          </div>
          <Link
            href="/launch"
            className="hidden md:inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.3)]"
          >
            <IconPlus size={16} />
            Create Token
          </Link>
        </motion.div>
      </motion.div>

      {/* Search & Filter bar */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
      >
        <div className="flex-1 relative">
          <IconSearch
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-dim"
          />
          <input
            type="text"
            placeholder="Search tokens by name, symbol, or mint address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-dim transition-colors font-mono"
          />
        </div>
        <div className="flex items-center gap-2">
          {(["all", "active", "pending"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={cn(
                "px-3.5 py-2 text-xs font-mono uppercase tracking-wider transition-colors border",
                statusFilter === st
                  ? "bg-accent/10 border-accent/40 text-accent font-semibold"
                  : "border-border text-text-dim hover:text-text-secondary hover:border-border-hover"
              )}
            >
              {st}
            </button>
          ))}
        </div>
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
          {tokens.map((token) => {
            const isPending = token.status === "pending";

            return (
              <motion.div
                key={token.id}
                variants={fadeUp}
                className={cn(
                  "group border transition-all duration-200",
                  isPending
                    ? "border-warning/30 bg-warning/[0.02] hover:bg-warning/[0.04]"
                    : "border-border hover:bg-elevated"
                )}
              >
                <div className="p-5 md:p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="relative w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {token.image_url ? (
                        <Image
                          src={token.image_url}
                          alt={token.name}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      ) : (
                        <IconCoins size={20} className="text-accent" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-base font-semibold text-text-primary">
                          {token.name}
                        </span>
                        <span className="font-mono text-xs text-text-muted px-1.5 py-0.5 border border-border">
                          ${token.symbol}
                        </span>
                        <span
                          className={cn(
                            "flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded-full border",
                            isPending
                              ? "text-warning border-warning/30 bg-warning/10"
                              : "text-success border-success/30 bg-success/10"
                          )}
                        >
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              isPending ? "bg-warning animate-pulse" : "bg-success"
                            )}
                          />
                          {isPending ? "Draft / Pending" : "Active"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-text-dim font-mono flex-wrap">
                        <span className="flex items-center gap-1">
                          {isPending ? (
                            <span className="text-text-muted italic">Un-minted</span>
                          ) : (
                            <>
                              {formatAddress(token.mint_address)}
                              {token.mint_address && (
                                <IconCopy
                                  size={10}
                                  className="hover:text-text-muted cursor-pointer"
                                  onClick={() => {
                                    navigator.clipboard.writeText(token.mint_address!);
                                    toast.success("Copied!");
                                  }}
                                />
                              )}
                            </>
                          )}
                        </span>
                        <span>
                          Supply: {Number(token.supply).toLocaleString()}
                        </span>
                        <span>Decimals: {token.decimals}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end mt-3 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border">
                      {isPending ? (
                        <>
                          <button
                            onClick={() => openEditModal(token)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium border border-border hover:border-accent/50 hover:text-accent rounded-sm transition-colors"
                          >
                            <IconEdit size={13} />
                            Edit Draft
                          </button>
                          <Link
                            href={`/launch?resume=${token.id}`}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-semibold bg-accent hover:bg-accent-hover text-white rounded-sm transition-colors"
                          >
                            <IconRocket size={13} />
                            Launch
                          </Link>
                          <button
                            onClick={() => handleDeleteDraft(token.id)}
                            disabled={isDeleting === token.id}
                            className="p-1.5 text-text-dim hover:text-error transition-colors"
                            title="Delete draft"
                          >
                            <IconTrash size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="hidden md:flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-xs text-text-muted">
                            {timeAgo(token.created_at)}
                          </span>
                          <span className="font-mono text-[10px] text-text-dim">
                            {token.launches?.length || 0} launchpad
                            {(token.launches?.length || 0) !== 1 ? "s" : ""}
                          </span>
                        </div>
                      )}

                      {!isPending && token.mint_address && (
                        <a
                          href={`https://explorer.solana.com/address/${token.mint_address}?cluster=${process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet"}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <IconExternalLink
                            size={14}
                            className="text-text-dim hover:text-text-muted cursor-pointer flex-shrink-0"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && !error && tokens.length === 0 && (
        <div className="border border-dashed border-border p-12 text-center">
          <IconCoins size={32} className="text-text-dim mx-auto mb-4" />
          <h3 className="text-base font-semibold text-text-primary mb-2">
            {search ? "No matching tokens" : "No tokens yet"}
          </h3>
          <p className="text-sm text-text-secondary mb-6">
            {search
              ? "Try a different search term or filter."
              : "Deploy your first token to see it here."}
          </p>
          {!search && (
            <Link
              href="/launch"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all"
            >
              <IconPlus size={16} />
              Create Token
            </Link>
          )}
        </div>
      )}

      {/* Edit Pending Token Modal */}
      <AnimatePresence>
        {editingToken && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingToken(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-lg bg-[#0c0d12] border border-white/10 p-6 md:p-8 rounded-xl shadow-2xl z-10 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Edit Draft Token
                  </h3>
                  <p className="text-xs text-text-muted mt-0.5">
                    Update token parameters before broadcasting on-chain.
                  </p>
                </div>
                <button
                  onClick={() => setEditingToken(null)}
                  className="p-1 text-text-muted hover:text-white transition-colors"
                >
                  <IconX size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-mono text-text-muted mb-2">
                    Token Logo
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="relative w-16 h-16 border border-dashed border-white/20 hover:border-accent/60 bg-white/[0.02] rounded-lg flex flex-col items-center justify-center cursor-pointer overflow-hidden group">
                      {editImagePreview ? (
                        <Image
                          src={editImagePreview}
                          alt="Preview"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <IconUpload size={18} className="text-text-muted group-hover:text-white transition-colors" />
                      )}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={handleImageSelect}
                      />
                    </label>
                    <span className="text-[11px] text-text-muted">
                      Click box to upload or replace logo (Max 5MB PNG/JPG/WEBP).
                    </span>
                  </div>
                </div>

                {/* Name & Symbol */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-text-muted mb-1.5">
                      Token Name
                    </label>
                    <input
                      type="text"
                      maxLength={32}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-accent/60 focus:outline-none px-3.5 py-2 text-sm text-white font-medium transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-text-muted mb-1.5">
                      Symbol
                    </label>
                    <input
                      type="text"
                      maxLength={10}
                      value={editForm.symbol}
                      onChange={(e) => setEditForm({ ...editForm, symbol: e.target.value.toUpperCase() })}
                      className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-accent/60 focus:outline-none px-3.5 py-2 text-sm text-white font-mono transition-colors uppercase"
                    />
                  </div>
                </div>

                {/* Supply & Decimals */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-mono text-text-muted mb-1.5">
                      Total Supply
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={editForm.supply}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, "");
                        setEditForm({ ...editForm, supply: val });
                      }}
                      className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-accent/60 focus:outline-none px-3.5 py-2 text-sm text-white font-mono transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-text-muted mb-1.5">
                      Decimals
                    </label>
                    <select
                      value={editForm.decimals}
                      onChange={(e) => setEditForm({ ...editForm, decimals: Number(e.target.value) })}
                      className="w-full bg-[#12131a] border border-white/10 hover:border-white/20 focus:border-accent/60 focus:outline-none px-3.5 py-2 text-sm text-white transition-colors"
                    >
                      <option value={6}>6 Decimals</option>
                      <option value={8}>8 Decimals</option>
                      <option value={9}>9 Decimals</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-mono text-text-muted mb-1.5">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 hover:border-white/20 focus:border-accent/60 focus:outline-none px-3.5 py-2 text-sm text-white transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setEditingToken(null)}
                  className="px-4 py-2 text-xs font-mono text-text-muted hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSaving || !editForm.name || !editForm.symbol || !editForm.supply}
                  onClick={handleSaveEdit}
                  className={cn(
                    "inline-flex items-center gap-2 px-5 py-2.5 text-xs font-mono font-semibold rounded-full transition-all",
                    isSaving
                      ? "bg-accent/50 text-white/50 cursor-not-allowed"
                      : "bg-accent hover:bg-accent-hover text-white shadow-lg shadow-accent/20"
                  )}
                >
                  {isSaving ? (
                    <>
                      <IconLoader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <IconCheck size={14} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
