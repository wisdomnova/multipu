/**
 * Launchpad registry.
 *
 * Central access point for all launchpad services.
 * Import this instead of individual modules.
 */

import { meteoraService } from "./meteora";
import { bagsService } from "./bags";
import { pumpfunService } from "./pumpfun";
import type { LaunchpadService } from "./types";

export type { LaunchConfig, LaunchResult, LaunchpadService } from "./types";

export const launchpads: Record<string, LaunchpadService> = {
  meteora: meteoraService,
  bags: bagsService,
  pumpfun: pumpfunService,
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
  },
  {
    id: "bags" as const,
    name: "Bags",
    description: "Community-driven, meme-friendly. Built for the culture.",
    image: "/bags.png",
    estimatedFee: "~0.3 SOL",
  },
  {
    id: "pumpfun" as const,
    name: "Pump.fun",
    description: "Viral bonding curves. Instant tradability and massive reach.",
    image: "/pumpfun.png",
    estimatedFee: "~0.02 SOL",
  },
] as const;
