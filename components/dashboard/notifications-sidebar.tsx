"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconRefresh, IconCheck } from "@tabler/icons-react";
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
          {/* Backdrop (no shadow, no border) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            aria-hidden="true"
          />

          {/* Sidebar Drawer (no border, no shadow, clean dark flat background) */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[420px] max-w-[100vw] bg-[#07080b] z-[60] flex flex-col select-none"
          >
            {/* Top Bar Header */}
            <div className="p-6 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono text-xs uppercase tracking-widest text-text-primary font-bold">
                  Activity Feed
                </span>
                {unreadCount > 0 && (
                  <span className="font-mono text-[10px] uppercase tracking-wider text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="p-1.5 text-text-dim hover:text-text-primary transition-colors disabled:opacity-40"
                  title="Refresh activity"
                  aria-label="Refresh activity"
                >
                  <IconRefresh size={14} className={cn(loading && "animate-spin text-accent")} />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 text-text-dim hover:text-text-primary transition-colors"
                  aria-label="Close panel"
                >
                  <IconX size={16} />
                </button>
              </div>
            </div>

            {/* Filter Tabs (minimalist text buttons, no borders, no shadows) */}
            <div className="px-6 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
              {(["ALL", "LAUNCH", "TRADE", "FEE", "SIGNAL"] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    "px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors rounded-sm",
                    activeFilter === filter
                      ? "text-white bg-white/[0.08] font-semibold"
                      : "text-text-dim hover:text-text-secondary hover:bg-white/[0.03]"
                  )}
                >
                  {filter}
                </button>
              ))}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="ml-auto font-mono text-[10px] uppercase tracking-wider text-text-muted hover:text-text-primary transition-colors whitespace-nowrap pl-2"
                >
                  Mark read
                </button>
              )}
            </div>

            {/* Notification Stream List */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2 divide-none">
              {loading && notifications.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="font-mono text-xs text-text-dim">Loading session updates...</div>
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="font-mono text-xs text-text-dim">No updates in this stream</div>
                  <div className="font-mono text-[10px] text-text-muted">
                    Activity will appear here as trades and deployments occur.
                  </div>
                </div>
              ) : (
                filtered.map((item) => {
                  const isRead = readIds.has(item.id);

                  const content = (
                    <div
                      onClick={() => setReadIds((prev) => new Set(prev).add(item.id))}
                      className={cn(
                        "p-3.5 rounded-sm transition-colors text-left w-full block",
                        isRead ? "bg-white/[0.015] hover:bg-white/[0.03]" : "bg-white/[0.04] hover:bg-white/[0.06]"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-text-dim font-medium">
                            {item.category}
                          </span>
                          {!isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {item.metric && (
                            <span
                              className={cn(
                                "font-mono text-[10px] font-semibold uppercase tracking-wider",
                                item.status === "ALERT"
                                  ? "text-accent"
                                  : item.status === "SUCCESS"
                                  ? "text-success"
                                  : item.status === "PENDING"
                                  ? "text-warning"
                                  : "text-text-secondary"
                              )}
                            >
                              {item.metric}
                            </span>
                          )}
                          <span className="font-mono text-[10px] text-text-dim">
                            {item.timeAgo}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs font-medium text-text-primary tracking-tight mb-1">
                        {item.title}
                      </div>

                      <div className="text-[11px] text-text-muted leading-relaxed font-normal">
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

            {/* Bottom Status Footer (pure minimalist text, no border) */}
            <div className="p-6 pt-3 pb-6 flex items-center justify-between font-mono text-[10px] text-text-dim">
              <span>Telemetry: Active</span>
              <span>Updated in real-time</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
