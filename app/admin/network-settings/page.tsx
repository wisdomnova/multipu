"use client";

import { useEffect, useState } from "react";
import { Globe, AlertCircle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type NetworkSettings = {
  appPhase: "testnet" | "mainnet";
  solanaNetwork: "devnet" | "testnet" | "mainnet-beta";
  mainnetLaunchesEnabled: boolean;
  evmLaunchesEnabled: boolean;
};

export default function AdminNetworkSettingsPage() {
  const [settings, setSettings] = useState<NetworkSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/network-settings")
      .then((r) => r.json())
      .then((d) => {
        setSettings(d.settings || {});
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  const handlePhaseToggle = async () => {
    if (!settings) return;
    const newPhase = settings.appPhase === "testnet" ? "mainnet" : "testnet";
    setStatus("saving");

    try {
      const res = await fetch("/api/admin/network-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...settings, appPhase: newPhase }),
      });
      const data = await res.json();

      if (res.ok) {
        setSettings(data.settings);
        setStatus("success");
        setStatusMessage(`Switched to ${newPhase.toUpperCase()}`);
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMessage(data.error ?? "Failed to update network settings.");
      }
    } catch {
      setStatus("error");
      setStatusMessage("Network error. Please try again.");
    }
  };

  const handleMainnetLaunchesToggle = async () => {
    if (!settings) return;
    setStatus("saving");

    try {
      const res = await fetch("/api/admin/network-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...settings,
          mainnetLaunchesEnabled: !settings.mainnetLaunchesEnabled,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setSettings(data.settings);
        setStatus("success");
        setStatusMessage("Mainnet launches setting updated.");
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMessage(data.error ?? "Failed to update setting.");
      }
    } catch {
      setStatus("error");
      setStatusMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Globe size={24} className="text-accent" />
          <h1 className="text-3xl font-bold text-white">Network Settings</h1>
        </div>
        <p className="text-sm text-text-secondary">
          Configure application deployment phase and network parameters
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

      {/* Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 bg-white/[0.02] border border-white/[0.05] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : settings ? (
        <div className="space-y-6">
          {/* App Phase */}
          <div className="p-6 rounded-xl border border-white/[0.05] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">App Phase</h3>
                <p className="text-xs text-text-muted">
                  Switch between testnet and mainnet deployments
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-semibold",
                    settings.appPhase === "mainnet"
                      ? "bg-error/20 text-error"
                      : "bg-amber-500/20 text-amber-400"
                  )}
                >
                  {settings.appPhase.toUpperCase()}
                </span>
                <button
                  onClick={handlePhaseToggle}
                  disabled={status === "saving"}
                  className="px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-all"
                >
                  Switch
                </button>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05] text-xs text-text-muted">
              Current: <span className="text-white">{settings.solanaNetwork}</span>
            </div>
          </div>

          {/* Mainnet Launches */}
          <div className="p-6 rounded-xl border border-white/[0.05] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-white mb-1">Mainnet Launches</h3>
                <p className="text-xs text-text-muted">
                  Enable or disable token launches on mainnet
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.mainnetLaunchesEnabled}
                  onChange={handleMainnetLaunchesToggle}
                  disabled={status === "saving"}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/10 border border-white/20 rounded-full peer peer-checked:bg-accent peer-checked:border-accent transition-all disabled:opacity-50" />
                <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform" />
              </label>
            </div>
            {settings.mainnetLaunchesEnabled && (
              <div className="p-3 rounded-lg bg-error/5 border border-error/20 text-xs text-error">
                ⚠️ Mainnet launches are enabled. Ensure app phase is set to MAINNET.
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-5 rounded-xl bg-accent/5 border border-accent/20">
            <div className="flex gap-3">
              <AlertCircle size={18} className="text-accent flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-white mb-1 text-sm">Safety Notes</h3>
                <ul className="text-xs text-text-secondary space-y-1">
                  <li>• Testnet is safe for development and testing</li>
                  <li>• Mainnet affects real user token launches</li>
                  <li>• Changes are logged and audited</li>
                  <li>• Always verify before toggling to mainnet</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-text-muted">Failed to load network settings</div>
      )}
    </div>
  );
}
