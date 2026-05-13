"use client";

import { useEffect, useState } from "react";
import { Wallet, Send, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type TreasuryData = {
  configured: boolean;
  address: string;
  balanceSol: number;
  transfersCount: number;
  transfers: Array<{
    id: string;
    from_wallet: string;
    to_wallet: string;
    amount_sol: number;
    signature: string;
    fee_type: string;
    status: "pending" | "confirmed" | "failed";
    created_at: string;
    error_message: string | null;
  }>;
};

export default function AdminTreasuryPage() {
  const [data, setData] = useState<TreasuryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [withdrawalForm, setWithdrawalForm] = useState({
    recipient: "",
    amount: "",
  });
  const [status, setStatus] = useState<"idle" | "withdrawing" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/treasury")
      .then((r) => r.json())
      .then((d) => {
        setData(d.treasury);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handleWithdraw = async () => {
    if (!withdrawalForm.recipient || !withdrawalForm.amount) {
      setStatus("error");
      setStatusMessage("Please fill in recipient and amount");
      return;
    }

    setStatus("withdrawing");

    try {
      const res = await fetch("/api/admin/treasury", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "withdraw",
          recipientAddress: withdrawalForm.recipient,
          amountSol: parseFloat(withdrawalForm.amount),
        }),
      });

      const result = await res.json();

      if (res.ok) {
        setStatus("success");
        setStatusMessage(`✓ Withdrawal sent: ${result.signature?.slice(0, 20)}...`);
        setWithdrawalForm({ recipient: "", amount: "" });
        setTimeout(() => {
          setStatus("idle");
          window.location.reload();
        }, 3000);
      } else {
        setStatus("error");
        setStatusMessage(result.error || "Withdrawal failed");
      }
    } catch (err) {
      setStatus("error");
      setStatusMessage("Network error. Please try again.");
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

  const getStatusIcon = (status: string) => {
    if (status === "confirmed") return <CheckCircle size={14} className="text-emerald-500" />;
    if (status === "failed") return <AlertCircle size={14} className="text-error" />;
    return <Clock size={14} className="text-amber-500" />;
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Wallet size={24} className="text-accent" />
          <h1 className="text-3xl font-bold text-white">Treasury Management</h1>
        </div>
        <p className="text-sm text-text-secondary">
          Server-side fee collection & team withdrawals (signed on backend only)
        </p>
      </div>

      {/* Status Alert */}
      {status !== "idle" && (
        <div
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-xl border",
            status === "success"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : status === "error"
              ? "bg-error/10 border-error/30"
              : "bg-blue-500/10 border-blue-500/30"
          )}
        >
          {status === "success" ? (
            <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle
              size={16}
              className={status === "error" ? "text-error" : "text-blue-500"}
              style={{ flexShrink: 0 }}
            />
          )}
          <p className="text-xs text-white/70">{statusMessage}</p>
        </div>
      )}

      {loading ? (
        <div className="h-96 bg-white/[0.02] border border-white/[0.05] rounded-xl animate-pulse" />
      ) : !data?.configured ? (
        <div className="p-6 rounded-xl border border-error/30 bg-error/5">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-error mt-1 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-white mb-2">Treasury Not Configured</h3>
              <p className="text-sm text-text-secondary mb-4">
                Set <code className="text-xs">TREASURY_WALLET_SECRET</code> and{" "}
                <code className="text-xs">TREASURY_WALLET_ADDRESS</code> in .env to enable fee collection.
              </p>
              <code className="block text-xs text-text-muted bg-white/[0.02] p-3 rounded mt-2">
                TREASURY_WALLET_SECRET=&lt;base58-encoded-keypair&gt;
              </code>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Treasury Status Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-2">
                Treasury Address
              </div>
              <div className="text-xs text-white font-mono truncate">{data.address}</div>
            </div>
            <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-2">
                Balance
              </div>
              <div className="text-2xl font-bold text-accent">{data.balanceSol.toFixed(4)} SOL</div>
            </div>
            <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
              <div className="text-xs text-text-muted uppercase tracking-widest mb-2">
                Total Transfers
              </div>
              <div className="text-2xl font-bold text-white">{data.transfersCount}</div>
            </div>
          </div>

          {/* Withdrawal Form */}
          <div className="p-6 rounded-xl border border-white/[0.05] bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-4">
              <Send size={18} className="text-accent" />
              <h3 className="text-sm font-semibold text-white">Execute Withdrawal</h3>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                  Recipient Wallet Address
                </label>
                <input
                  type="text"
                  placeholder="Enter Solana wallet address (base58)"
                  value={withdrawalForm.recipient}
                  onChange={(e) =>
                    setWithdrawalForm((prev) => ({
                      ...prev,
                      recipient: e.target.value,
                    }))
                  }
                  disabled={status === "withdrawing"}
                  className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white text-sm placeholder-text-muted focus:outline-none focus:border-accent/50 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">
                  Amount (SOL)
                </label>
                <input
                  type="number"
                  placeholder="0.00"
                  step="0.01"
                  value={withdrawalForm.amount}
                  onChange={(e) =>
                    setWithdrawalForm((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  disabled={status === "withdrawing"}
                  className="w-full px-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-lg text-white text-sm placeholder-text-muted focus:outline-none focus:border-accent/50 disabled:opacity-50"
                />
              </div>

              <button
                onClick={handleWithdraw}
                disabled={status === "withdrawing"}
                className="w-full px-4 py-2.5 bg-accent text-white font-semibold rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-all"
              >
                {status === "withdrawing" ? "Processing..." : "Withdraw"}
              </button>
            </div>

            <div className="mt-4 p-3 rounded-lg bg-accent/5 border border-accent/20 text-xs text-text-secondary">
              ⚠️ Withdrawals are signed server-side only. Never expose private keys to browser.
            </div>
          </div>

          {/* Transfer History */}
          <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.05]">
              <h3 className="text-sm font-semibold text-white">Recent Transfers</h3>
            </div>

            {data.transfers.length === 0 ? (
              <div className="p-6 text-center text-text-muted text-sm">No transfers yet</div>
            ) : (
              <div className="divide-y divide-white/[0.05] max-h-96 overflow-y-auto">
                {data.transfers.map((transfer) => (
                  <div
                    key={transfer.id}
                    className="px-6 py-4 hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(transfer.status)}
                        <span className="text-sm font-semibold text-white">
                          {transfer.fee_type === "manual_withdrawal"
                            ? "Manual Withdrawal"
                            : transfer.fee_type === "protocol_fee_collection"
                            ? "Protocol Fee"
                            : "Refund"}
                        </span>
                        <span
                          className={cn(
                            "px-2 py-0.5 rounded text-xs font-mono",
                            transfer.status === "confirmed"
                              ? "bg-emerald-500/10 text-emerald-400"
                              : transfer.status === "failed"
                              ? "bg-error/10 text-error"
                              : "bg-amber-500/10 text-amber-400"
                          )}
                        >
                          {transfer.status}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-white">
                        {transfer.amount_sol.toFixed(4)} SOL
                      </span>
                    </div>
                    <div className="text-xs text-text-muted space-y-1">
                      <div>
                        From: <span className="text-white/60 font-mono">{transfer.from_wallet.slice(0, 16)}...</span>
                      </div>
                      <div>
                        To: <span className="text-white/60 font-mono">{transfer.to_wallet.slice(0, 16)}...</span>
                      </div>
                      <div>{formatTime(transfer.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-5 rounded-xl bg-accent/5 border border-accent/20">
            <div className="flex gap-3">
              <AlertCircle size={18} className="text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-2 text-sm">Server-Side Security</h3>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>✓ Private keys never leave the server</li>
                  <li>✓ All transfers signed server-side only</li>
                  <li>✓ Client cannot initiate direct transfers</li>
                  <li>✓ Every transfer logged with signature proof</li>
                  <li>✓ IP whitelist + rate limiting active</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
