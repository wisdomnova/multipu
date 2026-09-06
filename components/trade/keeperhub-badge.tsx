"use client";

import { IconShieldCheck, IconLock } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface KeeperHubBadgeProps {
  className?: string;
  simulated?: boolean;
}

export function KeeperHubBadge({ className, simulated = true }: KeeperHubBadgeProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-3 py-2 bg-emerald-500/5 border border-emerald-500/20 rounded-md text-xs font-mono",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-emerald-400">
        <IconShieldCheck size={14} className="flex-shrink-0" />
        <span className="font-semibold text-[11px] uppercase tracking-wider">KeeperHub MEV Shield</span>
      </div>
      <div className="flex items-center gap-2 text-text-dim text-[10px]">
        <span>Private RPC</span>
        <span className="inline-block w-1 h-1 rounded-full bg-emerald-500" />
        <span className="text-text-muted">{simulated ? "Deterministic" : "Active"}</span>
      </div>
    </div>
  );
}
