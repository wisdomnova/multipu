import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { getAdminWallets, getLaunchControls, isAdminWallet } from "@/lib/admin";
import { getEnvironmentScope } from "@/lib/env-scope.server";
import {
  isEvmLaunchAllowedOnServer,
  isMainnetLaunchAllowedOnServer,
} from "@/lib/runtime-config.server";
import { isEvmLaunchpad } from "@/lib/launchpad-network";
import type { LaunchpadId } from "@/lib/supabase/database.types";

/**
 * GET /api/health/launch-policies
 *
 * Admin-only diagnostic endpoint for effective launch gating.
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
  if (!isAdminWallet(auth.walletAddress)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const scope = getEnvironmentScope();
  const controls = await getLaunchControls();
  const solanaGateOpen = isMainnetLaunchAllowedOnServer();
  const evmGateOpen = isEvmLaunchAllowedOnServer();

  const launchpadEffectiveState = Object.entries(
    controls.launchpadsEnabled
  ).reduce<Record<LaunchpadId, { configured: boolean; effective: boolean; reason: string }>>(
    (acc, [launchpad, configured]) => {
      const padId = launchpad as LaunchpadId;
      const isEvm = isEvmLaunchpad(padId);
      const gateOpen = isEvm ? evmGateOpen : solanaGateOpen;
      const effective =
        configured &&
        gateOpen &&
        !controls.launchesPaused;

      const reason = !configured
        ? "Disabled by admin launchpad setting"
        : controls.launchesPaused
        ? "Global launchesPaused is enabled"
        : !gateOpen
        ? isEvm
          ? "EVM gate closed (phase/mainnet/EVM flags)"
          : "Solana gate closed (phase/mainnet flags)"
        : "Enabled";

      acc[padId] = { configured, effective, reason };
      return acc;
    },
    {} as Record<LaunchpadId, { configured: boolean; effective: boolean; reason: string }>
  );

  return Response.json({
    scope,
    auth: {
      wallet: auth.walletAddress,
      walletKind: auth.walletKind,
      adminWalletsConfigured: getAdminWallets().length,
    },
    gates: {
      appPhase: scope.appPhase,
      solanaNetwork: scope.network,
      env: {
        ENABLE_MAINNET_LAUNCHES: process.env.ENABLE_MAINNET_LAUNCHES === "true",
        ENABLE_EVM_LAUNCH_ADAPTERS:
          process.env.ENABLE_EVM_LAUNCH_ADAPTERS === "true",
      },
      effective: {
        solanaLaunchesAllowed: solanaGateOpen,
        evmLaunchesAllowed: evmGateOpen,
      },
    },
    adminControls: {
      launchesPaused: controls.launchesPaused,
      allowlistMode: controls.allowlistMode,
      allowlistCount: controls.allowedWallets.length,
      launchpadsEnabled: controls.launchpadsEnabled,
    },
    launchpadEffectiveState,
    timestamp: new Date().toISOString(),
  });
}
