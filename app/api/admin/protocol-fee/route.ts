import { z } from "zod";
import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { assertTrustedOrigin } from "@/lib/request-security";
import { createAdminSupabase } from "@/lib/supabase/server";
import { isAdminWallet } from "@/lib/admin";
import { isAdminPanelLoggedIn } from "@/lib/admin-session";

const protocolFeeSchema = z.object({
  enabled: z.boolean(),
  mode: z.enum(["fixed", "hybrid"]),
  flatFeeUsd: z.coerce.number().min(0).max(10000),
  variableFeeBps: z.coerce.number().int().min(0).max(2000),
  freeLaunchesPerWallet: z.coerce.number().int().min(0).max(100),
  proMonthlyUsd: z.coerce.number().min(0).max(100000),
});

const defaultProtocolFee = {
  enabled: true,
  mode: "fixed" as const,
  flatFeeUsd: 9,
  variableFeeBps: 0,
  freeLaunchesPerWallet: 1,
  proMonthlyUsd: 99,
};

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const auth = await getAuth();
  const hasWalletAdmin = auth.isLoggedIn && isAdminWallet(auth.walletAddress);
  const hasPasswordAdmin = await isAdminPanelLoggedIn();
  if (!hasWalletAdmin && !hasPasswordAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = createAdminSupabase();
  const { data } = await supabase
    .from("admin_settings")
    .select("value")
    .eq("key", "protocol_fee")
    .maybeSingle();

  const stored =
    data?.value && typeof data.value === "object" && !Array.isArray(data.value)
      ? data.value
      : {};

  return Response.json({
    protocolFee: { ...defaultProtocolFee, ...stored },
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
  const hasWalletAdmin = auth.isLoggedIn && isAdminWallet(auth.walletAddress);
  const hasPasswordAdmin = await isAdminPanelLoggedIn();
  if (!hasWalletAdmin && !hasPasswordAdmin) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = protocolFeeSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createAdminSupabase();
  const actor = hasWalletAdmin ? auth.walletAddress : "admin-password";
  const { error: upsertError } = await supabase.from("admin_settings").upsert(
    {
      key: "protocol_fee",
      value: parsed.data,
      updated_by_wallet: actor,
    },
    { onConflict: "key" }
  );
  if (upsertError) {
    return Response.json({ error: "Failed to update protocol fee." }, { status: 500 });
  }

  const { error: auditError } = await supabase.from("admin_audit_logs").insert({
    wallet_address: actor,
    action: "update_protocol_fee",
    payload: parsed.data,
  });
  if (auditError) {
    return Response.json({ error: "Failed to write audit log." }, { status: 500 });
  }

  return Response.json({ ok: true, protocolFee: parsed.data });
}
