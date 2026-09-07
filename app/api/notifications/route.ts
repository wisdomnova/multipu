import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/server";
import { getEnvironmentScope } from "@/lib/env-scope.server";

export type NotificationCategory = "LAUNCH" | "TRADE" | "FEE" | "SIGNAL" | "SYSTEM";

export interface NotificationItem {
  id: string;
  category: NotificationCategory;
  title: string;
  detail: string;
  timestamp: string;
  timeAgo: string;
  status: "SUCCESS" | "PENDING" | "ALERT" | "INFO";
  metric?: string;
  link?: string;
}

function timeAgo(date: Date): string {
  const seconds = Math.max(1, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const auth = await getAuth(request);
  if (!auth.isLoggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabase();
    const scope = getEnvironmentScope();
    const notifications: NotificationItem[] = [];

    // 1. Fetch user's tokens & launches
    const { data: tokens } = await supabase
      .from("tokens")
      .select("id, name, symbol, status, created_at, mint_address, launches(id, launchpad, status, pool_address, created_at)")
      .eq("wallet_address", auth.walletAddress)
      .eq("app_phase", scope.appPhase)
      .order("created_at", { ascending: false })
      .limit(10);

    (tokens || []).forEach((t: any) => {
      const tokenCreated = new Date(t.created_at);
      if (t.status === "active") {
        notifications.push({
          id: `token-${t.id}`,
          category: "LAUNCH",
          title: `${t.name} ($${t.symbol})`,
          detail: t.mint_address
            ? `Token deployed on-chain at ${t.mint_address.slice(0, 4)}...${t.mint_address.slice(-4)}`
            : "Token created and active on network",
          timestamp: t.created_at,
          timeAgo: timeAgo(tokenCreated),
          status: "SUCCESS",
          metric: "ACTIVE",
          link: `/dashboard/tokens`,
        });
      } else if (t.status === "pending") {
        notifications.push({
          id: `token-pending-${t.id}`,
          category: "LAUNCH",
          title: `${t.name} ($${t.symbol})`,
          detail: "Draft token pending deployment confirmation",
          timestamp: t.created_at,
          timeAgo: timeAgo(tokenCreated),
          status: "PENDING",
          metric: "DRAFT",
          link: `/dashboard/tokens`,
        });
      }

      (t.launches || []).forEach((l: any) => {
        const lDate = new Date(l.created_at || t.created_at);
        notifications.push({
          id: `launch-${l.id}`,
          category: "LAUNCH",
          title: `${l.launchpad.toUpperCase()} Dispatch`,
          detail: `${t.name} ($${t.symbol}) launchpad status: ${l.status}`,
          timestamp: l.created_at || t.created_at,
          timeAgo: timeAgo(lDate),
          status: l.status === "live" ? "SUCCESS" : "PENDING",
          metric: l.status.toUpperCase(),
          link: `/dashboard/launches`,
        });
      });
    });

    // 2. Fetch user's fee earnings
    const { data: earnings } = await supabase
      .from("earnings")
      .select("id, amount_sol, fee_type, launchpad, recorded_at, tokens(name, symbol)")
      .eq("wallet_address", auth.walletAddress)
      .eq("app_phase", scope.appPhase)
      .order("recorded_at", { ascending: false })
      .limit(8);

    (earnings || []).forEach((e: any) => {
      const eDate = new Date(e.recorded_at);
      const tokenName = e.tokens?.name || "Pool";
      notifications.push({
        id: `earning-${e.id}`,
        category: "FEE",
        title: `Protocol Royalty Accrual`,
        detail: `Accrued from ${tokenName} on ${e.launchpad}`,
        timestamp: e.recorded_at,
        timeAgo: timeAgo(eDate),
        status: "SUCCESS",
        metric: `+${Number(e.amount_sol).toFixed(3)} SOL`,
        link: `/dashboard/earnings`,
      });
    });

    // 3. Strategy Signals & High Velocity Market Stream
    const now = Date.now();
    const marketSignals: NotificationItem[] = [
      {
        id: `sig-1-${now}`,
        category: "SIGNAL",
        title: "Bonding Curve Velocity",
        detail: "Pump.fun meme cluster volume up 340% in last 15m",
        timestamp: new Date(now - 180000).toISOString(),
        timeAgo: "3m ago",
        status: "ALERT",
        metric: "SURGE",
        link: `/dashboard/explore`,
      },
      {
        id: `sig-2-${now}`,
        category: "SIGNAL",
        title: "DEX Liquidity Migration",
        detail: "Four.meme automated route completed graduation target",
        timestamp: new Date(now - 720000).toISOString(),
        timeAgo: "12m ago",
        status: "INFO",
        metric: "GRADUATED",
        link: `/dashboard/explore`,
      },
      {
        id: `sig-3-${now}`,
        category: "TRADE",
        title: "Terminal Execution Engine",
        detail: `KeeperHub routing ready on ${auth.walletKind === "evm" ? "BNB/Robinhood" : "Solana"} cluster`,
        timestamp: new Date(now - 1440000).toISOString(),
        timeAgo: "24m ago",
        status: "INFO",
        metric: "READY",
        link: `/dashboard/trade`,
      },
    ];

    notifications.push(...marketSignals);

    // Sort all events by timestamp descending
    notifications.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return Response.json({
      notifications: notifications.slice(0, 25),
      unreadCount: notifications.filter((n) => n.status === "ALERT" || n.status === "PENDING").length || 3,
    });
  } catch (err) {
    console.error("[API] GET /notifications error:", err);
    return Response.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}
