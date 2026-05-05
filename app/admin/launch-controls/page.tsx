"use client";

import { useEffect, useState } from "react";

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

export default function AdminLaunchControlsPage() {
  const [controls, setControls] = useState<LaunchControls | null>(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((d) => setControls(d.controls))
      .catch(() => undefined);
  }, []);

  if (!controls) {
    return <p className="text-sm text-text-secondary">Loading launch controls...</p>;
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-2xl font-semibold">Launch Controls</h1>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={controls.launchesPaused}
          onChange={(e) => setControls({ ...controls, launchesPaused: e.target.checked })}
        />
        Pause all launches
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={controls.allowlistMode}
          onChange={(e) => setControls({ ...controls, allowlistMode: e.target.checked })}
        />
        Allowlist mode
      </label>
      <textarea
        value={controls.allowedWallets.join("\n")}
        onChange={(e) =>
          setControls({
            ...controls,
            allowedWallets: e.target.value
              .split("\n")
              .map((v) => v.trim())
              .filter(Boolean),
          })
        }
        className="w-full min-h-32 border border-border bg-transparent p-3 text-xs font-mono"
      />
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(controls.launchpadsEnabled).map(([key, enabled]) => (
          <label key={key} className="flex items-center gap-2 text-sm border border-border p-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) =>
                setControls({
                  ...controls,
                  launchpadsEnabled: {
                    ...controls.launchpadsEnabled,
                    [key]: e.target.checked,
                  },
                })
              }
            />
            {key}
          </label>
        ))}
      </div>
      <button
        onClick={async () => {
          setStatus("");
          const res = await fetch("/api/admin/settings", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(controls),
          });
          const data = await res.json();
          setStatus(res.ok ? "Saved." : data.error ?? "Failed.");
        }}
        className="px-4 py-2 bg-accent text-white text-sm"
      >
        Save
      </button>
      {status && <p className="text-sm">{status}</p>}
    </div>
  );
}
