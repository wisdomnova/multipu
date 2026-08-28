"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Key,
  Copy,
  Check,
  Trash2,
  Plus,
  Terminal,
  Lock,
  Code2,
  Info,
} from "lucide-react";
import { fadeUp, stagger } from "@/components/motion";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  // Doc tab state
  const [activeDocTab, setActiveDocTab] = useState<"auth" | "tokens" | "launches" | "trade">("auth");
  const [activeCodeLang, setActiveCodeLang] = useState<"curl" | "node">("curl");

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
    const confirmed = confirm("Are you sure you want to revoke this API key? This action is permanent and cannot be undone.");
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

  const docSnippets = {
    auth: {
      title: "Authentication",
      description: "Authenticate your developer API calls by passing the API key in the `x-api-key` header.",
      curl: `curl -X GET https://multipu.fun/api/dashboard \\
  -H "x-api-key: mp_live_abc123xyz"`,
      node: `fetch("https://multipu.fun/api/dashboard", {
  method: "GET",
  headers: {
    "x-api-key": "mp_live_abc123xyz",
    "Accept": "application/json"
  }
})
.then(res => res.json())
.then(data => console.log(data));`,
    },
    tokens: {
      title: "Create Token",
      description: "Initialize and save a pending token record in the database before minting it on-chain.",
      curl: `curl -X POST https://multipu.fun/api/tokens \\
  -H "x-api-key: mp_live_abc123xyz" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "Super Meme Coin",
    "symbol": "SUPER",
    "supply": "1000000000",
    "decimals": 9,
    "description": "The next super viral token",
    "imageUrl": "https://arweave.net/logo.png"
  }'`,
      node: `fetch("https://multipu.fun/api/tokens", {
  method: "POST",
  headers: {
    "x-api-key": "mp_live_abc123xyz",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "Super Meme Coin",
    symbol: "SUPER",
    supply: "1000000000",
    decimals: 9,
    description: "The next super viral token",
    imageUrl: "https://arweave.net/logo.png"
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
    },
    launches: {
      title: "Orchestrate Launches",
      description: "Create and confirm launches on Meteora, Bags, Pump.fun, Four.meme or Sherwood.",
      curl: `# 1. Create a pending launch record
curl -X POST https://multipu.fun/api/launches \\
  -H "x-api-key: mp_live_abc123xyz" \\
  -H "Content-Type: application/json" \\
  -d '{
    "tokenId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "launchpad": "pumpfun",
    "initialLiquidity": 1.0
  }'

# 2. Confirm the launch on-chain (after transaction broadcast)
curl -X PATCH https://multipu.fun/api/launches \\
  -H "x-api-key: mp_live_abc123xyz" \\
  -H "Content-Type: application/json" \\
  -d '{
    "launchId": "5da85f64-5717-4562-b3fc-2c963f66afa7",
    "poolAddress": "8a3Pz...xyz",
    "launchTx": "5JzD...xyz",
    "initialLiquidity": 1.0
  }'`,
      node: `// 1. Create a pending launch record
const resCreate = await fetch("https://multipu.fun/api/launches", {
  method: "POST",
  headers: {
    "x-api-key": "mp_live_abc123xyz",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    tokenId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    launchpad: "pumpfun",
    initialLiquidity: 1.0
  })
});
const { launch } = await resCreate.json();

// 2. Confirm launch transaction (after executing transaction via wallet or server-side wallet)
const resConfirm = await fetch("https://multipu.fun/api/launches", {
  method: "PATCH",
  headers: {
    "x-api-key": "mp_live_abc123xyz",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    launchId: launch.id,
    poolAddress: "8a3Pz...xyz",
    launchTx: "5JzD...xyz"
  })
});
console.log(await resConfirm.json());`,
    },
    trade: {
      title: "Trade & Swap",
      description: "Log token swaps directly into the trade history database and compute creator fees.",
      curl: `curl -X POST https://multipu.fun/api/trade/swap \\
  -H "x-api-key: mp_live_abc123xyz" \\
  -H "Content-Type: application/json" \\
  -d '{
    "launchId": "5da85f64-5717-4562-b3fc-2c963f66afa7",
    "type": "buy",
    "amountPay": 1.5,
    "amountReceive": 1500000,
    "txSignature": "mock-tx-sig-abc123xyz"
  }'`,
      node: `fetch("https://multipu.fun/api/trade/swap", {
  method: "POST",
  headers: {
    "x-api-key": "mp_live_abc123xyz",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    launchId: "5da85f64-5717-4562-b3fc-2c963f66afa7",
    type: "buy",
    amountPay: 1.5,
    amountReceive: 1500000,
    txSignature: "mock-tx-sig-abc123xyz"
  })
})
.then(res => res.json())
.then(data => console.log(data));`,
    },
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
              API Keys
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Manage developer keys and read endpoints code documentation.
            </p>
          </div>
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
                <Lock size={15} className="text-accent" />
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
                className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white transition-all text-[10px] font-semibold font-mono"
              >
                {copiedKey ? <Check size={11} /> : <Copy size={11} />}
                {copiedKey ? "Copied" : "Copy"}
              </button>
            </div>

            <div className="text-right">
              <button
                onClick={() => setGeneratedKey(null)}
                className="text-xs text-text-dim hover:text-text-primary font-mono"
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
              <Key size={14} className="text-text-muted" /> API Key Controls
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
                    placeholder="e.g. My Arbitrage Bot"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="flex-1 bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none px-3.5 py-2 text-xs text-text-primary placeholder:text-text-dim transition-colors font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="px-3.5 py-2 border border-border hover:border-border-hover text-text-muted hover:text-text-primary text-xs font-mono font-semibold transition-colors flex items-center gap-1"
                  >
                    {isGenerating ? "..." : <><Plus size={14} /> Add</>}
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
                        className="text-text-muted hover:text-error hover:bg-error/5 p-1 border border-transparent hover:border-error/10 transition-colors ml-2"
                        title="Revoke Key"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Interactive API Docs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-border flex flex-col min-h-[480px]">
            
            {/* Doc Header Tabs */}
            <div className="border-b border-border bg-white/[0.005] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <Terminal size={14} className="text-text-muted" />
                <span className="text-xs font-mono font-semibold text-text-primary">
                  DEVELOPER API REFERENCE
                </span>
              </div>
              
              <div className="flex gap-1 bg-white/[0.04] p-0.5 rounded">
                {(["curl", "node"] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setActiveCodeLang(lang)}
                    className={cn(
                      "px-2.5 py-1 text-[10px] font-mono rounded transition-colors",
                      activeCodeLang === lang
                        ? "bg-white/[0.06] text-white"
                        : "text-text-dim hover:text-text-secondary"
                    )}
                  >
                    {lang === "curl" ? "cURL" : "NodeJS"}
                  </button>
                ))}
              </div>
            </div>

            {/* Doc Layout */}
            <div className="flex flex-col md:flex-row flex-1">
              
              {/* Sidebar Tabs */}
              <div className="w-full md:w-48 border-r border-border bg-white/[0.002] py-2">
                {(["auth", "tokens", "launches", "trade"] as const).map((tab) => {
                  const isActive = activeDocTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveDocTab(tab)}
                      className={cn(
                        "w-full text-left px-5 py-3 text-xs font-medium border-l-2 transition-all font-mono",
                        isActive
                          ? "border-accent bg-accent/5 text-accent font-semibold"
                          : "border-transparent text-text-secondary hover:text-text-primary hover:bg-white/[0.01]"
                      )}
                    >
                      {docSnippets[tab].title}
                    </button>
                  );
                })}
              </div>

              {/* Documentation Snippet Panel */}
              <div className="flex-1 p-6 space-y-4 min-w-0">
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {docSnippets[activeDocTab].title} Endpoint
                  </h3>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {docSnippets[activeDocTab].description}
                  </p>
                </div>

                <div className="flex items-center gap-2 p-3 bg-white/[0.01] border border-border text-[10px] text-text-dim">
                  <Info size={12} className="text-accent flex-shrink-0" />
                  <span>
                    Note: Requests are automatically isolated by your wallet's current environment scope (e.g. devnet/testnet).
                  </span>
                </div>

                {/* Code Window */}
                <div className="relative bg-black/40 border border-border font-mono text-[11px] overflow-x-auto select-all">
                  <pre className="p-4 text-text-primary leading-relaxed whitespace-pre overflow-x-auto">
                    <code>
                      {activeCodeLang === "curl"
                        ? docSnippets[activeDocTab].curl
                        : docSnippets[activeDocTab].node}
                    </code>
                  </pre>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        activeCodeLang === "curl"
                          ? docSnippets[activeDocTab].curl
                          : docSnippets[activeDocTab].node
                      )
                    }
                    className="absolute top-3 right-3 text-text-muted hover:text-text-primary p-1.5 bg-white/[0.04] border border-border rounded transition-all"
                    title="Copy Snippet"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              </div>

            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
