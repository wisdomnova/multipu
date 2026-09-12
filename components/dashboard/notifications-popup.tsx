"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconX,
  IconRefresh,
  IconCheck,
  IconChecks,
  IconRocket,
  IconArrowsExchange,
  IconCoins,
  IconTrendingUp,
  IconBell,
  IconArrowRight,
  IconCircleCheck,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { NotificationItem, NotificationCategory } from "@/app/api/notifications/route";

interface NotificationsPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (hasUnread: boolean) => void;
}

type TabType = "ALL" | "UNREAD" | "LAUNCHES" | "SIGNALS";

export function NotificationsPopup({
  isOpen,
  onClose,
  onUnreadChange,
}: NotificationsPopupProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("ALL");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const popupRef = useRef<HTMLDivElement>(null);

  // Fetch live notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        const items: NotificationItem[] = data.notifications || [];
        setNotifications(items);
      }
    } catch {
      // Ignore network errors
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Handle outside click to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Notify parent of unread changes
  useEffect(() => {
    const unreadRemaining = notifications.some((n) => !readIds.has(n.id));
    onUnreadChange?.(unreadRemaining);
  }, [notifications, readIds, onUnreadChange]);

  const markAllAsRead = () => {
    const allIds = new Set(notifications.map((n) => n.id));
    setReadIds(allIds);
    onUnreadChange?.(false);
  };

  const markSingleAsRead = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setReadIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      return updated;
    });
  };

  // Filter items based on active tab
  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === "UNREAD") return !readIds.has(item.id);
    if (activeTab === "LAUNCHES") return item.category === "LAUNCH";
    if (activeTab === "SIGNALS") return item.category === "SIGNAL" || item.category === "TRADE";
    return true;
  });

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;
  const launchCount = notifications.filter((n) => n.category === "LAUNCH").length;
  const signalCount = notifications.filter(
    (n) => n.category === "SIGNAL" || n.category === "TRADE"
  ).length;

  const getCategoryIcon = (category: NotificationCategory) => {
    switch (category) {
      case "LAUNCH":
        return {
          icon: <IconRocket size={18} className="text-emerald-400" />,
          containerBg: "bg-emerald-500/10 border-emerald-500/20",
          badgeColor: "bg-emerald-400",
        };
      case "TRADE":
        return {
          icon: <IconArrowsExchange size={18} className="text-amber-400" />,
          containerBg: "bg-amber-500/10 border-amber-500/20",
          badgeColor: "bg-amber-400",
        };
      case "FEE":
        return {
          icon: <IconCoins size={18} className="text-purple-400" />,
          containerBg: "bg-purple-500/10 border-purple-500/20",
          badgeColor: "bg-purple-400",
        };
      case "SIGNAL":
        return {
          icon: <IconTrendingUp size={18} className="text-cyan-400" />,
          containerBg: "bg-cyan-500/10 border-cyan-500/20",
          badgeColor: "bg-cyan-400",
        };
      case "SYSTEM":
      default:
        return {
          icon: <IconBell size={18} className="text-neutral-300" />,
          containerBg: "bg-white/[0.05] border-white/[0.08]",
          badgeColor: "bg-neutral-400",
        };
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile backdrop for small screens */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 sm:hidden"
            onClick={onClose}
          />

          {/* Floating Popup Card */}
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "fixed sm:absolute top-16 sm:top-full right-3 sm:right-0 sm:mt-2.5 z-50",
              "w-[calc(100vw-24px)] sm:w-[420px] max-w-[440px]",
              "bg-[#0c0c0e]/95 backdrop-blur-2xl",
              "border border-white/[0.08]",
              "shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)]",
              "rounded-2xl sm:rounded-3xl",
              "overflow-hidden flex flex-col font-[family-name:var(--font-geist-sans)]"
            )}
          >
            {/* Header */}
            <div className="px-5 pt-4 pb-3 border-b border-white/[0.05] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h3 className="text-[15px] sm:text-base font-bold text-white tracking-tight font-[family-name:var(--font-geist-sans)]">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold font-[family-name:var(--font-geist-mono)] bg-purple-500/15 border border-purple-500/25 text-purple-300">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-white/[0.05] cursor-pointer"
                    title="Mark all as read"
                  >
                    <IconChecks size={14} className="text-purple-400" />
                    <span>Mark all read</span>
                  </button>
                )}

                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                  title="Refresh activity"
                  aria-label="Refresh"
                >
                  <IconRefresh
                    size={14}
                    className={cn(loading && "animate-spin text-purple-400")}
                  />
                </button>

                <button
                  onClick={onClose}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                  title="Close popup"
                  aria-label="Close"
                >
                  <IconX size={14} />
                </button>
              </div>
            </div>

            {/* Filter Navigation Tabs */}
            <div className="px-5 pt-2.5 pb-2 flex items-center gap-1.5 border-b border-white/[0.04] overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab("ALL")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
                  activeTab === "ALL"
                    ? "bg-white/[0.08] text-white font-semibold"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]"
                )}
              >
                All
                <span className="ml-1.5 text-[10px] opacity-70 font-mono">
                  {notifications.length}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("UNREAD")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer",
                  activeTab === "UNREAD"
                    ? "bg-white/[0.08] text-white font-semibold"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]"
                )}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(139,92,246,0.8)]" />
                )}
              </button>

              <button
                onClick={() => setActiveTab("LAUNCHES")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
                  activeTab === "LAUNCHES"
                    ? "bg-white/[0.08] text-white font-semibold"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]"
                )}
              >
                Launches
                <span className="ml-1.5 text-[10px] opacity-70 font-mono">
                  {launchCount}
                </span>
              </button>

              <button
                onClick={() => setActiveTab("SIGNALS")}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer",
                  activeTab === "SIGNALS"
                    ? "bg-white/[0.08] text-white font-semibold"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.03]"
                )}
              >
                Signals
                <span className="ml-1.5 text-[10px] opacity-70 font-mono">
                  {signalCount}
                </span>
              </button>
            </div>

            {/* Notification Items List */}
            <div className="max-h-[380px] sm:max-h-[420px] overflow-y-auto divide-y divide-white/[0.03] p-2">
              {filteredNotifications.length === 0 ? (
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-neutral-400 mb-3">
                    <IconCircleCheck size={22} className="text-purple-400/80" />
                  </div>
                  <h4 className="text-sm font-semibold text-white">All caught up</h4>
                  <p className="text-xs text-neutral-400 mt-1 max-w-[240px] leading-relaxed">
                    {activeTab === "UNREAD"
                      ? "You have read all pending notifications and updates."
                      : "No activity records found in this category yet."}
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  const isUnread = !readIds.has(item.id);
                  const { icon, containerBg, badgeColor } = getCategoryIcon(item.category);

                  const content = (
                    <div
                      onClick={() => markSingleAsRead(item.id)}
                      className={cn(
                        "group relative flex items-start gap-3.5 p-3 rounded-xl transition-all cursor-pointer",
                        isUnread
                          ? "bg-white/[0.025] hover:bg-white/[0.05]"
                          : "hover:bg-white/[0.02]"
                      )}
                    >
                      {/* Avatar / Category Icon */}
                      <div className="relative shrink-0 mt-0.5">
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105",
                            containerBg
                          )}
                        >
                          {icon}
                        </div>
                        {/* Status mini pip */}
                        <span
                          className={cn(
                            "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0c0c0e]",
                            badgeColor
                          )}
                        />
                      </div>

                      {/* Content Column */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <h4
                            className={cn(
                              "text-xs sm:text-[13px] font-semibold tracking-tight truncate",
                              isUnread ? "text-white" : "text-neutral-300"
                            )}
                          >
                            {item.title}
                          </h4>
                          <span className="text-[11px] text-neutral-400 font-mono shrink-0 whitespace-nowrap">
                            {item.timeAgo}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed mt-0.5 font-[family-name:var(--font-geist-sans)]">
                          {item.detail}
                        </p>

                        {/* Metric / Status Badge */}
                        {item.metric && (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-white/[0.04] border border-white/[0.06] text-neutral-300">
                              {item.metric}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Right Indicator / Hover Action */}
                      <div className="shrink-0 flex items-center pt-1">
                        {isUnread ? (
                          <div className="flex items-center">
                            <button
                              onClick={(e) => markSingleAsRead(item.id, e)}
                              className="hidden group-hover:flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.08] hover:bg-purple-500/20 text-neutral-400 hover:text-purple-300 transition-colors"
                              title="Mark as read"
                            >
                              <IconCheck size={11} />
                            </button>
                            <span className="group-hover:hidden w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]" />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );

                  if (item.link) {
                    return (
                      <Link
                        key={item.id}
                        href={item.link}
                        onClick={() => {
                          markSingleAsRead(item.id);
                          onClose();
                        }}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return <div key={item.id}>{content}</div>;
                })
              )}
            </div>

            {/* Bottom Footer Bar */}
            <div className="px-4 py-2.5 border-t border-white/[0.05] bg-white/[0.01] flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-neutral-400 font-mono text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Feed</span>
              </div>

              <Link
                href="/dashboard/explore"
                onClick={onClose}
                className="text-neutral-300 hover:text-white font-medium flex items-center gap-1 transition-colors hover:translate-x-0.5 cursor-pointer font-[family-name:var(--font-geist-sans)]"
              >
                <span>View all activity</span>
                <IconArrowRight size={13} />
              </Link>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
