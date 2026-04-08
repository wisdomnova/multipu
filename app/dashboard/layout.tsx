"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  TrendingUp,
  Coins,
  Rocket,
  LayoutGrid,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { WalletButton } from "@/components/wallet-button";

const navItems = [
  { label: "Dashboard", icon: LayoutGrid, href: "/dashboard" },
  { label: "Tokens", icon: Coins, href: "/dashboard/tokens" },
  { label: "Launches", icon: Rocket, href: "/dashboard/launches" },
  { label: "Earnings", icon: TrendingUp, href: "/dashboard/earnings" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { session } = useAuth();

  const walletShort = session.isLoggedIn
    ? `${session.walletAddress.slice(0, 4)}...${session.walletAddress.slice(-4)}`
    : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border min-h-screen sticky top-0">
          <div className="p-6 border-b border-border">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 flex-shrink-0">
                <Image src="/1.jpg" alt="" fill className="object-cover rounded-md" />
              </div>
              <span className="text-base font-semibold text-text-primary">
                Multipu
              </span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-sm transition-colors",
                    isActive
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "text-text-secondary hover:text-text-primary hover:bg-elevated"
                  )}
                >
                  <item.icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Wallet info */}
          <div className="p-4 border-t border-border">
            {session.isLoggedIn ? (
              <div className="flex items-center gap-3 p-3 bg-elevated rounded-sm">
                <div className="w-2 h-2 rounded-full bg-success" />
                <div className="flex-1 min-w-0">
                  <div className="font-mono text-xs text-text-primary truncate">
                    {walletShort}
                  </div>
                  <div className="font-mono text-[10px] text-text-dim">
                    Connected
                  </div>
                </div>
              </div>
            ) : (
              <WalletButton className="w-full justify-center" />
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Top bar (mobile) */}
          <div className="lg:hidden border-b border-border bg-[rgba(5,5,5,0.8)] backdrop-blur-xl sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 h-16">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="relative w-6 h-6 flex-shrink-0">
                  <Image src="/1.jpg" alt="" fill className="object-cover rounded-md" />
                </div>
                <span className="text-sm font-semibold text-text-primary">
                  Multipu
                </span>
              </Link>
              <WalletButton />
            </div>
            {/* Mobile nav tabs */}
            <div className="flex px-4 gap-1 pb-2 overflow-x-auto">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono whitespace-nowrap rounded-sm transition-colors",
                      isActive
                        ? "bg-accent/10 text-accent border border-accent/20"
                        : "text-text-muted hover:text-text-primary"
                    )}
                  >
                    <item.icon size={12} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {children}
        </main>
      </div>
    </div>
  );
}
