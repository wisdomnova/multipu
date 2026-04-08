import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/server";

/**
 * GET /api/dashboard — Aggregated dashboard stats for the current user.
 *
 * Returns: {
 *   totalTokens, activeLaunches, totalEarnings, earningsToday,
 *   tokens (with launches), recentEarnings
 * }
 */
export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const auth = await getAuth();
  if (!auth.isLoggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminSupabase();
    const wallet = auth.walletAddress;

    // Run queries in parallel for performance
    const [tokensRes, launchesRes, earningsRes, recentEarningsRes] =
      await Promise.all([
        supabase
          .from("tokens")
          .select("*, launches(id, launchpad, status, pool_address)")
          .eq("wallet_address", wallet)
          .order("created_at", { ascending: false }),

        supabase
          .from("launches")
          .select("id, status")
          .eq("wallet_address", wallet),

        supabase
          .from("earnings")
          .select("amount_sol, recorded_at, launchpad")
          .eq("wallet_address", wallet),

        supabase
          .from("earnings")
          .select(
            "amount_sol, fee_type, recorded_at, launchpad, tokens(name, symbol)"
          )
          .eq("wallet_address", wallet)
          .order("recorded_at", { ascending: false })
          .limit(10),
      ]);

    const tokens = tokensRes.data ?? [];
    const launches: { id: string; status: string; launchpad?: string }[] = (launchesRes.data ?? []) as { id: string; status: string; launchpad?: string }[];
    const earnings: { amount_sol: number; recorded_at: string; launchpad: string }[] = (earningsRes.data ?? []) as { amount_sol: number; recorded_at: string; launchpad: string }[];
    const recentEarnings = recentEarningsRes.data ?? [];

    const totalEarnings = earnings.reduce(
      (sum, e) => sum + Number(e.amount_sol),
      0
    );

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const earningsToday = earnings
      .filter((e) => e.recorded_at > oneDayAgo)
      .reduce((sum, e) => sum + Number(e.amount_sol), 0);

    // Launchpads used (distinct)
    const launchpadsUsed = [
      ...new Set(launches.map((l) => l.launchpad).filter(Boolean)),
    ];

    return Response.json({
      stats: {
        totalTokens: tokens.length,
        activeLaunches: launches.filter((l) => l.status === "live").length,
        totalEarnings: Math.round(totalEarnings * 1e9) / 1e9,
        earningsToday: Math.round(earningsToday * 1e9) / 1e9,
        launchpadsUsed,
      },
      tokens,
      recentEarnings,
    });
  } catch (err) {
    console.error("[API] GET /dashboard error:", err);
    return Response.json(
      { error: "Failed to fetch dashboard" },
      { status: 500 }
    );
  }
}
