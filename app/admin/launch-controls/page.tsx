"use client";

import { useEffect, useState } from "react";
import { Lock, AlertTriangle, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type LaunchControls = {
  launchesPaused: boolean;
  allowlistMode: boolean;
  allowedWallets: string[];
  launchpadsEnabled: {
    meteora: boolean;
    bags: boolean;
    pumpfun: boolean;
    fourmeme: boolean;
  };
};

type ConfirmAction = "pause" | "resume" | "allowlist" | null;

export default function AdminLaunchControlsPage() {
  const [controls, setControls] = useState<LaunchControls | null>(null);
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [pendingWallets, setPendingWallets] = useState("");
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => {
        setControls(d.controls);
        setPendingWallets(d.controls?.allowedWallets?.join("\n") ?? "");
      })
      .catch(() => undefined);
  }, []);

  if (!controls) {
    return <div className="text-sm text-text-secondary">Loading launch controls...</div>;
  }

  const handleTogglePause = async () => {
    const newState = !controls.launchesPaused;
    setStatus("saving");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...controls, launchesPaused: newState }),
      });
      const data = await res.json();

      if (res.ok) {
        setControls(data.controls);
        setStatus("success");
        setStatusMessage(
          newState ? "All launches paused successfully." : "Launches resumed successfully."
        );
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMessage(data.error ?? "Failed to update launch status.");
      }
    } catch {
      setStatus("error");
      setStatusMessage("Network error. Please try again.");
    }
    setConfirmAction(null);
  };

  const handleUpdateAllowlist = async () => {
    const allowedWallets = pendingWallets
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);

    setStatus("saving");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...controls, allowedWallets }),
      });
      const data = await res.json();

      if (res.ok) {
        setControls(data.controls);
        setStatus("success");
        setStatusMessage(`Allowlist updated with ${allowedWallets.length} wallet(s).`);
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMessage(data.error ?? "Failed to update allowlist.");
      }
    } catch {
      setStatus("error");
      setStatusMessage("Network error. Please try again.");
    }
    setConfirmAction(null);
  };

  const handleToggleLaunchpad = async (launchpad: keyof typeof controls.launchpadsEnabled) => {
    const newState = {
      ...controls,
      launchpadsEnabled: {
        ...controls.launchpadsEnabled,
        [launchpad]: !controls.launchpadsEnabled[launchpad],
      },
    };

    setStatus("saving");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState),
      });
      const data = await res.json();

      if (res.ok) {
        setControls(data.controls);
        setStatus("success");
        setStatusMessage(`${launchpad} ${newState.launchpadsEnabled[launchpad] ? "enabled" : "disabled"}.`);
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMessage(data.error ?? "Failed to update launchpad status.");
      }
    } catch {
      setStatus("error");
      setStatusMessage("Network error. Please try again.");
    }
  };

  const handleToggleAllowlistMode = async () => {
    const newState = {
      ...controls,
      allowlistMode: !controls.allowlistMode,
    };

    setStatus("saving");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newState),
      });
      const data = await res.json();

      if (res.ok) {
        setControls(data.controls);
        setStatus("success");
        setStatusMessage(
          newState.allowlistMode ? "Allowlist mode enabled." : "Allowlist mode disabled."
        );
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setStatusMessage(data.error ?? "Failed to update allowlist mode.");
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
          <Lock size={24} className="text-accent" />
          <h1 className="text-3xl font-bold text-white">Launch Controls</h1>
        </div>
        <p className="text-sm text-text-secondary">
          Manage platform launch policies and access controls
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
          <CheckCircle size={16} className={`flex-shrink-0 ${status === "success" ? "text-emerald-500" : "text-blue-500"}`} />
          <p className="text-xs text-white/70">{statusMessage}</p>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={20} className="text-amber-500" />
              <h3 className="text-lg font-bold text-white">Confirm Action</h3>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              {confirmAction === "pause"
                ? "This will pause all active launches immediately."
                : confirmAction === "resume"
                ? "This will resume all launches."
                : "This will update the allowlist configuration."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 px-4 py-2 border border-white/[0.05] text-white text-sm font-semibold rounded-lg hover:bg-white/[0.02] transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction === "pause" || confirmAction === "resume") {
                    handleTogglePause();
                  } else if (confirmAction === "allowlist") {
                    handleUpdateAllowlist();
                  }
                }}
                className="flex-1 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 transition-all"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Grid */}
      <div className="space-y-6">
        {/* Emergency Pause Control */}
        <div className="p-6 rounded-xl border border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Emergency Pause</h3>
              <p className="text-xs text-text-muted">
                Immediately pause all launch operations
              </p>
            </div>
            <button
              onClick={() => setConfirmAction(controls.launchesPaused ? "resume" : "pause")}
              disabled={status === "saving"}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold transition-all",
                controls.launchesPaused
                  ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-error/10 border border-error/30 text-error hover:bg-error/20",
                status === "saving" && "opacity-50"
              )}
            >
              {controls.launchesPaused ? "Resume" : "Pause"}
            </button>
          </div>
          {controls.launchesPaused && (
            <div className="text-xs text-amber-400">⚠️ Launches are currently paused</div>
          )}
        </div>

        {/* Allowlist Mode */}
        <div className="p-6 rounded-xl border border-white/[0.05] bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white mb-1">Allowlist Mode</h3>
              <p className="text-xs text-text-muted">
                Restrict launches to approved wallets only
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={controls.allowlistMode}
                onChange={handleToggleAllowlistMode}
                disabled={status === "saving"}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-white/10 border border-white/20 rounded-full peer peer-checked:bg-accent peer-checked:border-accent transition-all disabled:opacity-50" />
              <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-5 transition-transform" />
            </label>
          </div>
          {controls.allowlistMode && (
            <div className="p-3 rounded-lg bg-accent/5 border border-accent/20 text-xs text-text-muted">
              Only {controls.allowedWallets.length} wallet(s) currently whitelisted
            </div>
          )}
        </div>

        {/* Allowlist Editor */}
        {controls.allowlistMode && (
          <div className="p-6 rounded-xl border border-white/[0.05] bg-white/[0.02]">
            <label className="text-sm font-semibold text-white block mb-3">
              Approved Wallets
            </label>
            <textarea
              value={pendingWallets}
              onChange={(e) => setPendingWallets(e.target.value)}
              placeholder="Enter one wallet address per line"
              className="w-full h-40 bg-white/[0.02] border border-white/[0.05] rounded-lg p-3 text-xs font-mono text-white focus:outline-none focus:border-white/20 transition-all resize-none"
            />
            <button
              onClick={() => setConfirmAction("allowlist")}
              disabled={status === "saving"}
              className="mt-3 px-4 py-2 bg-accent text-white text-sm font-semibold rounded-lg hover:bg-accent/90 disabled:opacity-50 transition-all"
            >
              Update Allowlist
            </button>
          </div>
        )}

        {/* Launchpad Controls */}
        <div className="p-6 rounded-xl border border-white/[0.05] bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-white mb-4">Enabled Launchpads</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(controls.launchpadsEnabled).map(([launchpad, enabled]) => (
              <button
                key={launchpad}
                onClick={() =>
                  handleToggleLaunchpad(launchpad as keyof typeof controls.launchpadsEnabled)
                }
                disabled={status === "saving"}
                className={cn(
                  "p-4 rounded-lg border transition-all text-sm font-medium",
                  enabled
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                    : "bg-white/[0.02] border-white/[0.05] text-text-secondary hover:bg-white/[0.04]",
                  status === "saving" && "opacity-50"
                )}
              >
                {launchpad === "pumpfun"
                  ? "Pump.fun"
                  : launchpad === "fourmeme"
                  ? "Four.Meme"
                  : launchpad.charAt(0).toUpperCase() + launchpad.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
