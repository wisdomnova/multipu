"use client";

import { useEffect, useState } from "react";
import {
  IconWallet,
  IconSend,
  IconAlertCircle,
  IconCircleCheck,
  IconClock,
  IconShieldCheck,
  IconExternalLink,
  IconRefresh,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface ChainTreasury {
  configured: boolean;
  address: string | null;
  balanceSol?: number;
  balanceBnb?: number;
  provider: "privy" | "keypair" | "none";
}

interface TransferRecord {
  id: string;
  chain: "solana" | "bsc";
  from_wallet: string;
  to_wallet: string;
  amount_native: number;
  signature: string;
  fee_type: string;
  status: "pending" | "confirmed" | "failed";
  created_at: string;
  error_message?: string | null;
}

interface TreasuryData {
  solana: ChainTreasury;
  bsc: ChainTreasury;
  transfers: TransferRecord[];
}

export default function AdminTreasuryPage() {
  const [data, setData] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChain, setSelectedChain] = useState<"solana" | "bsc">("solana");
  const [withdrawalForm, setWithdrawalForm] = useState({
    recipient: "",
    amount: "",
  });
  const [status, setStatus] = useState<"idle" | "withdrawing" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const loadTreasuryData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/treasury");
      if (res.ok) {
        const json = await res.json();
        setData(json.treasury);
      }
    } catch (err) {
      console.error("Failed to load treasury data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTreasuryData();
  }, []);

  const handleWithdraw = async () => {
    if (!withdrawalForm.recipient.trim() || !withdrawalForm.amount.trim()) {
      setStatus("error");
      setStatusMessage("Please enter a recipient address and amount");
      return;
    }

    const amountNum = parseFloat(withdrawalForm.amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setStatus("error");
      setStatusMessage("Please enter a valid amount greater than 0");
      return;
    }

    setStatus("withdrawing");
    setStatusMessage("Submitting transfer via Privy Server Wallet...");

    try {
      const res = await fetch("/api/admin/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "withdraw",
          chain: selectedChain,
          recipientAddress: withdrawalForm.recipient.trim(),
          amountNative: amountNum,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setStatus("success");
        const sigShort = result.signature ? `${result.signature.slice(0, 16)}...` : "";
        setStatusMessage(`Transfer confirmed! Signature: ${sigShort}`);
        setWithdrawalForm({ recipient: "", amount: "" });
        loadTreasuryData();
        setTimeout(() => {
          setStatus("idle");
          setStatusMessage("");
        }, 6000);
      } else {
        setStatus("error");
        setStatusMessage(result.error || "Withdrawal failed");
      }
    } catch (err: any) {
      setStatus("error");
      setStatusMessage(err.message || "Network error. Please try again.");
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  const getStatusIcon = (st: string) => {
    if (st === "confirmed") return <IconCircleCheck size={14} className="text-emerald-400" />;
    if (st === "failed") return <IconAlertCircle size={14} className="text-red-400" />;
    return <IconClock size={14} className="text-amber-400" />;
  };

  const isAnyConfigured = data?.solana?.configured || data?.bsc?.configured;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              <IconWallet size={22} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Treasury Management</h1>
              <p className="text-xs sm:text-sm text-neutral-400">
                Multi-chain protocol fees & secure withdrawals powered by Privy Server Wallets
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={loadTreasuryData}
          disabled={loading}
          className="px-3 py-2 text-xs font-mono text-neutral-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <IconRefresh size={14} className={cn(loading && "animate-spin")} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Status Alert Banner */}
      {status !== "idle" && (
        <div
          className={cn(
            "flex items-center gap-2.5 px-4 py-3 rounded-2xl border transition-all",
            status === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : status === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-300"
              : "bg-accent/10 border-accent/30 text-neutral-200"
          )}
        >
          {status === "success" ? (
            <IconCircleCheck size={18} className="text-emerald-400 shrink-0" />
          ) : status === "error" ? (
            <IconAlertCircle size={18} className="text-red-400 shrink-0" />
          ) : (
            <IconClock size={18} className="text-accent shrink-0 animate-spin" />
          )}
          <p className="text-xs font-mono">{statusMessage}</p>
        </div>
      )}

      {loading && !data ? (
        <div className="h-72 bg-white/[0.02] border border-white/[0.05] rounded-3xl animate-pulse" />
      ) : !isAnyConfigured ? (
        <div className="p-8 rounded-3xl border border-red-500/30 bg-red-500/5">
          <div className="flex items-start gap-4">
            <IconAlertCircle size={24} className="text-red-400 mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold text-white mb-2 text-base">Treasury Not Configured</h3>
              <p className="text-sm text-neutral-400 mb-4 leading-relaxed">
                Add your Privy App ID, App Secret, and Server Wallet IDs into <code className="text-xs text-accent">.env</code>.
              </p>
              <div className="text-xs font-mono text-neutral-300 bg-black/60 p-4 rounded-2xl border border-white/10 space-y-1">
                <div>PRIVY_APP_ID=...</div>
                <div>PRIVY_APP_SECRET=...</div>
                <div>PRIVY_SOLANA_WALLET_ID=...</div>
                <div>PRIVY_BSC_WALLET_ID=...</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Dual Chain Treasury Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Solana Card */}
            <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#070709] relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.8)]" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">Solana Treasury</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent font-semibold">
                  {data?.solana?.provider === "privy" ? "Privy Server Wallet" : "Keypair"}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Live Balance</div>
                  <div className="text-3xl font-bold font-mono text-white tracking-tight mt-0.5">
                    {data?.solana?.balanceSol?.toFixed(4) ?? "0.0000"}{" "}
                    <span className="text-sm text-neutral-400 font-normal">SOL</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Public Address</div>
                  <div className="text-xs font-mono text-neutral-300 truncate mt-0.5 flex items-center gap-1.5">
                    <span>{data?.solana?.address || "Not set"}</span>
                    {data?.solana?.address && (
                      <a
                        href={`https://solscan.io/account/${data.solana.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-500 hover:text-white transition-colors"
                        title="View on Solscan"
                      >
                        <IconExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. BSC Card */}
            <div className="p-6 rounded-3xl border border-white/[0.08] bg-[#070709] relative overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">BNB Chain Treasury</span>
                </div>
                <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 font-semibold">
                  {data?.bsc?.provider === "privy" ? "Privy Server Wallet" : "Unconfigured"}
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Live Balance</div>
                  <div className="text-3xl font-bold font-mono text-white tracking-tight mt-0.5">
                    {data?.bsc?.balanceBnb?.toFixed(4) ?? "0.0000"}{" "}
                    <span className="text-sm text-neutral-400 font-normal">BNB</span>
                  </div>
                </div>

                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">Public Address</div>
                  <div className="text-xs font-mono text-neutral-300 truncate mt-0.5 flex items-center gap-1.5">
                    <span>{data?.bsc?.address || "Not set"}</span>
                    {data?.bsc?.address && (
                      <a
                        href={`https://bscscan.com/address/${data.bsc.address}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-500 hover:text-white transition-colors"
                        title="View on BscScan"
                      >
                        <IconExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Withdrawal Form with Chain Selection */}
          <div className="p-6 sm:p-8 rounded-3xl border border-white/[0.08] bg-[#070709]">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <IconSend size={18} className="text-accent" />
                <h3 className="text-base font-semibold text-white">Execute Treasury Withdrawal</h3>
              </div>

              {/* Chain Selection Tabs */}
              <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.03] border border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setSelectedChain("solana")}
                  className={cn(
                    "px-3 py-1 text-xs font-mono rounded-full transition-all cursor-pointer",
                    selectedChain === "solana"
                      ? "bg-purple-600 text-white font-semibold"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  Solana (SOL)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedChain("bsc")}
                  className={cn(
                    "px-3 py-1 text-xs font-mono rounded-full transition-all cursor-pointer",
                    selectedChain === "bsc"
                      ? "bg-amber-600 text-white font-semibold"
                      : "text-neutral-400 hover:text-white"
                  )}
                >
                  BNB Chain (BNB)
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Destination Address ({selectedChain === "solana" ? "Solana Base58" : "0x EVM Address"})
                </label>
                <input
                  type="text"
                  placeholder={
                    selectedChain === "solana"
                      ? "e.g. 7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
                      : "e.g. 0x71C...8976F"
                  }
                  value={withdrawalForm.recipient}
                  onChange={(e) =>
                    setWithdrawalForm((prev) => ({
                      ...prev,
                      recipient: e.target.value,
                    }))
                  }
                  disabled={status === "withdrawing"}
                  className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-white text-sm font-mono placeholder:text-neutral-600 focus:outline-none focus:border-accent/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-400 mb-2">
                  Amount ({selectedChain === "solana" ? "SOL" : "BNB"})
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  min="0.0001"
                  value={withdrawalForm.amount}
                  onChange={(e) =>
                    setWithdrawalForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  disabled={status === "withdrawing"}
                  className="w-full px-4 py-3 bg-black/40 border border-white/[0.08] rounded-xl text-white text-sm font-mono placeholder:text-neutral-600 focus:outline-none focus:border-accent/60 transition-colors"
                />
              </div>

              <button
                onClick={handleWithdraw}
                disabled={status === "withdrawing"}
                className="w-full py-3.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-lg active:scale-[0.99] flex items-center justify-center gap-2"
              >
                {status === "withdrawing" ? (
                  <>
                    <IconClock size={16} className="animate-spin" />
                    <span>Signing via Privy Server Wallet...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm & Withdraw {selectedChain.toUpperCase()}</span>
                    <span>→</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Transfer History */}
          <div className="rounded-3xl border border-white/[0.08] bg-[#070709] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Recent Transfers</h3>
              <span className="text-xs font-mono text-neutral-500">
                {data?.transfers?.length || 0} record{data?.transfers?.length === 1 ? "" : "s"}
              </span>
            </div>

            {!data?.transfers || data.transfers.length === 0 ? (
              <div className="p-8 text-center text-neutral-500 text-xs font-mono">
                No transfer records recorded yet
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04] max-h-96 overflow-y-auto font-mono">
                {data.transfers.map((tx) => (
                  <div key={tx.id} className="px-6 py-4 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(tx.status)}
                        <span className="text-xs font-semibold text-white uppercase">
                          {tx.chain || "solana"}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.05] text-neutral-300">
                          {tx.fee_type === "manual_withdrawal" ? "Withdrawal" : tx.fee_type}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-white">
                        {tx.amount_native} {tx.chain === "bsc" ? "BNB" : "SOL"}
                      </span>
                    </div>

                    <div className="text-[11px] text-neutral-500 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="truncate">
                        To: <span className="text-neutral-300">{tx.to_wallet}</span>
                      </div>
                      <div className="shrink-0 flex items-center gap-2">
                        <span>{formatTime(tx.created_at)}</span>
                        {tx.signature && (
                          <a
                            href={
                              tx.chain === "bsc"
                                ? `https://bscscan.com/tx/${tx.signature}`
                                : `https://solscan.io/tx/${tx.signature}`
                            }
                            target="_blank"
                            rel="noreferrer"
                            className="text-accent hover:underline inline-flex items-center gap-1"
                          >
                            <span>Receipt</span>
                            <IconExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Summary Badge */}
          <div className="p-5 rounded-2xl bg-accent/5 border border-accent/20 flex items-start gap-3.5">
            <IconShieldCheck size={20} className="text-accent shrink-0 mt-0.5" />
            <div className="text-xs text-neutral-300 space-y-1">
              <div className="font-semibold text-white">Privy Server Wallets Protection</div>
              <p className="text-neutral-400 leading-relaxed">
                Zero private keys are stored on the Multipu server. Signing is authorized via Privy&apos;s isolated
                hardware enclaves (TEEs) and verified on-chain.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
