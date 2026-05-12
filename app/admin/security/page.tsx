"use client";

import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle, Clock, Shield } from "lucide-react";

type AuditLog = {
  id: string;
  wallet_address: string;
  action: string;
  payload?: Record<string, unknown>;
  timestamp: string;
  ip_address?: string;
};

export default function AdminSecurityPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000); // 3 second timeout

    fetch("/api/admin/security/audit-logs", { signal: controller.signal })
      .then((r) => r.json())
      .then((d) => {
        setLogs(d.logs || []);
        setError(null);
      })
      .catch((err) => {
        console.error("[Security] Failed to fetch audit logs:", err);
        if (err.name !== "AbortError") {
          setError("Failed to load audit logs. Check your connection.");
        } else {
          setError("Request timeout. Supabase may be unavailable.");
        }
        setLogs([]);
      })
      .finally(() => {
        clearTimeout(timeout);
        setLoading(false);
      });

    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes("login") || action.includes("logout")) {
      return <Shield size={16} className="text-blue-500" />;
    }
    if (action.includes("suspicious")) {
      return <AlertCircle size={16} className="text-error" />;
    }
    if (action.includes("update")) {
      return <CheckCircle size={16} className="text-emerald-500" />;
    }
    return <Clock size={16} className="text-text-muted" />;
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return timestamp;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      admin_login: "Admin Login",
      admin_logout: "Admin Logout",
      update_launch_controls: "Updated Launch Controls",
      update_protocol_fee: "Updated Protocol Fee",
      suspicious_activity: "Suspicious Activity",
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Shield size={24} className="text-accent" />
          <h1 className="text-3xl font-bold text-white">Security & Audit Logs</h1>
        </div>
        <p className="text-sm text-text-secondary">
          Complete record of all admin actions and security events
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-2">
            Total Events
          </div>
          <div className="text-2xl font-bold text-white">{logs.length}</div>
        </div>
        <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-2">
            Suspicious Events
          </div>
          <div className="text-2xl font-bold text-error">
            {logs.filter((l) => l.action.includes("suspicious")).length}
          </div>
        </div>
        <div className="p-4 rounded-xl border border-white/[0.05] bg-white/[0.02]">
          <div className="text-xs text-text-muted uppercase tracking-widest mb-2">
            Last Activity
          </div>
          <div className="text-sm text-white">
            {logs.length > 0 ? formatTime(logs[0]?.timestamp) : "No activity"}
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.02] overflow-hidden">
        <div className="px-6 py-4 border-b border-white/[0.05]">
          <h3 className="text-sm font-semibold text-white">Recent Activity</h3>
        </div>

        {loading ? (
          <div className="p-6 text-center text-text-muted text-sm">
            Loading audit logs...
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle size={20} className="text-error mx-auto mb-2" />
            <p className="text-sm text-error">{error}</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-6 text-center text-text-muted text-sm">
            No audit logs yet
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05] max-h-96 overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                className="px-6 py-4 hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="mt-1 flex-shrink-0">
                    {getActionIcon(log.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">
                        {getActionLabel(log.action)}
                      </span>
                      {log.action.includes("suspicious") && (
                        <span className="px-2 py-0.5 bg-error/10 border border-error/30 rounded text-xs text-error">
                          Alert
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-text-muted flex-wrap">
                      <span>
                        {log.wallet_address === "admin-password"
                          ? "Password Admin"
                          : log.wallet_address || "System"}
                      </span>
                      {log.ip_address && (
                        <>
                          <span>•</span>
                          <span>IP: {log.ip_address}</span>
                        </>
                      )}
                      <span>•</span>
                      <span>{formatTime(log.timestamp)}</span>
                    </div>
                    {log.payload && Object.keys(log.payload).length > 0 && (
                      <div className="mt-2 p-2 bg-white/[0.02] rounded border border-white/[0.05] text-xs text-text-muted font-mono">
                        {JSON.stringify(log.payload, null, 2)
                          .split("\n")
                          .slice(0, 3)
                          .join("\n")}
                        {JSON.stringify(log.payload, null, 2).split("\n").length > 3 &&
                          "\n..."}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Tips */}
      <div className="p-6 rounded-xl bg-accent/5 border border-accent/20">
        <h3 className="font-semibold text-white mb-3 text-sm">Security Best Practices</h3>
        <ul className="space-y-2 text-xs text-text-secondary">
          <li>• Regularly rotate your admin password</li>
          <li>• Use IP whitelisting to restrict access</li>
          <li>• Review audit logs daily for suspicious activity</li>
          <li>• Never share admin credentials</li>
          <li>• Enable 2FA when available (coming soon)</li>
          <li>• Log out when not in use</li>
        </ul>
      </div>
    </div>
  );
}
