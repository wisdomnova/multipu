import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { assertTrustedOrigin } from "@/lib/request-security";
import { createAdminSupabase } from "@/lib/supabase/server";
import { getAdminWallets, getLaunchControls, isAdminWallet } from "@/lib/admin";
import { z } from "zod";

const launchControlsSchema = z.object({
  launchesPaused: z.boolean(),
  allowlistMode: z.boolean(),
  allowedWallets: z.array(z.string().trim().min(32).max(64)).max(1000),
  launchpadsEnabled: z.object({
    meteora: z.boolean(),
    bags: z.boolean(),
    pumpfun: z.boolean(),
    fourmeme: z.boolean(),
    basememe: z.boolean(),
  }),
});

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

  const controls = await getLaunchControls();
  return Response.json({
    controls,
    admins: getAdminWallets(),
  });
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

  const auth = await getAuth();
  if (!auth.isLoggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdminWallet(auth.walletAddress)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = launchControlsSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminSupabase();
    const controls = {
      ...parsed.data,
      allowedWallets: parsed.data.allowedWallets.map((wallet) => wallet.trim()),
    };

    const { error: upsertError } = await supabase.from("admin_settings").upsert(
      {
        key: "launch_controls",
        value: controls,
        updated_by_wallet: auth.walletAddress,
      },
      { onConflict: "key" }
    );

    if (upsertError) throw upsertError;

    const { error: auditError } = await supabase.from("admin_audit_logs").insert({
      wallet_address: auth.walletAddress,
      action: "update_launch_controls",
      payload: controls,
    });
    if (auditError) throw auditError;

    return Response.json({ controls, ok: true });
  } catch (err) {
    console.error("[API] PATCH /api/admin/settings error:", err);
    return Response.json({ error: "Failed to update admin settings" }, { status: 500 });
  }
}
