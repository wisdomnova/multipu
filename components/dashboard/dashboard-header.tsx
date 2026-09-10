"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { IconRefresh, IconBell, IconMenu2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { useWalletBalances } from "@/hooks/use-wallet-balances";
import { NotificationsSidebar } from "@/components/dashboard/notifications-sidebar";

function formatBalance(val: number) {
  if (val === 0) return "0.00";
  if (val < 0.0001) return "<0.0001";
  if (val < 1) return val.toFixed(4);
  if (val < 1000) return val.toFixed(3);
  return val.toLocaleString("en-US", { maximumFractionDigits: 2 });
}

interface DashboardHeaderProps {
  onOpenNotifications?: () => void;
  hasUnreadNotifications?: boolean;
  onOpenMobileMenu?: () => void;
}

export function DashboardHeader({
  onOpenNotifications,
  hasUnreadNotifications,
  onOpenMobileMenu,
}: DashboardHeaderProps) {
  const { balances, isLoading, refresh } = useWalletBalances();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [internalHasUnread, setInternalHasUnread] = useState(true);

  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        if (data.unreadCount > 0) {
          setInternalHasUnread(true);
        }
      })
      .catch(() => {});
  }, []);

  const hasUnread =
    hasUnreadNotifications !== undefined
      ? hasUnreadNotifications
      : internalHasUnread;

  const handleOpenNotifications = () => {
    if (onOpenNotifications) {
      onOpenNotifications();
    } else {
      setNotificationsOpen(true);
      setInternalHasUnread(false);
    }
  };

  const chains = [
    {
      key: "solana",
      label: "Solana",
      symbol: "SOL",
      data: balances.solana,
    },
    {
      key: "bsc",
      label: "BNB Chain",
      symbol: "BNB",
      data: balances.bsc,
    },
    {
      key: "robinhood",
      label: "Robinhood",
      symbol: "ETH",
      data: balances.robinhood,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="flex items-center justify-between w-full px-3 sm:px-6 py-2.5 sm:py-3.5 gap-2 sm:gap-3">
          {/* Left section: Mobile hamburger & logo + Supported Chain Balances */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {onOpenMobileMenu && (
              <div className="flex items-center gap-2 lg:hidden flex-shrink-0">
                <button
                  onClick={onOpenMobileMenu}
                  className="p-1.5 -ml-1 text-text-secondary hover:text-text-primary hover:bg-white/[0.05] rounded-sm transition-colors cursor-pointer"
                  aria-label="Open navigation menu"
                >
                  <IconMenu2 size={20} />
                </button>

                <Link href="/" className="flex items-center flex-shrink-0" aria-label="Home">
                  <div className="relative w-6 h-6 flex-shrink-0">
                    <Image src="/logo.png" alt="Multipu" fill sizes="24px" className="object-contain" />
                  </div>
                </Link>
              </div>
            )}

            {/* Supported Chain Balances */}
            <div className="flex items-center gap-1 sm:gap-2 bg-elevated/80 border border-border px-2 sm:px-4 py-1 sm:py-2 rounded-sm overflow-x-auto scrollbar-none max-w-[calc(100vw-110px)] sm:max-w-none">
              {chains.map((chain, index) => {
                const hasBalance = chain.data.balance > 0;
                return (
                  <div
                    key={chain.key}
                    className={cn(
                      "flex items-baseline gap-1.5 sm:gap-2 px-1.5 sm:px-3 py-0.5 font-mono whitespace-nowrap transition-colors",
                      index > 0 && "border-l border-border pl-2 sm:pl-4",
                      hasBalance ? "text-text-primary" : "text-text-muted"
                    )}
                    title={`${chain.label}: ${chain.data.balance} ${chain.symbol}`}
                  >
                    <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-text-dim">
                      {chain.symbol}
                    </span>
                    <span
                      className={cn(
                        "text-xs sm:text-base font-bold font-mono tracking-tight",
                        hasBalance ? "text-accent" : "text-text-secondary"
                      )}
                    >
                      {formatBalance(chain.data.balance)}
                    </span>
                  </div>
                );
              })}

              {/* Refresh balances button */}
              <button
                onClick={refresh}
                disabled={isLoading}
                className="p-1 sm:p-1.5 text-text-dim hover:text-text-primary hover:bg-white/[0.04] rounded transition-colors disabled:opacity-50 ml-1 sm:ml-2 flex-shrink-0 cursor-pointer"
                title="Refresh balances"
                aria-label="Refresh balances"
              >
                <IconRefresh
                  size={14}
                  className={cn(isLoading && "animate-spin text-accent")}
                />
              </button>
            </div>
          </div>

          {/* Activity Stream Notification Button - On the right */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleOpenNotifications}
              className="relative p-2 text-text-dim hover:text-text-primary hover:bg-white/[0.05] rounded-sm transition-colors cursor-pointer"
              title="Activity Stream & Notifications"
              aria-label="Activity Stream & Notifications"
            >
              <IconBell size={21} />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent animate-pulse" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Sidebar (Internal Fallback) */}
      {!onOpenNotifications && (
        <NotificationsSidebar
          isOpen={notificationsOpen}
          onClose={() => setNotificationsOpen(false)}
        />
      )}
    </>
  );
}
