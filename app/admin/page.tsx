"use client";

import { useEffect, useState } from "react";
import { CheckCircle, AlertCircle, Server, Shield } from "lucide-react";

type HealthData = {
  launchesPaused: boolean;
  mainnetLaunchesAllowed: boolean;
  evmLaunchesAllowed: boolean;
};

export default function AdminOverviewPage() {
  const [data, setData] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/health/launch-policies")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const statusItems = [
    {
      label: "Launch Status",
      value: data?.launchesPaused ? "Paused" : "Active",
      status: data?.launchesPaused ? "warning" : "healthy",
      icon: Server,
    },
    {
      label: "Mainnet Launches",
      value: data?.mainnetLaunchesAllowed ? "Enabled" : "Disabled",
      status: data?.mainnetLaunchesAllowed ? "healthy" : "warning",
      icon: Shield,
    },
    {
      label: "EVM Adapters",
      value: data?.evmLaunchesAllowed ? "Enabled" : "Disabled",
      status: data?.evmLaunchesAllowed ? "healthy" : "warning",
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">System Overview</h1>
        <p className="text-sm text-text-secondary">
          Real-time status and policy enforcement summary
        </p>
      </div>

      {/* Status Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-white/[0.02] border border-white/[0.05] rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {statusItems.map((item) => {
            const Icon = item.icon;
            const isHealthy = item.status === "healthy";
            return (
              <div
                key={item.label}
                className="p-5 rounded-xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <Icon size={20} className="text-text-muted opacity-60" />
                  {isHealthy ? (
                    <CheckCircle size={18} className="text-emerald-500/70" />
                  ) : (
                    <AlertCircle size={18} className="text-amber-500/70" />
                  )}
                </div>
                <div className="text-xs text-text-muted uppercase tracking-widest mb-1">
                  {item.label}
                </div>
                <div className="text-lg font-semibold text-white">
                  {item.value}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info Box */}
      <div className="p-5 rounded-xl bg-accent/5 border border-accent/20">
        <div className="flex gap-3">
          <Shield size={18} className="text-accent flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-white mb-1 text-sm">Security Monitoring Active</h3>
            <p className="text-xs text-text-secondary leading-relaxed">
              All admin actions are automatically logged and monitored. Suspicious activity is flagged immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
