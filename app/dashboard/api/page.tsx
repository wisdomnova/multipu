"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconKey,
  IconCopy,
  IconCheck,
  IconTrash,
  IconPlus,
  IconLock,
  IconArrowUpRight,
  IconBook,
  IconServer,
  IconRocket,
  IconActivity,
  IconCode,
} from "@tabler/icons-react";
import { fadeUp, stagger } from "@/components/motion";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import Link from "next/link";

interface ApiKeyData {
  id: string;
  name: string;
  api_key: string;
  created_at: string;
  revoked: boolean;
}

export default function ApiKeysPage() {
  const { session } = useAuth();
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newKeyName, setNewKeyName] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  // State for newly generated key banner
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  const fetchKeys = async () => {
    try {
      const res = await fetch("/api/developer/api-keys");
      if (!res.ok) throw new Error("Failed to fetch API keys");
      const data = await res.json();
      setKeys(data.keys || []);
    } catch (err) {
      toast.error("Could not fetch API keys");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session.isLoggedIn) {
      fetchKeys();
    }
  }, [session.isLoggedIn]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the key");
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("/api/developer/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate key");
      }

      const data = await res.json();
      setGeneratedKey(data.key.api_key);
      setNewKeyName("");
      toast.success("API key generated successfully!");
      fetchKeys();
    } catch (err: any) {
      toast.error(err.message || "Could not generate API key");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    const confirmed = confirm(
      "Are you sure you want to revoke this API key? This action is permanent and cannot be undone."
    );
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/developer/api-keys?id=${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to revoke key");

      toast.success("API key revoked");
      fetchKeys();
    } catch (err) {
      toast.error("Could not revoke key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    toast.success("API Key copied to clipboard");
    setTimeout(() => setCopiedKey(false), 2000);
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
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              API Keys &amp; Developer Access
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage developer authentication keys for programmatic and autonomous agent access.
            </p>
          </div>
          <a
            href="https://docs.multipu.fun"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 border border-border hover:border-accent/50 hover:bg-accent/5 text-text-primary text-xs font-mono font-semibold transition-all rounded-sm cursor-pointer self-start sm:self-auto"
          >
            <IconBook size={14} className="text-accent" />
            <span>Open Documentation</span>
            <IconArrowUpRight size={13} className="text-text-muted" />
          </a>
        </motion.div>
      </motion.div>

      {/* Generated key warning banner */}
      <AnimatePresence>
        {generatedKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-5 border border-accent/20 bg-accent/5 rounded-none space-y-4"
          >
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-accent/15 rounded-sm flex-shrink-0">
                <IconLock size={15} className="text-accent" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-text-primary">
                  Store Your New API Key Securely
                </h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  For security, we only display this API key once. You cannot recover it later. If you lose it, you will need to revoke it and generate a new key.
                </p>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-border p-3.5 flex items-center justify-between gap-4">
              <span className="font-mono text-xs text-accent break-all select-all font-semibold">
                {generatedKey}
              </span>
              <button
                onClick={() => copyToClipboard(generatedKey)}
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white transition-all text-[10px] font-semibold font-mono cursor-pointer"
              >
                {copiedKey ? <IconCheck size={11} /> : <IconCopy size={11} />}
                {copiedKey ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="text-right">
              <button
                onClick={() => setGeneratedKey(null)}
                className="text-xs text-text-dim hover:text-text-primary font-mono cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API Key management */}
        <div className="lg:col-span-1 space-y-6">
          <div className="border border-border p-5 md:p-6 space-y-6">
            <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
              <IconKey size={14} className="text-text-muted" /> API Key Controls
            </h2>

            {/* Create API Key Form */}
            <form onSubmit={handleCreateKey} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] text-text-dim uppercase tracking-wider font-mono block">
                  New Key Label
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. My Agent Worker"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1 bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none px-3.5 py-2 text-xs text-text-primary placeholder:text-text-dim transition-colors font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="px-3.5 py-2 border border-border hover:border-border-hover text-text-muted hover:text-text-primary text-xs font-mono font-semibold transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isGenerating ? "..." : <><IconPlus size={14} /> Add</>}
                  </button>
                </div>
              </div>
            </form>

            {/* Keys list */}
            <div className="space-y-3">
              <label className="text-[10px] text-text-dim uppercase tracking-wider font-mono block">
                Active Keys ({keys.length})
              </label>

              {loading ? (
                <div className="text-xs text-text-dim font-mono py-2">Loading keys...</div>
              ) : keys.length === 0 ? (
                <div className="text-xs text-text-dim font-mono py-6 border border-dashed border-border text-center">
                  No active keys.
                </div>
              ) : (
                <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                  {keys.map((key) => (
                    <div
                      key={key.id}
                      className="p-3 border border-border hover:bg-elevated transition-colors flex items-center justify-between group"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="text-xs font-semibold text-text-primary truncate">
                          {key.name}
                        </div>
                        <div className="font-mono text-[10px] text-text-dim select-all">
                          {key.api_key}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        className="text-text-muted hover:text-error hover:bg-error/5 p-1 border border-transparent hover:border-error/10 transition-colors ml-2 cursor-pointer"
                        title="Revoke Key"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Developer Documentation Link Card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border p-6 md:p-8 space-y-6 flex flex-col justify-between min-h-[380px] bg-white/[0.005]">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-accent/10 border border-accent/20 rounded-sm">
                    <IconBook size={16} className="text-accent" />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-text-primary">
                    Documentation Portal
                  </span>
                </div>
                <span className="text-[11px] font-mono text-accent bg-accent/10 px-2 py-0.5 border border-accent/20">
                  docs.multipu.fun
                </span>
              </div>

              <div className="space-y-2">
                <h2 className="text-lg md:text-xl font-bold tracking-tight text-text-primary">
                  Official Multipu API &amp; KeeperHub MCP Reference
                </h2>
                <p className="text-xs md:text-sm text-text-secondary leading-relaxed max-w-2xl">
                  Explore complete API endpoint specifications, KeeperHub Model Context Protocol (MCP) schemas for autonomous AI agents, interactive playground sandboxes, and multi-chain launchpad orchestration guides.
                </p>
              </div>

              {/* Feature Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href="https://docs.multipu.fun/#api-reference"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 border border-border hover:border-border-hover bg-white/[0.01] hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                      <IconCode size={14} className="text-accent" />
                      REST API Endpoints
                    </div>
                    <IconArrowUpRight size={13} className="text-text-dim group-hover:text-text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Automate token creation, launchpool dispatches, instant DEX swaps, and balances query.
                  </p>
                </a>

                <a
                  href="https://docs.multipu.fun/#keeperhub-mcp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 border border-border hover:border-border-hover bg-white/[0.01] hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                      <IconServer size={14} className="text-purple-400" />
                      KeeperHub MCP Server
                    </div>
                    <IconArrowUpRight size={13} className="text-text-dim group-hover:text-text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Connect Claude Desktop, Cursor, or custom AI agents directly into on-chain liquidity tools.
                  </p>
                </a>

                <a
                  href="https://docs.multipu.fun/#multi-launch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 border border-border hover:border-border-hover bg-white/[0.01] hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                      <IconRocket size={14} className="text-emerald-400" />
                      Multi-Launchpad Matrix
                    </div>
                    <IconArrowUpRight size={13} className="text-text-dim group-hover:text-text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Architecture for Pump.fun, Meteora DLMM, Bags, Four.meme, and Pons Protocol.
                  </p>
                </a>

                <a
                  href="https://docs.multipu.fun/#olaxbt-signals"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3.5 border border-border hover:border-border-hover bg-white/[0.01] hover:bg-white/[0.02] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-text-primary">
                      <IconActivity size={14} className="text-amber-400" />
                      OlaXBT Alpha Signals
                    </div>
                    <IconArrowUpRight size={13} className="text-text-dim group-hover:text-text-primary transition-colors" />
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    Query real-time momentum alpha, volume spikes, and holder concentration signals.
                  </p>
                </a>
              </div>
            </div>

            {/* Bottom CTA */}
            <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="text-[11px] font-mono text-text-dim">
                Base URL: <code className="text-text-primary font-semibold">https://multipu.fun/api</code>
              </div>
              <a
                href="https://docs.multipu.fun"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-semibold transition-all shadow-sm cursor-pointer"
              >
                <span>Read Full Documentation</span>
                <IconArrowUpRight size={14} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
