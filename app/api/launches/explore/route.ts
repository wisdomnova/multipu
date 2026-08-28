import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/server";
import { getEnvironmentScope } from "@/lib/env-scope.server";

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
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Number(searchParams.get("limit") || 10));

    const supabase = createAdminSupabase();
    const scope = getEnvironmentScope();

    // 1. Fetch internal launches
    let dbQuery = supabase
      .from("launches")
      .select("*, tokens!inner(*)")
      .eq("status", "live")
      .eq("app_phase", scope.appPhase);

    if (query) {
      dbQuery = dbQuery.or(`name.ilike.%${query}%,symbol.ilike.%${query}%`, {
        foreignTable: "tokens",
      });
    }

    const { data: dbLaunches } = await dbQuery.order("launched_at", {
      ascending: false,
    });

    const mappedDbLaunches = (dbLaunches || []).map((l: any) => ({
      id: l.id,
      launchpad: l.launchpad,
      network: l.network,
      pool_address: l.pool_address,
      volume_24h: Number(l.volume_24h || 0),
      tokens: {
        name: l.tokens.name,
        symbol: l.tokens.symbol,
        mint_address: l.tokens.mint_address,
        supply: l.tokens.supply,
      },
    }));

    // 2. Fetch public launches from DexScreener
    const publicLaunches: any[] = [];
    try {
      let dexscreenerUrl = "";
      if (query) {
        dexscreenerUrl = `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`;
      } else {
        // Seed explore with trending tokens using 'meme' keyword to get a diverse list of memes
        dexscreenerUrl = `https://api.dexscreener.com/latest/dex/search?q=meme`;
      }

      const dexRes = await fetch(dexscreenerUrl, { signal: AbortSignal.timeout(5000) });
      if (dexRes.ok) {
        const dexData = await dexRes.json();
        const pairs = dexData.pairs || [];
        
        for (const pair of pairs) {
          const chain = pair.chainId?.toLowerCase();
          if (chain === "solana" || chain === "bsc") {
            const tokenAddress = pair.baseToken?.address;
            if (!tokenAddress) continue;

            const exists = mappedDbLaunches.some(
              (l) => l.tokens.mint_address?.toLowerCase() === tokenAddress.toLowerCase()
            );

            if (!exists) {
              publicLaunches.push({
                id: tokenAddress,
                launchpad: pair.dexId || "dex",
                network: chain === "solana" ? "Solana" : "BSC",
                pool_address: pair.pairAddress || null,
                volume_24h: Number(pair.volume?.h24 || 0),
                tokens: {
                  name: pair.baseToken.name,
                  symbol: pair.baseToken.symbol,
                  mint_address: tokenAddress,
                  supply: "0",
                },
              });
            }
          }
        }
      }
    } catch (e) {
      console.warn("DexScreener API search failed or timed out:", e);
    }

    const combined = [...mappedDbLaunches, ...publicLaunches];

    // Sort combined by volume descending
    combined.sort((a, b) => b.volume_24h - a.volume_24h);

    // Deduplicate by symbol (case insensitive) to keep only 1 of each type
    const seenSymbols = new Set<string>();
    const deduplicated: any[] = [];
    for (const launch of combined) {
      const symbol = launch.tokens.symbol?.toUpperCase();
      if (symbol && !seenSymbols.has(symbol)) {
        seenSymbols.add(symbol);
        deduplicated.push(launch);
      }
    }

    // Paginate results
    const totalLaunches = deduplicated.length;
    const totalPages = Math.ceil(totalLaunches / limit);
    const startIndex = (page - 1) * limit;
    const paginatedLaunches = deduplicated.slice(startIndex, startIndex + limit);

    return Response.json({
      launches: paginatedLaunches,
      pagination: {
        page,
        limit,
        totalLaunches,
        totalPages,
      },
    });
  } catch (err) {
    console.error("[API] GET /api/launches/explore error:", err);
    return Response.json({ error: "Failed to fetch explore directory" }, { status: 500 });
  }
}
