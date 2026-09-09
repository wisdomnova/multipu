"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconTrendingUp,
  IconCoins,
  IconRocket,
  IconLayoutGrid,
  IconSearch,
  IconKey,
  IconMenu2,
  IconX,
  IconBell,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { WalletButton } from "@/components/wallet-button";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { NotificationsSidebar } from "@/components/dashboard/notifications-sidebar";
import { TradingAgentCopilot } from "@/components/dashboard/trading-agent-copilot";

const navItems = [
  { label: "Dashboard", icon: IconLayoutGrid, href: "/dashboard" },
  { label: "Tokens", icon: IconCoins, href: "/dashboard/tokens" },
  { label: "Launches", icon: IconRocket, href: "/dashboard/launches" },
  { label: "Earnings", icon: IconTrendingUp, href: "/dashboard/earnings" },
  { label: "API Keys", icon: IconKey, href: "/dashboard/api" },
  { label: "Explore", icon: IconSearch, href: "/dashboard/explore" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { session } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Check unread notifications count
  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.unreadCount > 0) {
          setHasUnread(true);
        }
      })
      .catch(() => {});
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setNotificationsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isItemActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }
    if (href === "/dashboard/explore") {
      return pathname === "/dashboard/explore" || pathname.startsWith("/dashboard/trade");
    }
    return pathname.startsWith(href);
  };

  const walletShort = session.isLoggedIn
    ? `${session.walletAddress.slice(0, 4)}...${session.walletAddress.slice(-4)}`
    : null;

  return (
    <div className="h-screen overflow-hidden bg-background">
      <div className="flex h-full">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 border-r border-border h-full flex-shrink-0 bg-background">
          <div className="p-6 border-b border-border">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 flex-shrink-0">
                <Image src="/logo.png" alt="Multipu" fill sizes="28px" className="object-contain" />
              </div>
              <span className="text-base font-semibold text-text-primary">
                Multipu
              </span>
            </Link>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = isItemActive(item.href);
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

        {/* Mobile Sidebar & Backdrop Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm lg:hidden"
                aria-hidden="true"
              />

              {/* Slide-out Drawer */}
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-background border-r border-border z-50 flex flex-col lg:hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-border">
                  <Link
                    href="/"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2.5"
                  >
                    <div className="relative w-7 h-7 flex-shrink-0">
                      <Image src="/logo.png" alt="Multipu" fill sizes="28px" className="object-contain" />
                    </div>
                    <span className="text-base font-semibold text-text-primary">
                      Multipu
                    </span>
                  </Link>

                  <button
                    onClick={() => setMobileOpen(false)}
                    className="p-1.5 text-text-muted hover:text-text-primary rounded-sm transition-colors"
                    aria-label="Close menu"
                  >
                    <IconX size={20} />
                  </button>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
                  {navItems.map((item) => {
                    const isActive = isItemActive(item.href);
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3.5 py-3 text-sm rounded-sm transition-colors font-medium",
                          isActive
                            ? "bg-accent/10 text-accent border border-accent/20"
                            : "text-text-secondary hover:text-text-primary hover:bg-elevated"
                        )}
                      >
                        <item.icon size={18} />
                        {item.label}
                      </Link>
                    );
                  })}

                  {/* Activity & Notifications Drawer Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setMobileOpen(false);
                      setNotificationsOpen(true);
                      setHasUnread(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-3 text-sm rounded-sm transition-colors font-medium text-text-secondary hover:text-text-primary hover:bg-elevated cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <IconBell size={18} />
                      <span>Activity &amp; Tracking</span>
                    </div>
                    {hasUnread && (
                      <span className="w-2 h-2 rounded-full bg-accent" />
                    )}
                  </button>

                  {/* Launch Token Action */}
                  <div className="pt-4 mt-4 border-t border-border">
                    <Link
                      href="/launch"
                      onClick={() => setMobileOpen(false)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-accent text-white font-medium text-sm hover:bg-accent-hover transition-colors font-mono"
                    >
                      <IconRocket size={16} />
                      Launch Token
                    </Link>
                  </div>
                </nav>

                {/* Wallet Info & Footer */}
                <div className="p-4 border-t border-border bg-elevated/40">
                  {session.isLoggedIn ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-elevated rounded-sm border border-border">
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
                      <WalletButton className="w-full justify-center text-xs" />
                    </div>
                  ) : (
                    <WalletButton className="w-full justify-center" />
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Main content */}
        <main className="flex-1 h-full overflow-y-auto min-w-0 flex flex-col">
          {/* Top bar (mobile) with Hamburger Menu, Activity Bell & Wallet */}
          <div className="lg:hidden border-b border-border bg-[rgba(5,5,5,0.85)] backdrop-blur-xl sticky top-0 z-40">
            <div className="flex items-center justify-between px-3 sm:px-6 h-14 sm:h-16 gap-2">
              <div className="flex items-center gap-2.5">
                {/* Hamburger Trigger */}
                <button
                  onClick={() => setMobileOpen(true)}
                  className="p-1.5 -ml-1 text-text-secondary hover:text-text-primary hover:bg-white/[0.05] rounded-sm transition-colors cursor-pointer"
                  aria-label="Open navigation menu"
                >
                  <IconMenu2 size={20} />
                </button>

                <Link href="/" className="flex items-center gap-2">
                  <div className="relative w-6 h-6 flex-shrink-0">
                    <Image src="/logo.png" alt="Multipu" fill sizes="24px" className="object-contain" />
                  </div>
                  <span className="text-sm font-semibold text-text-primary font-mono">
                    Multipu
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Activity Bell on Mobile Navbar */}
                <button
                  onClick={() => {
                    setNotificationsOpen(true);
                    setHasUnread(false);
                  }}
                  className="relative p-2 text-text-dim hover:text-text-primary hover:bg-white/[0.05] rounded-sm transition-colors cursor-pointer"
                  title="Activity Feed"
                  aria-label="Activity Feed"
                >
                  <IconBell size={18} />
                  {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
                  )}
                </button>

                <WalletButton />
              </div>
            </div>
          </div>

          {/* Unified Header with Supported Chain Balances */}
          <DashboardHeader
            onOpenNotifications={() => {
              setNotificationsOpen(true);
              setHasUnread(false);
            }}
            hasUnreadNotifications={hasUnread}
          />

          <div className="flex-1 min-w-0">
            {children}
          </div>
        </main>
      </div>

      {/* Global Notifications Sidebar */}
      <NotificationsSidebar
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* Live AI Trading Agent Copilot */}
      <TradingAgentCopilot />
    </div>
  );
}
