/**
 * Launchpad registry.
 *
 * Central access point for all launchpad services.
 * Import this instead of individual modules.
 */

import { meteoraService } from "./meteora";
import { bagsService } from "./bags";
import { pumpfunService } from "./pumpfun";
import { fourmemeService } from "./fourmeme";
import { basememeService } from "./basememe";
import type { LaunchpadService } from "./types";

export type { LaunchConfig, LaunchResult, LaunchpadService } from "./types";

export const launchpads: Record<string, LaunchpadService> = {
  meteora: meteoraService,
  bags: bagsService,
  pumpfun: pumpfunService,
  fourmeme: fourmemeService,
  basememe: basememeService,
};

export function getLaunchpad(id: string): LaunchpadService | null {
  return launchpads[id] || null;
}

export const LAUNCHPAD_META = [
  {
    id: "meteora" as const,
    name: "Meteora",
    description: "Dynamic liquidity pools & DLMM. Professional token launches.",
    image: "/meteora.png",
    estimatedFee: "~0.5 SOL",
    network: "Solana",
    ready: true,
  },
  {
    id: "bags" as const,
    name: "Bags",
    description: "Community-driven, meme-friendly. Built for the culture.",
    image: "/bags.png",
    estimatedFee: "~0.3 SOL",
    network: "Solana",
    ready: true,
  },
  {
    id: "pumpfun" as const,
    name: "Pump.fun",
    description: "Viral bonding curves. Instant tradability and massive reach.",
    image: "/pumpfun.png",
    estimatedFee: "~0.02 SOL",
    network: "Solana",
    ready: true,
  },
  {
    id: "fourmeme" as const,
    name: "Four.meme",
    description: "BNB Chain meme launchpad with fair-launch mechanics.",
    image: "/bags.png",
    estimatedFee: "~0.005 BNB",
    network: "BNB Smart Chain",
    ready: true,
  },
  {
    id: "basememe" as const,
    name: "Base.meme",
    description: "Community launch platform in the Base ecosystem.",
    image: "/pumpfun.png",
    estimatedFee: "~network gas",
    network: "Base",
    ready: true,
  },
] as const;
