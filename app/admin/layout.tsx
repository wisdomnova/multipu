"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Lock, Zap, DollarSign, AlertCircle, LogOut, Globe } from "lucide-react";
import { useState } from "react";

const items = [
  { href: "/admin", label: "Overview", icon: Zap },
  { href: "/admin/protocol-fee", label: "Protocol Fee", icon: DollarSign },
  { href: "/admin/launch-controls", label: "Launch Controls", icon: Lock },
  { href: "/admin/network-settings", label: "Network Settings", icon: Globe },
  { href: "/admin/security", label: "Security Logs", icon: AlertCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/admin/auth/session", { method: "DELETE" });
      router.push("/admin/login");
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-white/[0.05] bg-black/40 backdrop-blur-sm p-6 flex flex-col">
        <div className="mb-8">
          <h2 className="text-xs font-semibold text-white/60 tracking-widest uppercase mb-1">
            Control Panel
          </h2>
          <div className="h-px bg-gradient-to-r from-accent/40 to-transparent" />
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
                  "border border-transparent",
                  isActive
                    ? "bg-white/5 border-white/10 text-white"
                    : "text-text-secondary hover:text-white hover:bg-white/[0.02]"
                )}
              >
                <Icon size={16} className="opacity-60" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sign out button */}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={cn(
            "flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm transition-all duration-200",
            "border border-white/[0.05] text-text-secondary hover:text-white hover:bg-white/[0.02]",
            "disabled:opacity-50"
          )}
        >
          <LogOut size={16} className="opacity-60" />
          <span>{isLoggingOut ? "Logging out..." : "Sign out"}</span>
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl">
          {children}
        </div>
      </main>
    </div>
  );
}
