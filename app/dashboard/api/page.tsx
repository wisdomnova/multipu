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
} from "@tabler/icons-react";
import { fadeUp, stagger } from "@/components/motion";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

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
        className="mb-8"
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

      {/* Full-Width API Key Controls */}
      <div className="w-full space-y-6">
        <div className="border border-border p-6 md:p-8 space-y-6 bg-white/[0.005]">
          <h2 className="text-sm font-semibold text-text-primary flex items-center gap-2">
            <IconKey size={16} className="text-accent" /> API Key Controls
          </h2>

          {/* Create API Key Form */}
          <form onSubmit={handleCreateKey} className="space-y-4 max-w-xl">
            <div className="space-y-2">
              <label className="text-[10px] text-text-dim uppercase tracking-wider font-mono block">
                New Key Label
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Trading Bot / Agent Worker"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="flex-1 bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none px-4 py-2.5 text-xs text-text-primary placeholder:text-text-dim transition-colors font-mono"
                />
                <button
                  type="submit"
                  disabled={isGenerating}
                  className="px-5 py-2.5 border border-border hover:border-border-hover bg-white/[0.02] hover:bg-white/[0.05] text-text-primary text-xs font-mono font-semibold transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGenerating ? "Generating..." : <><IconPlus size={14} /> Add Key</>}
                </button>
              </div>
            </div>
          </form>

          {/* Keys list */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <label className="text-[10px] text-text-dim uppercase tracking-wider font-mono block">
                Active Keys ({keys.length})
              </label>
              <span className="text-[11px] font-mono text-text-muted">
                Authenticated non-custodial keys
              </span>
            </div>

            {loading ? (
              <div className="text-xs text-text-dim font-mono py-4">Loading keys...</div>
            ) : keys.length === 0 ? (
              <div className="text-xs text-text-dim font-mono py-10 border border-dashed border-border text-center">
                No active keys. Create a key above to authenticate your API and MCP requests.
              </div>
            ) : (
              <div className="space-y-2.5">
                {keys.map((key) => (
                  <div
                    key={key.id}
                    className="p-4 border border-border hover:bg-elevated/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="text-xs font-semibold text-text-primary">
                        {key.name}
                      </div>
                      <div className="font-mono text-xs text-text-dim select-all break-all">
                        {key.api_key}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
                      <button
                        onClick={() => copyToClipboard(key.api_key)}
                        className="px-2.5 py-1.5 text-xs text-text-dim hover:text-text-primary bg-white/[0.02] hover:bg-white/[0.06] border border-border rounded-sm transition-colors flex items-center gap-1 font-mono cursor-pointer"
                        title="Copy Key"
                      >
                        <IconCopy size={12} />
                        <span>Copy</span>
                      </button>
                      <button
                        onClick={() => handleRevokeKey(key.id)}
                        className="p-1.5 text-text-muted hover:text-error hover:bg-error/5 border border-transparent hover:border-error/20 rounded-sm transition-colors cursor-pointer"
                        title="Revoke Key"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
