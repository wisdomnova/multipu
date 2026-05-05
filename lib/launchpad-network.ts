import type { LaunchpadId } from "@/lib/supabase/database.types";

export function isEvmLaunchpad(launchpad: LaunchpadId) {
  return launchpad === "fourmeme" || launchpad === "basememe";
}

export function isSolanaLaunchpad(launchpad: LaunchpadId) {
  return !isEvmLaunchpad(launchpad);
}

export function getLaunchpadChainNetwork(launchpad: LaunchpadId) {
  if (launchpad === "fourmeme") return "bsc";
  if (launchpad === "basememe") return "base";
  return null;
}
