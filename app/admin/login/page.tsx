"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-sm border border-border bg-elevated p-6 space-y-4">
        <h1 className="text-xl font-semibold text-text-primary">Admin Login</h1>
        <p className="text-sm text-text-secondary">
          Enter admin password to access control pages.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Admin password"
          className="w-full bg-transparent border border-border px-3 py-2 text-sm"
        />
        {error && <p className="text-xs text-error">{error}</p>}
        <button
          disabled={loading}
          onClick={async () => {
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
            } finally {
              setLoading(false);
            }
          }}
          className="w-full px-4 py-2 bg-accent text-white text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </div>
    </div>
  );
}
