import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/server";
import { getEnvironmentScope } from "@/lib/env-scope.server";

function formatTimeAgo(timestampMs: number): string {
  const diffSec = Math.max(1, Math.floor((Date.now() - timestampMs) / 1000));
  if (diffSec < 60) return `${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d`;
}

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim();
    const chainFilter = (searchParams.get("chain") || "all").toLowerCase();
    const categoryFilter = (searchParams.get("category") || "all").toLowerCase();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.max(1, Number(searchParams.get("limit") || 30));

    const supabase = createAdminSupabase();
    const scope = getEnvironmentScope();

    // 1. Fetch internal live launches from Supabase DB
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

    const mappedDbLaunches = (dbLaunches || []).map((l: any) => {
      const vol = Number(l.volume_24h || 0);
      const createdAtMs = l.launched_at ? new Date(l.launched_at).getTime() : Date.now() - 1800000;
      const progressVal = Math.min(100, Math.max(10, Math.floor((vol / 500) * 100)));

      return {
        id: l.id,
        launchpad: l.launchpad || "multipu",
        network: l.network || "Solana",
        pool_address: l.pool_address,
        volume_24h: vol,
        market_cap: vol * 12.5 || 50000,
        fdv: vol * 12.5 || 50000,
        price_usd: 0.000025,
        price_change_24h: 0,
        price_change_1h: 0,
        price_change_5m: 0,
        txns_24h: { buys: 0, sells: 0 },
        created_at: l.launched_at || new Date().toISOString(),
        time_ago: formatTimeAgo(createdAtMs),
        category: progressVal >= 75 ? "final_stretch" : "new",
        progress: progressVal,
        dev_holding_pct: 2.0,
        top_10_pct: 35.0,
        snipers_pct: 5.0,
        holders_count: 1,
        tokens: {
          id: l.tokens.id || l.id,
          name: l.tokens.name,
          symbol: l.tokens.symbol,
          mint_address: l.tokens.mint_address || l.pool_address,
          supply: l.tokens.supply || "1000000000",
          decimals: l.tokens.decimals || 9,
          image_url: l.tokens.image_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${l.tokens.symbol}`,
          header_url: null,
          description: l.tokens.description || "",
          socials: {
            website: l.tokens.website || "",
            twitter: l.tokens.twitter || "",
            telegram: l.tokens.telegram || "",
          },
        },
      };
    });

    // 2. Fetch live public memes from DexScreener & GeckoTerminal
    const publicLaunches: any[] = [];
    const profilesMap = new Map<string, any>();

    try {
      if (query) {
        // Direct search query
        const searchRes = await fetch(
          `https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`,
          { signal: AbortSignal.timeout(4500) }
        );
        if (searchRes.ok) {
          const sData = await searchRes.json();
          const pairs = sData.pairs || [];
          for (const p of pairs) {
            const chain = p.chainId?.toLowerCase();
            const tokenAddr = p.baseToken?.address;
            if (!tokenAddr) continue;

            const normalizedNetwork =
              chain === "solana" ? "Solana" : chain === "bsc" ? "BSC" : chain === "robinhood" ? "Robinhood" : chain === "base" ? "Base" : "Solana";

            const pCreatedAt = p.pairCreatedAt ? Number(p.pairCreatedAt) : Date.now() - 3600000;
            const progressVal = Math.min(100, Math.max(10, Math.floor(((p.volume?.h24 || 1000) / 50000) * 100)));

            const isMigrated = p.dexId === "raydium" || p.dexId === "uniswap" || p.dexId === "pancakeswap";
            const cat = isMigrated ? "migrated" : progressVal >= 70 ? "final_stretch" : "new";

            const buys = Number(p.txns?.h24?.buys || 0);
            const sells = Number(p.txns?.h24?.sells || 0);
            const totalTxns = buys + sells;
            const holdersEst = Math.max(totalTxns > 0 ? Math.floor(totalTxns * 0.6) : 25, 12);

            publicLaunches.push({
              id: tokenAddr,
              launchpad: p.dexId || "dex",
              network: normalizedNetwork,
              pool_address: p.pairAddress || null,
              volume_24h: Number(p.volume?.h24 || 0),
              market_cap: Number(p.marketCap || p.fdv || 0),
              fdv: Number(p.fdv || 0),
              price_usd: Number(p.priceUsd || 0),
              price_change_24h: Number(p.priceChange?.h24 || 0),
              price_change_1h: Number(p.priceChange?.h1 || 0),
              price_change_5m: Number(p.priceChange?.m5 || 0),
              txns_24h: { buys, sells },
              created_at: new Date(pCreatedAt).toISOString(),
              time_ago: formatTimeAgo(pCreatedAt),
              category: cat,
              progress: progressVal,
              dev_holding_pct: parseFloat(Math.max(0.5, (100 / (holdersEst + 10)) * 1.5).toFixed(1)),
              top_10_pct: Math.min(85, Math.max(18, Math.floor(65 - holdersEst * 0.05))),
              snipers_pct: Math.min(25, Math.max(1, Math.floor((buys / (totalTxns || 1)) * 15))),
              holders_count: holdersEst,
              tokens: {
                id: tokenAddr,
                name: p.baseToken.name,
                symbol: p.baseToken.symbol,
                mint_address: tokenAddr,
                supply: "1000000000",
                decimals: 9,
                image_url:
                  p.info?.imageUrl ||
                  `https://api.dicebear.com/7.x/identicon/svg?seed=${p.baseToken.symbol}`,
                header_url: p.info?.header || null,
                description: p.info?.description || "",
                socials: {
                  website: p.info?.websites?.[0]?.url || "",
                  twitter: p.info?.socials?.find((s: any) => s.type === "twitter" || s.type === "x")?.url || "",
                  telegram: p.info?.socials?.find((s: any) => s.type === "telegram")?.url || "",
                },
              },
            });
          }
        }
      } else {
        // Fetch real-time boosted tokens & latest profiles
        const [profilesRes, boostsRes] = await Promise.allSettled([
          fetch("https://api.dexscreener.com/token-profiles/latest/v1", { signal: AbortSignal.timeout(4000) }).then((r) => r.json()),
          fetch("https://api.dexscreener.com/token-boosts/top/v1", { signal: AbortSignal.timeout(4000) }).then((r) => r.json()),
        ]);

        const profileList = profilesRes.status === "fulfilled" && Array.isArray(profilesRes.value) ? profilesRes.value : [];
        const boostList = boostsRes.status === "fulfilled" && Array.isArray(boostsRes.value) ? boostsRes.value : [];

        for (const pr of [...profileList, ...boostList]) {
          if (pr.tokenAddress) {
            profilesMap.set(pr.tokenAddress.toLowerCase(), pr);
          }
        }

        const targetAddresses = Array.from(
          new Set([...profileList.map((p: any) => p.tokenAddress), ...boostList.map((b: any) => b.tokenAddress)].filter(Boolean))
        ).slice(0, 30);

        if (targetAddresses.length > 0) {
          const pairsRes = await fetch(
            `https://api.dexscreener.com/latest/dex/tokens/${targetAddresses.join(",")}`,
            { signal: AbortSignal.timeout(4500) }
          );

          if (pairsRes.ok) {
            const pairsData = await pairsRes.json();
            const pairs = pairsData.pairs || [];

            for (const p of pairs) {
              const chain = p.chainId?.toLowerCase();
              const tokenAddr = p.baseToken?.address;
              if (!tokenAddr) continue;

              const profileMeta = profilesMap.get(tokenAddr.toLowerCase()) || {};

              const normalizedNetwork =
                chain === "solana" ? "Solana" : chain === "bsc" ? "BSC" : chain === "robinhood" ? "Robinhood" : chain === "base" ? "Base" : "Solana";

              const pCreatedAt = p.pairCreatedAt ? Number(p.pairCreatedAt) : Date.now() - 3600000;
              const progressVal = Math.min(100, Math.max(15, Math.floor(((p.volume?.h24 || 5000) / 60000) * 100)));

              const isMigrated = p.dexId === "raydium" || p.dexId === "uniswap" || p.dexId === "pancakeswap";
              const isNew = Date.now() - pCreatedAt < 7200000; // < 2 hours
              const cat = isMigrated ? "migrated" : progressVal >= 70 ? "final_stretch" : isNew ? "new" : "trending";

              const buys = Number(p.txns?.h24?.buys || 0);
              const sells = Number(p.txns?.h24?.sells || 0);
              const totalTxns = buys + sells;
              const holdersEst = Math.max(totalTxns > 0 ? Math.floor(totalTxns * 0.55) : 38, 15);

              const imgUrl =
                p.info?.imageUrl ||
                profileMeta.icon ||
                profileMeta.openGraph ||
                `https://api.dicebear.com/7.x/identicon/svg?seed=${p.baseToken.symbol}`;

              publicLaunches.push({
                id: tokenAddr,
                launchpad: p.dexId || "dex",
                network: normalizedNetwork,
                pool_address: p.pairAddress || null,
                volume_24h: Number(p.volume?.h24 || 0),
                market_cap: Number(p.marketCap || p.fdv || 0),
                fdv: Number(p.fdv || 0),
                price_usd: Number(p.priceUsd || 0),
                price_change_24h: Number(p.priceChange?.h24 || 0),
                price_change_1h: Number(p.priceChange?.h1 || 0),
                price_change_5m: Number(p.priceChange?.m5 || 0),
                txns_24h: { buys, sells },
                created_at: new Date(pCreatedAt).toISOString(),
                time_ago: formatTimeAgo(pCreatedAt),
                category: cat,
                progress: progressVal,
                dev_holding_pct: parseFloat(Math.max(0.4, (100 / (holdersEst + 12)) * 1.6).toFixed(1)),
                top_10_pct: Math.min(80, Math.max(15, Math.floor(58 - holdersEst * 0.04))),
                snipers_pct: Math.min(22, Math.max(1, Math.floor((buys / (totalTxns || 1)) * 12))),
                holders_count: holdersEst,
                tokens: {
                  id: tokenAddr,
                  name: p.baseToken.name,
                  symbol: p.baseToken.symbol,
                  mint_address: tokenAddr,
                  supply: "1000000000",
                  decimals: 9,
                  image_url: imgUrl,
                  header_url: p.info?.header || profileMeta.header || null,
                  description: p.info?.description || profileMeta.description || "",
                  socials: {
                    website: p.info?.websites?.[0]?.url || profileMeta.links?.find((l: any) => !l.type || l.type === "website")?.url || "",
                    twitter: p.info?.socials?.find((s: any) => s.type === "twitter" || s.type === "x")?.url || profileMeta.links?.find((l: any) => l.type === "twitter")?.url || "",
                    telegram: p.info?.socials?.find((s: any) => s.type === "telegram")?.url || profileMeta.links?.find((l: any) => l.type === "telegram")?.url || "",
                  },
                },
              });
            }
          }
        }
      }
    } catch (dexErr) {
      console.warn("DexScreener discovery fetch error:", dexErr);
    }

    // Merge internal and public launches, deduplicate by mint address
    const combined = [...mappedDbLaunches, ...publicLaunches];
    const seenAddresses = new Set<string>();
    let deduplicated: any[] = [];

    for (const launch of combined) {
      const address = launch.tokens.mint_address?.toLowerCase();
      if (address && !seenAddresses.has(address)) {
        seenAddresses.add(address);
        deduplicated.push(launch);
      }
    }

    // Filter by Chain if requested
    if (chainFilter !== "all") {
      deduplicated = deduplicated.filter(
        (l) => l.network.toLowerCase() === chainFilter
      );
    }

    // Filter by Category if requested
    if (categoryFilter !== "all") {
      deduplicated = deduplicated.filter(
        (l) => l.category === categoryFilter
      );
    }

    // Sort by volume descending
    deduplicated.sort((a, b) => b.volume_24h - a.volume_24h);

    // Dynamic Partitioning into Terminal Columns
    const finalStretchTokens = deduplicated.filter(
      (l) => l.category === "final_stretch" || (l.progress >= 70 && l.category !== "migrated")
    );
    const migratedTokens = deduplicated.filter(
      (l) => l.category === "migrated" || l.launchpad === "raydium" || l.launchpad === "uniswap" || l.launchpad === "pancakeswap"
    );
    const newPairsTokens = deduplicated.filter(
      (l) => l.category === "new" || l.progress < 50
    );

    // If any column has fewer items, populate from top volume tokens
    const finalStretchList = finalStretchTokens.length > 0 ? finalStretchTokens : deduplicated.slice(0, 10);
    const migratedList = migratedTokens.length > 0 ? migratedTokens : deduplicated.slice(10, 20);
    const newPairsList = newPairsTokens.length > 0 ? newPairsTokens : deduplicated.slice(20, 30);

    // Paginate results
    const totalLaunches = deduplicated.length;
    const totalPages = Math.ceil(totalLaunches / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedLaunches = deduplicated.slice(startIndex, startIndex + limit);

    return Response.json({
      launches: paginatedLaunches,
      all_launches: deduplicated,
      terminal_columns: {
        final_stretch: finalStretchList.slice(0, 15),
        migrated: migratedList.slice(0, 15),
        new_pairs: newPairsList.slice(0, 15),
      },
      stats: {
        total_24h_volume: deduplicated.reduce((sum, l) => sum + (l.volume_24h || 0), 0),
        active_tokens_count: totalLaunches,
      },
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
