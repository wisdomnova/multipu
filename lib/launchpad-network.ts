import type { LaunchpadId } from "@/lib/supabase/database.types";

export function isEvmLaunchpad(launchpad: LaunchpadId) {
  return launchpad === "fourmeme";
}

export function isSolanaLaunchpad(launchpad: LaunchpadId) {
  return !isEvmLaunchpad(launchpad);
}

export function getLaunchpadChainNetwork(launchpad: LaunchpadId) {
  if (launchpad === "fourmeme") return "bsc";
  return null;
}
