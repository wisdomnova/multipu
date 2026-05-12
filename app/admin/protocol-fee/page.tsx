"use client";

import { useEffect, useState } from "react";
import { DollarSign, CheckCircle, AlertCircle } from "lucide-react";

type ProtocolFee = {
  enabled: boolean;
  mode: "fixed" | "hybrid";
  flatFeeUsd: number;
  variableFeeBps: number;
  freeLaunchesPerWallet: number;
  proMonthlyUsd: number;
};

const defaultFee: ProtocolFee = {
  enabled: true,
  mode: "fixed",
  flatFeeUsd: 9,
  variableFeeBps: 0,
  freeLaunchesPerWallet: 1,
  proMonthlyUsd: 99,
};

export default function AdminProtocolFeePage() {
  const [fee, setFee] = useState<ProtocolFee>(defaultFee);
  const [originalFee, setOriginalFee] = useState<ProtocolFee>(defaultFee);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetch("/api/admin/protocol-fee")
      .then((r) => r.json())
      .then((d) => {
        if (d?.protocolFee) {
          setFee(d.protocolFee);
          setOriginalFee(d.protocolFee);
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setHasChanges(JSON.stringify(fee) !== JSON.stringify(originalFee));
  }, [fee, originalFee]);

  const handleSave = async () => {
    setStatus("saving");
    setStatusMessage("");

    try {
      const res = await fetch("/api/admin/protocol-fee", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fee),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus("success");
        setStatusMessage("Protocol fee configuration saved successfully.");
        setOriginalFee(fee);
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMessage(data.error ?? "Failed to save settings.");
      }
    } catch (err) {
      setStatus("error");
      setStatusMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <DollarSign size={24} className="text-accent" />
          <h1 className="text-3xl font-bold text-white">Protocol Fee</h1>
        </div>
        <p className="text-sm text-text-secondary">
          Configure pricing model and fee structure for token launches
        </p>
      </div>

      {/* Status Alert */}
      {status !== "idle" && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border ${
            status === "success"
              ? "bg-emerald-500/10 border-emerald-500/30"
              : status === "error"
              ? "bg-error/10 border-error/30"
              : "bg-blue-500/10 border-blue-500/30"
          }`}
        >
          {status === "success" ? (
            <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <AlertCircle size={16} className="text-blue-500 flex-shrink-0" />
          )}
          <p className="text-xs text-white/70">{statusMessage}</p>
        </div>
      )}

      {/* Configuration Grid */}
      <div className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div>
            <label className="text-sm font-semibold text-white block mb-1">
              Enable Protocol Fee
            </label>
            <p className="text-xs text-text-muted">
              Enable or disable fee collection for launches
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={fee.enabled}
              onChange={(e) => setFee({ ...fee, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-white/10 border border-white/20 rounded-full peer peer-checked:bg-accent peer-checked:border-accent transition-all" />
            <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform" />
          </label>
        </div>

        {/* Mode Selection */}
        <div>
          <label className="text-sm font-semibold text-white block mb-3">
            Fee Mode
          </label>
          <div className="grid grid-cols-2 gap-3">
            {(["fixed", "hybrid"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setFee({ ...fee, mode })}
                className={`p-4 rounded-xl border transition-all text-sm font-medium ${
                  fee.mode === mode
                    ? "bg-accent/10 border-accent/40 text-accent"
                    : "bg-white/[0.02] border-white/[0.05] text-text-secondary hover:bg-white/[0.04]"
                }`}
              >
                {mode === "fixed" ? "Fixed Rate" : "Hybrid (Fixed + Variable)"}
              </button>
            ))}
          </div>
        </div>

        {/* Fee Settings */}
        <div className="grid grid-cols-2 gap-4">
          {[
            ["flatFeeUsd", "Flat Fee", "$", "USD"],
            ["variableFeeBps", "Variable Fee", "", "basis points"],
            ["freeLaunchesPerWallet", "Free Launches", "", "per wallet"],
            ["proMonthlyUsd", "Pro Tier", "$", "USD/month"],
          ].map(([key, label, prefix, unit]) => (
            <div key={key}>
              <label className="text-xs font-semibold text-text-muted uppercase tracking-widest mb-2 block">
                {label}
              </label>
              <div className="flex items-center gap-2">
                {prefix && <span className="text-text-muted text-sm">{prefix}</span>}
                <input
                  type="number"
                  min="0"
                  step={key.includes("Fee") ? "0.01" : "1"}
                  value={fee[key as keyof ProtocolFee] as number}
                  onChange={(e) =>
                    setFee({
                      ...fee,
                      [key]: Number(e.target.value),
                    })
                  }
                  className="flex-1 bg-white/[0.02] border border-white/[0.05] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/20 transition-all"
                />
                <span className="text-xs text-text-muted min-w-fit">{unit}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={!hasChanges || status === "saving"}
          className="px-6 py-3 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {status === "saving" ? "Saving..." : "Save Changes"}
        </button>
        {hasChanges && (
          <button
            onClick={() => {
              setFee(originalFee);
              setStatus("idle");
            }}
            className="px-6 py-3 border border-white/[0.05] text-white text-sm font-semibold rounded-lg hover:bg-white/[0.02] transition-all"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
