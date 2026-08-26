import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/server";
import { getEnvironmentScope } from "@/lib/env-scope.server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const auth = await getAuth();
  if (!auth.isLoggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    if (isUuid) {
      const supabase = createAdminSupabase();
      const scope = getEnvironmentScope();

      const { data: launch, error } = await supabase
        .from("launches")
        .select("*, tokens(*)")
        .eq("id", id)
        .eq("app_phase", scope.appPhase)
        .single();

      if (error || !launch) {
        return Response.json({ error: "Launch not found" }, { status: 404 });
      }

      return Response.json({ launch });
    } else {
      // Fetch public token details from DexScreener
      const dexRes = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${id}`, {
        signal: AbortSignal.timeout(5000),
      });

      if (dexRes.ok) {
        const dexData = await dexRes.json();
        const pairs = dexData.pairs || [];
        const matchedPair = pairs.find(
          (p: any) => p.chainId?.toLowerCase() === "solana" || p.chainId?.toLowerCase() === "bsc"
        ) || pairs[0];

        if (matchedPair) {
          const chain = matchedPair.chainId?.toLowerCase();
          const publicLaunch = {
            id: id,
            launchpad: matchedPair.dexId || "dex",
            network: chain === "solana" ? "Solana" : "BSC",
            pool_address: matchedPair.pairAddress || null,
            volume_24h: Number(matchedPair.volume?.h24 || 0),
            initial_liquidity: null,
            tokens: {
              id: id,
              name: matchedPair.baseToken.name,
              symbol: matchedPair.baseToken.symbol,
              mint_address: id,
              supply: "0",
              decimals: 9,
            },
          };
          return Response.json({ launch: publicLaunch });
        }
      }
      return Response.json({ error: "Public token details not found on DexScreener" }, { status: 404 });
    }
  } catch (err) {
    console.error("[API] GET /api/launches/[id] error:", err);
    return Response.json({ error: "Failed to fetch launch details" }, { status: 500 });
  }
}
