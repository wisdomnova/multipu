"use client";

import { useEffect, useState } from "react";

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
  const [status, setStatus] = useState("");

  useEffect(() => {
    fetch("/api/admin/protocol-fee")
      .then((r) => r.json())
      .then((d) => d?.protocolFee && setFee(d.protocolFee))
      .catch(() => undefined);
  }, []);

  return (
    <div className="space-y-4 max-w-xl">
      <h1 className="text-2xl font-semibold">Protocol Fee</h1>
      <p className="text-sm text-text-secondary">
        Dynamic protocol fee controls used for pricing operations.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={fee.enabled}
          onChange={(e) => setFee({ ...fee, enabled: e.target.checked })}
        />
        Fee enabled
      </label>

      <select
        value={fee.mode}
        onChange={(e) => setFee({ ...fee, mode: e.target.value as ProtocolFee["mode"] })}
        className="w-full border border-border px-3 py-2 text-sm bg-transparent"
      >
        <option value="fixed">Fixed</option>
        <option value="hybrid">Hybrid</option>
      </select>

      {[
        ["flatFeeUsd", "Flat Fee (USD)"],
        ["variableFeeBps", "Variable Fee (BPS)"],
        ["freeLaunchesPerWallet", "Free Launches / Wallet"],
        ["proMonthlyUsd", "Pro Monthly (USD)"],
      ].map(([key, label]) => (
        <div key={key} className="space-y-1">
          <label className="text-xs text-text-muted">{label}</label>
          <input
            type="number"
            value={fee[key as keyof ProtocolFee] as number}
            onChange={(e) =>
              setFee({ ...fee, [key]: Number(e.target.value) } as ProtocolFee)
            }
            className="w-full border border-border px-3 py-2 text-sm bg-transparent"
          />
        </div>
      ))}

      <button
        onClick={async () => {
          setStatus("");
          const res = await fetch("/api/admin/protocol-fee", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(fee),
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
