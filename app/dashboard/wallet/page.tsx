"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  Copy,
  Check,
  RefreshCw,
  ArrowRight,
  Download,
  Upload,
  Lock,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import { fadeUp, stagger } from "@/components/motion";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function WalletPage() {
  const { session } = useAuth();
  const [walletAddress, setWalletAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Import states
  const [privateKeyInput, setPrivateKeyInput] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Export states
  const [exportedKey, setExportedKey] = useState<string | null>(null);
  const [showExportedKey, setShowExportedKey] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchWalletDetails = async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const res = await fetch("/api/developer/wallet");
      if (!res.ok) throw new Error("Failed to fetch wallet info");
      const data = await res.json();
      setWalletAddress(data.publicKey || "");
      setNetwork(data.network || "");
      setBalance(data.balance || 0);
    } catch (err) {
      toast.error("Could not fetch developer wallet details");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session.isLoggedIn) {
      fetchWalletDetails();
    }
  }, [session.isLoggedIn]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const handleGenerateNew = async () => {
    const confirmed = confirm("Are you sure you want to generate a new wallet? Your current developer wallet will be overwritten. Make sure to export your private key if you have funds in it!");
    if (!confirmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/developer/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to generate wallet");
      }

      toast.success("New developer wallet generated successfully!");
      setExportedKey(null);
      setShowExportedKey(false);
      fetchWalletDetails();
    } catch (err: any) {
      toast.error(err.message || "Failed to generate wallet");
      setLoading(false);
    }
  };

  const handleImportWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!privateKeyInput.trim()) {
      toast.error("Please enter a private key to import");
      return;
    }

    const confirmed = confirm("Importing this private key will overwrite your current developer wallet. Proceed?");
    if (!confirmed) return;

    setIsImporting(true);
    try {
      const res = await fetch("/api/developer/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "import", privateKey: privateKeyInput }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to import wallet");
      }

      toast.success("Wallet private key imported successfully!");
      setPrivateKeyInput("");
      setExportedKey(null);
      setShowExportedKey(false);
      fetchWalletDetails();
    } catch (err: any) {
      toast.error(err.message || "Could not import private key");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportWallet = async () => {
    if (exportedKey) {
      setShowExportedKey(!showExportedKey);
      return;
    }

    setIsExporting(true);
    try {
      const res = await fetch("/api/developer/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "export" }),
      });

      if (!res.ok) throw new Error("Failed to export key");
      const data = await res.json();
      setExportedKey(data.privateKey);
      setShowExportedKey(true);
      toast.success("Private key exported successfully");
    } catch (err) {
      toast.error("Could not export private key");
    } finally {
      setIsExporting(false);
    }
  };

  const netLabel = network === "solana" ? "Solana Devnet" : "BSC EVM Testnet";
  const gasSymbol = network === "solana" ? "SOL" : "BNB";

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
              Developer Wallet
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Generate, fund, and manage your trading wallet to execute programmatic developer swaps.
            </p>
          </div>
        </motion.div>
      </motion.div>

      {loading ? (
        <div className="py-12 text-center text-xs text-text-dim font-mono">
          Loading wallet credentials...
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main details & Deposit panel */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Balance & Address Panel */}
            <div className="border border-border p-6 md:p-8 space-y-6 relative overflow-hidden bg-white/[0.005]">
              <div className="absolute top-0 right-0 w-24 h-24 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-dim uppercase tracking-wider font-mono">
                  Active Developer Wallet ({netLabel})
                </span>
                <button
                  onClick={() => fetchWalletDetails(true)}
                  disabled={refreshing}
                  className="text-text-muted hover:text-text-primary p-1 border border-border/20 rounded transition-colors"
                  title="Refresh Balance"
                >
                  <RefreshCw size={13} className={cn(refreshing && "animate-spin")} />
                </button>
              </div>

              {/* Balance display */}
              <div className="space-y-1">
                <div className="text-3xl font-bold tracking-tight font-mono text-text-primary">
                  {balance.toFixed(4)} <span className="text-sm font-normal text-text-secondary">{gasSymbol}</span>
                </div>
                <div className="text-[11px] text-text-dim font-mono">
                  Wallet Balance
                </div>
              </div>

              {/* Deposit Address Box */}
              <div className="space-y-2">
                <label className="text-[10px] text-text-dim uppercase tracking-wider font-mono block">
                  Deposit Address
                </label>
                <div className="p-3.5 bg-black/40 border border-border flex items-center justify-between gap-4 font-mono text-xs">
                  <span className="text-accent break-all select-all font-semibold">{walletAddress}</span>
                  <button
                    onClick={() => handleCopy(walletAddress, "Address")}
                    className="flex-shrink-0 p-1.5 bg-white/[0.04] hover:bg-white/[0.08] border border-border rounded transition-all text-text-muted hover:text-text-primary"
                  >
                    {copiedText === walletAddress ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
              </div>

              {/* Alerts / Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={handleGenerateNew}
                  className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-mono text-text-muted border border-border hover:border-border-hover transition-colors bg-white/[0.01]"
                >
                  <RefreshCw size={12} /> Regenerate Wallet
                </button>
                
                {network === "solana" && (
                  <a
                    href="https://faucet.solana.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-mono text-accent border border-accent/20 bg-accent/5 hover:bg-accent/10 transition-colors"
                  >
                    Solana Faucet <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Import / Export Panel */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Import Panel */}
              <div className="border border-border p-5 md:p-6 space-y-4">
                <h2 className="text-xs font-semibold text-text-primary flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Upload size={14} className="text-text-muted" /> Import Wallet
                </h2>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Overwrite the current developer wallet by importing your own private key.
                </p>

                <form onSubmit={handleImportWallet} className="space-y-3">
                  <input
                    type="password"
                    placeholder="Enter private key (bs58 or hex)..."
                    value={privateKeyInput}
                    onChange={(e) => setPrivateKeyInput(e.target.value)}
                    className="w-full bg-transparent border border-border hover:border-border-hover focus:border-accent/50 focus:outline-none px-3 py-2 text-xs text-text-primary placeholder:text-text-dim transition-colors font-mono"
                  />
                  <button
                    type="submit"
                    disabled={isImporting}
                    className="w-full py-2 bg-accent hover:bg-accent-hover text-white text-xs font-mono font-semibold transition-colors text-center"
                  >
                    {isImporting ? "Importing..." : "Confirm Import"}
                  </button>
                </form>
              </div>

              {/* Export Panel */}
              <div className="border border-border p-5 md:p-6 space-y-4">
                <h2 className="text-xs font-semibold text-text-primary flex items-center gap-1.5 uppercase tracking-wider font-mono">
                  <Download size={14} className="text-text-muted" /> Export Wallet
                </h2>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Securely view and export the private key of your current developer wallet.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={handleExportWallet}
                    disabled={isExporting}
                    className="w-full py-2 border border-border hover:border-border-hover text-text-muted hover:text-text-primary text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5 bg-white/[0.01]"
                  >
                    {isExporting ? (
                      "Exporting..."
                    ) : showExportedKey ? (
                      <><EyeOff size={13} /> Hide Private Key</>
                    ) : (
                      <><Eye size={13} /> Reveal Private Key</>
                    )}
                  </button>

                  <AnimatePresence>
                    {showExportedKey && exportedKey && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2 overflow-hidden"
                      >
                        <div className="p-3 bg-black/40 border border-border flex items-center justify-between gap-3 text-[10px] font-mono select-all">
                          <span className="text-error break-all font-semibold">
                            {exportedKey}
                          </span>
                          <button
                            onClick={() => handleCopy(exportedKey, "Private Key")}
                            className="flex-shrink-0 p-1 border border-border rounded text-text-muted hover:text-text-primary bg-white/[0.02]"
                          >
                            {copiedText === exportedKey ? <Check size={10} /> : <Copy size={10} />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

          </div>

          {/* Right Column - FAQ */}
          <div className="lg:col-span-1 border border-border p-5 md:p-6 space-y-6 bg-white/[0.002]">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Lock size={14} className="text-accent" /> Security Guide
            </h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-text-primary">
                  Why do I need a deposit wallet?
                </h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Programmatic developer APIs execute swaps and launch tokens on-chain in the background. Because browser extensions (like Phantom) cannot prompt for terminal scripts, a server-managed wallet is required to sign transactions.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-text-primary">
                  How are private keys secured?
                </h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Developer wallet private keys are encrypted on the server before storage. For production security, never keep large funds in your developer/trading wallets.
                </p>
              </div>

              <div className="space-y-1">
                <h3 className="text-xs font-semibold text-text-primary">
                  How to fund Devnet SOL?
                </h3>
                <p className="text-[11px] text-text-secondary leading-relaxed">
                  Copy your deposit address and head to the Solana faucet to claim free Devnet tokens. You can also import keys from your existing devnet testing wallets.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
