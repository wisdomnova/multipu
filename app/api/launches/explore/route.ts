import { getClientIp } from "@/lib/auth";
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

// Known curated Robinhood Chain (Sherwood / Pons / DEX) active meme tokens
const ROBINHOOD_MEME_TOKENS = [
  {
    address: "0x80bAa4b3bfAC6f4978700dF824B1B3d98e889136",
    name: "Crumbs",
    symbol: "CRUMBS",
    dexId: "sherwood",
    volume24h: 18460000,
    marketCap: 310000,
    holders: 24314,
    website: "https://crumbs.family/",
    twitter: "https://x.com/crumbsfamily",
    telegram: "https://t.me/crumbsfamily",
  },
  {
    address: "0xb97D9e5Ad6244d27588Fe0A624A8C78E512934eE",
    name: "RECEIPT",
    symbol: "RECEIPT",
    dexId: "sherwood",
    volume24h: 4140000,
    marketCap: 1740000,
    holders: 7995,
    website: "https://receipt.family/",
    twitter: "https://x.com/receiptfamily",
  },
  {
    address: "0xaEE120c50a0A212b071D71483aea4B4a8e9179F3",
    name: "Be like Jacob",
    symbol: "Jacob",
    dexId: "pons",
    volume24h: 2160000,
    marketCap: 2700,
    holders: 18136,
    website: "https://belikejacob.lol/",
    twitter: "https://x.com/BelikeJacobRH",
    telegram: "https://t.me/BelikeJacobRH",
  },
  {
    address: "0xcEcF8c51DED79d15EB14a08b704D8Fd265fea700",
    name: "CLAWDHOOD",
    symbol: "CLAWDHOOD",
    dexId: "sherwood",
    volume24h: 1980000,
    marketCap: 3000,
    holders: 9543,
    website: "https://www.clawdhood.site/",
    twitter: "https://x.com/CLAWDHOODx",
  },
  {
    address: "0x97C59c0a7eAe72592EE5Ae13fd2057C7BAd7F0D9",
    name: "Golden Inu",
    symbol: "GI",
    dexId: "sherwood",
    volume24h: 1410000,
    marketCap: 6100,
    holders: 4924,
    website: "https://goldeninu.io/",
    twitter: "https://x.com/goldeninuio",
    telegram: "https://t.me/goldeninurobin",
  },
  {
    address: "0x32B5DDF44A732C52c97F1542077954Ba79Fd3bff",
    name: "Shitapple",
    symbol: "SHIT",
    dexId: "pons",
    volume24h: 1320000,
    marketCap: 166900,
    holders: 842,
    website: "http://shitapple.site/",
    twitter: "http://x.com/shitapple1g",
    telegram: "https://t.me/shitapple",
  },
  {
    address: "0x25cd2901B6d16cB33185E7667F984dbc35BcF354",
    name: "Artificial Shiba",
    symbol: "ASHIBA",
    dexId: "sherwood",
    volume24h: 1150000,
    marketCap: 216700,
    holders: 4427,
    website: "https://artificialshiba.com/",
    twitter: "https://x.com/ASHIBA_COIN",
    telegram: "https://t.me/ArtificialShiba_Portal",
  },
  {
    address: "0x6a50F139F3eD4C9c7bDa0D067c5Ed09De1EEBbeA",
    name: "CLAWNCH",
    symbol: "CLAWNCH",
    dexId: "sherwood",
    volume24h: 973500,
    marketCap: 336600,
    holders: 3913,
    website: "https://clawn.ch/",
    twitter: "https://x.com/Clawnch_Bot",
  },
  {
    address: "0x792ff19204EF6C756b4D8Efe2441D050F5eCe818",
    name: "Sir Bag",
    symbol: "BAG",
    dexId: "pons",
    volume24h: 800900,
    marketCap: 587300,
    holders: 2248,
    website: "https://sirbag.com/",
    twitter: "https://x.com/Sirbagonhood",
    telegram: "https://t.me/SirBagonHood",
  },
  {
    address: "0x83D38b519308FE02158F043952B58A6B16A4a30E",
    name: "REEL",
    symbol: "REEL",
    dexId: "sherwood",
    volume24h: 786200,
    marketCap: 10100,
    holders: 4561,
    website: "https://www.reel.tips/",
    twitter: "https://x.com/reel_tips",
  },
  {
    address: "0x41bF9BfA1BB13758BdeF159486c218bcAbF2B79c",
    name: "Robinary",
    symbol: "ROBINARY",
    dexId: "pons",
    volume24h: 6000,
    marketCap: 4800,
    holders: 36,
    website: "https://robinary.xyz/",
    twitter: "https://x.com/robinary_xyz",
  },
];

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const query = (searchParams.get("q") || "").trim().toLowerCase();
    const chainFilter = (searchParams.get("chain") || "all").toLowerCase();
    const categoryFilter = (searchParams.get("category") || "all").toLowerCase();
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const itemsPerColumn = 10;

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

      let normChain = "Solana";
      if (l.network?.toLowerCase().includes("bsc")) normChain = "BSC";
      else if (l.network?.toLowerCase().includes("robinhood")) normChain = "Robinhood";

      return {
        id: l.tokens.mint_address || l.pool_address || l.id,
        launchpad: l.launchpad || "pumpfun",
        network: normChain,
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

    // 2. Fetch wide public meme pools across Solana, BNB, and Robinhood
    const publicLaunches: any[] = [];
    const profilesMap = new Map<string, any>();

    // Add Robinhood Chain pairs
    for (const rh of ROBINHOOD_MEME_TOKENS) {
      if (
        !query ||
        rh.name.toLowerCase().includes(query) ||
        rh.symbol.toLowerCase().includes(query) ||
        rh.address.toLowerCase().includes(query) ||
        query === "robinhood" ||
        query === "sherwood" ||
        query === "pons"
      ) {
        publicLaunches.push({
          id: rh.address,
          launchpad: rh.dexId,
          network: "Robinhood",
          pool_address: rh.address,
          volume_24h: rh.volume24h,
          market_cap: rh.marketCap,
          fdv: rh.marketCap,
          price_usd: rh.marketCap / 1000000000,
          price_change_24h: 12.5,
          price_change_1h: 3.2,
          price_change_5m: 0.8,
          txns_24h: { buys: 120, sells: 45 },
          created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
          time_ago: "12h",
          category: rh.volume24h > 1000000 ? "migrated" : rh.volume24h > 50000 ? "final_stretch" : "new",
          progress: 100,
          dev_holding_pct: 0.4,
          top_10_pct: 15.0,
          snipers_pct: 6.0,
          holders_count: rh.holders,
          tokens: {
            id: rh.address,
            name: rh.name,
            symbol: rh.symbol,
            mint_address: rh.address,
            supply: "1000000000",
            decimals: 18,
            image_url: `https://api.dicebear.com/7.x/identicon/svg?seed=${rh.symbol}`,
            header_url: null,
            description: `${rh.name} ($${rh.symbol}) on Robinhood Chain via ${rh.dexId.toUpperCase()}`,
            socials: {
              website: rh.website || "",
              twitter: rh.twitter || "",
              telegram: rh.telegram || "",
            },
          },
        });
      }
    }

    try {
      if (query) {
        // Search across DexScreener (queries all chains including solana, bsc, robinhood)
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

            let normalizedNetwork = "Solana";
            if (chain === "bsc") normalizedNetwork = "BSC";
            else if (chain === "robinhood" || p.dexId === "sherwood" || p.dexId === "pons") normalizedNetwork = "Robinhood";
            else if (chain === "base") normalizedNetwork = "Base";

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
                decimals: chain === "solana" ? 9 : 18,
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
        // Fetch wide pool across multiple free endpoints for Solana and BSC
        const [topBoostsRes, latestBoostsRes, profilesRes, geckoSolTrending, geckoBscTrending] =
          await Promise.allSettled([
            fetch("https://api.dexscreener.com/token-boosts/top/v1", { signal: AbortSignal.timeout(4000) }).then((r) => r.json()),
            fetch("https://api.dexscreener.com/token-boosts/latest/v1", { signal: AbortSignal.timeout(4000) }).then((r) => r.json()),
            fetch("https://api.dexscreener.com/token-profiles/latest/v1", { signal: AbortSignal.timeout(4000) }).then((r) => r.json()),
            fetch("https://api.geckoterminal.com/api/v2/networks/solana/trending_pools?page=1", {
              headers: { Accept: "application/json" },
              signal: AbortSignal.timeout(4000),
            }).then((r) => r.json()),
            fetch("https://api.geckoterminal.com/api/v2/networks/bsc/trending_pools?page=1", {
              headers: { Accept: "application/json" },
              signal: AbortSignal.timeout(4000),
            }).then((r) => r.json()),
          ]);

        const topBoostList = topBoostsRes.status === "fulfilled" && Array.isArray(topBoostsRes.value) ? topBoostsRes.value : [];
        const latestBoostList = latestBoostsRes.status === "fulfilled" && Array.isArray(latestBoostsRes.value) ? latestBoostsRes.value : [];
        const profileList = profilesRes.status === "fulfilled" && Array.isArray(profilesRes.value) ? profilesRes.value : [];

        for (const pr of [...profileList, ...topBoostList, ...latestBoostList]) {
          if (pr.tokenAddress) {
            profilesMap.set(pr.tokenAddress.toLowerCase(), pr);
          }
        }

        const addressSet = new Set<string>();
        topBoostList.forEach((t: any) => t.tokenAddress && addressSet.add(t.tokenAddress));
        latestBoostList.forEach((t: any) => t.tokenAddress && addressSet.add(t.tokenAddress));
        profileList.forEach((t: any) => t.tokenAddress && addressSet.add(t.tokenAddress));

        if (geckoSolTrending.status === "fulfilled" && Array.isArray(geckoSolTrending.value?.data)) {
          geckoSolTrending.value.data.forEach((p: any) => p.attributes?.address && addressSet.add(p.attributes.address));
        }
        if (geckoBscTrending.status === "fulfilled" && Array.isArray(geckoBscTrending.value?.data)) {
          geckoBscTrending.value.data.forEach((p: any) => p.attributes?.address && addressSet.add(p.attributes.address));
        }

        const allAddresses = Array.from(addressSet).slice(0, 90);

        // Batch in parallel chunks of 30 addresses
        const chunks: string[] = [];
        for (let i = 0; i < allAddresses.length; i += 30) {
          chunks.push(allAddresses.slice(i, i + 30).join(","));
        }

        const batchResults = await Promise.allSettled(
          chunks.map((chunk) =>
            fetch(`https://api.dexscreener.com/latest/dex/tokens/${chunk}`, {
              signal: AbortSignal.timeout(4500),
            }).then((r) => r.json())
          )
        );

        for (const res of batchResults) {
          if (res.status === "fulfilled" && res.value?.pairs) {
            for (const p of res.value.pairs) {
              const chain = p.chainId?.toLowerCase();
              const tokenAddr = p.baseToken?.address;
              if (!tokenAddr) continue;

              const profileMeta = profilesMap.get(tokenAddr.toLowerCase()) || {};

              let normalizedNetwork = "Solana";
              if (chain === "bsc") normalizedNetwork = "BSC";
              else if (chain === "robinhood" || p.dexId === "sherwood" || p.dexId === "pons") normalizedNetwork = "Robinhood";
              else if (chain === "base") normalizedNetwork = "Base";

              const pCreatedAt = p.pairCreatedAt ? Number(p.pairCreatedAt) : Date.now() - 3600000;
              const progressVal = Math.min(100, Math.max(15, Math.floor(((p.volume?.h24 || 5000) / 60000) * 100)));

              const isMigrated = p.dexId === "raydium" || p.dexId === "uniswap" || p.dexId === "pancakeswap";
              const isNew = Date.now() - pCreatedAt < 10800000; // < 3 hours
              const cat = isMigrated ? "migrated" : progressVal >= 60 ? "final_stretch" : isNew ? "new" : "trending";

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
                  decimals: chain === "solana" ? 9 : 18,
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

    // Dynamic Balanced Partitioning across the 3 columns
    let finalStretchTokens = deduplicated.filter(
      (l) => l.category === "final_stretch" || (l.progress >= 50 && l.category !== "migrated")
    );
    let migratedTokens = deduplicated.filter(
      (l) => l.category === "migrated" || l.launchpad === "raydium" || l.launchpad === "uniswap" || l.launchpad === "pancakeswap" || l.launchpad === "sherwood"
    );
    let newPairsTokens = deduplicated.filter(
      (l) => l.category === "new" || l.progress < 50
    );

    // Ensure every column has a rich pool of tokens by distributing remaining tokens
    if (finalStretchTokens.length < 15) {
      const extras = deduplicated.filter(
        (l) => !finalStretchTokens.some((f) => f.id === l.id) && l.category !== "migrated"
      );
      finalStretchTokens = [...finalStretchTokens, ...extras];
    }

    if (newPairsTokens.length < 15) {
      const extras = deduplicated.filter(
        (l) => !newPairsTokens.some((n) => n.id === l.id)
      );
      newPairsTokens = [...newPairsTokens, ...extras];
    }

    if (migratedTokens.length < 15) {
      const extras = deduplicated.filter(
        (l) => !migratedTokens.some((m) => m.id === l.id)
      );
      migratedTokens = [...migratedTokens, ...extras];
    }

    // Paginate per column
    const maxColumnLength = Math.max(
      finalStretchTokens.length,
      migratedTokens.length,
      newPairsTokens.length,
      deduplicated.length
    );
    const totalPages = Math.max(1, Math.ceil(maxColumnLength / itemsPerColumn));
    const startIndex = (page - 1) * itemsPerColumn;
    const endIndex = startIndex + itemsPerColumn;

    const getPageSlice = (arr: any[], start: number, end: number) => {
      if (arr.length === 0) return [];
      const slice = arr.slice(start, end);
      if (slice.length > 0) return slice;
      const modStart = start % arr.length;
      return arr.slice(modStart, modStart + (end - start));
    };

    const pagedFinalStretch = getPageSlice(finalStretchTokens, startIndex, endIndex);
    const pagedMigrated = getPageSlice(migratedTokens, startIndex, endIndex);
    const pagedNewPairs = getPageSlice(newPairsTokens, startIndex, endIndex);

    return Response.json({
      launches: deduplicated.slice(startIndex, endIndex),
      all_launches: deduplicated,
      terminal_columns: {
        final_stretch: pagedFinalStretch,
        migrated: pagedMigrated,
        new_pairs: pagedNewPairs,
      },
      column_counts: {
        final_stretch: finalStretchTokens.length,
        migrated: migratedTokens.length,
        new_pairs: newPairsTokens.length,
      },
      stats: {
        total_24h_volume: deduplicated.reduce((sum, l) => sum + (l.volume_24h || 0), 0),
        active_tokens_count: deduplicated.length,
      },
      pagination: {
        page,
        limit: itemsPerColumn,
        totalLaunches: deduplicated.length,
        totalPages,
      },
    });
  } catch (err) {
    console.error("[API] GET /api/launches/explore error:", err);
    return Response.json({ error: "Failed to fetch explore directory" }, { status: 500 });
  }
}
