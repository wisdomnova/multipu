"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconRefresh, IconCheck, IconBell } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import type { NotificationItem, NotificationCategory } from "@/app/api/notifications/route";

interface NotificationsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationsSidebar({ isOpen, onClose }: NotificationsSidebarProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"ALL" | NotificationCategory>("ALL");
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
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
      const interval = setInterval(fetchNotifications, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map((n) => n.id)));
  };

  const filtered = notifications.filter((n) => {
    if (activeFilter === "ALL") return true;
    return n.category === activeFilter;
  });

  const unreadCount = notifications.filter((n) => !readIds.has(n.id)).length;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm"
            aria-hidden="true"
          />

          {/* Sidebar Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] max-w-[100vw] bg-[#121212] border-l border-white/[0.06] z-[60] flex flex-col select-none shadow-2xl"
          >
            {/* Top Bar Header */}
            <div className="p-6 border-b border-white/[0.04] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/[0.05] border border-white/[0.06] flex items-center justify-center text-white">
                  <IconBell size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white font-sans">
                    Notifications &amp; Activity
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                    Real-time transaction and agent events
                  </p>
                </div>
                {unreadCount > 0 && (
                  <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors disabled:opacity-40 cursor-pointer"
                  title="Refresh activity"
                  aria-label="Refresh activity"
                >
                  <IconRefresh size={15} className={cn(loading && "animate-spin text-white")} />
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors cursor-pointer"
                  aria-label="Close panel"
                >
                  <IconX size={17} />
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="px-6 py-3 border-b border-white/[0.04] flex items-center justify-between gap-2 overflow-x-auto">
              <div className="flex items-center gap-1.5">
                {(["ALL", "LAUNCH", "TRADE", "FEE", "SIGNAL"] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={cn(
                      "px-3 py-1 font-mono text-xs rounded-full transition-colors cursor-pointer",
                      activeFilter === filter
                        ? "text-black bg-white font-semibold"
                        : "text-neutral-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06]"
                    )}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="font-mono text-[11px] text-neutral-400 hover:text-white transition-colors whitespace-nowrap cursor-pointer pl-2"
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* Notification Stream List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {loading && notifications.length === 0 ? (
                <div className="py-20 text-center text-xs text-neutral-500 font-mono">
                  Loading activity stream...
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-20 text-center bg-[#181818] rounded-2xl p-8 border border-dashed border-white/[0.04]">
                  <p className="text-xs text-neutral-300 font-sans font-medium">
                    No updates in this stream
                  </p>
                  <p className="text-[11px] text-neutral-500 font-sans mt-1">
                    Activity will appear here as trades, creator fees, and deployments occur.
                  </p>
                </div>
              ) : (
                filtered.map((item) => {
                  const isRead = readIds.has(item.id);

                  const content = (
                    <div
                      onClick={() => setReadIds((prev) => new Set(prev).add(item.id))}
                      className={cn(
                        "p-4 rounded-xl border transition-all text-left w-full block cursor-pointer",
                        isRead
                          ? "bg-[#141414] border-white/[0.03] hover:border-white/[0.08]"
                          : "bg-[#181818] border-white/[0.08] hover:border-white/[0.14]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 font-medium">
                            {item.category}
                          </span>
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.metric && (
                            <span
                              className={cn(
                                "font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                item.status === "ALERT"
                                  ? "text-red-400 bg-red-500/10"
                                  : item.status === "SUCCESS"
                                  ? "text-emerald-400 bg-emerald-500/10"
                                  : item.status === "PENDING"
                                  ? "text-amber-400 bg-amber-500/10"
                                  : "text-neutral-400 bg-white/[0.05]"
                              )}
                            >
                              {item.metric}
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-neutral-500">
                            {item.timeAgo}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-semibold text-white font-sans tracking-tight mb-1">
                        {item.title}
                      </div>

                      <div className="text-xs text-neutral-400 font-sans leading-relaxed">
                        {item.detail}
                      </div>
                    </div>
                  );

                  if (item.link) {
                    return (
                      <Link
                        key={item.id}
                        href={item.link}
                        onClick={onClose}
                        className="block focus:outline-none"
                      >
                        {content}
                      </Link>
                    );
                  }

                  return <div key={item.id}>{content}</div>;
                })
              )}
            </div>

            {/* Bottom Status Footer */}
            <div className="p-4 px-6 border-t border-white/[0.04] flex items-center justify-between font-mono text-[11px] text-neutral-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Live Telemetry
              </span>
              <span>Updated automatically</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
