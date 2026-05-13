import { getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { assertTrustedOrigin } from "@/lib/request-security";
import { isAdminPanelLoggedIn } from "@/lib/admin-session";
import { createAdminSupabase } from "@/lib/supabase/server";
import { logAdminAudit } from "@/lib/security";
import { APP_PHASE, SOLANA_NETWORK } from "@/lib/runtime-config";

export async function GET(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) {
    return Response.json({ error: originError }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const hasAccess = await isAdminPanelLoggedIn();
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const supabase = createAdminSupabase();
    const { data: override } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "app_phase_override")
      .maybeSingle();

    const overrideValue = override?.value as { appPhase?: string } | undefined;
    const appPhase = overrideValue?.appPhase || APP_PHASE;

    const settings = {
      appPhase,
      solanaNetwork: SOLANA_NETWORK,
      mainnetLaunchesEnabled: process.env.ENABLE_MAINNET_LAUNCHES === "true",
      evmLaunchesEnabled: process.env.ENABLE_EVM_LAUNCH_ADAPTERS === "true",
    };

    return Response.json({ settings });
  } catch (err) {
    console.error("[API] GET /api/admin/network-settings error:", err);
    return Response.json({ error: "Failed to fetch network settings" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) {
    return Response.json({ error: originError }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const hasAccess = await isAdminPanelLoggedIn();
  if (!hasAccess) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { appPhase } = body;

    if (!["testnet", "mainnet"].includes(appPhase)) {
      return Response.json({ error: "Invalid app phase" }, { status: 400 });
    }

    const supabase = createAdminSupabase();

    // Store the override in admin_settings
    await supabase.from("admin_settings").upsert(
      {
        key: "app_phase_override",
        value: { appPhase },
        updated_by_wallet: "admin-password",
      },
      { onConflict: "key" }
    );

    // Log the change
    await logAdminAudit("admin-password", "update_launch_controls", {
      action: "app_phase_override",
      newPhase: appPhase,
    }, ip);

    const settings = {
      appPhase,
      solanaNetwork: SOLANA_NETWORK,
      mainnetLaunchesEnabled: process.env.ENABLE_MAINNET_LAUNCHES === "true",
      evmLaunchesEnabled: process.env.ENABLE_EVM_LAUNCH_ADAPTERS === "true",
    };

    return Response.json({ settings, ok: true });
  } catch (err) {
    console.error("[API] PATCH /api/admin/network-settings error:", err);
    return Response.json(
      { error: "Failed to update network settings" },
      { status: 500 }
    );
  }
}
