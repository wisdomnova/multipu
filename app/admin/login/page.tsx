"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Login failed");
        return;
      }

      router.push("/admin");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-accent/10 border border-accent/30 mb-4">
            <Lock size={24} className="text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Admin Access</h1>
          <p className="text-sm text-text-secondary">
            Secure control panel for system operations
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          {/* Password Input */}
          <div className="relative">
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-widest mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                disabled={loading}
                className="w-full bg-white/[0.02] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-text-muted focus:outline-none focus:border-white/30 focus:bg-white/[0.04] transition-all disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 transform text-text-muted hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error/10 border border-error/30">
              <AlertCircle size={16} className="text-error flex-shrink-0" />
              <p className="text-xs text-error">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full px-4 py-3 bg-accent text-white text-sm font-semibold rounded-xl hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? "Authenticating..." : "Sign In"}
          </button>
        </form>

        {/* Security Info */}
        <div className="mt-8 p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <p className="text-xs text-text-muted leading-relaxed">
            <span className="font-semibold text-white">⚠️ Security Notice:</span> All admin actions are logged and monitored. Unauthorized access attempts will be recorded.
          </p>
        </div>
      </div>
    </div>
  );
}
