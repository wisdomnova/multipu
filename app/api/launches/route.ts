import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/server";
import { createLaunchSchema, confirmLaunchSchema } from "@/lib/validations";

/**
 * GET /api/launches — List the current user's launches.
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

  try {
    const supabase = createAdminSupabase();
    const { data: launches, error } = await supabase
      .from("launches")
      .select("*, tokens(name, symbol, mint_address)")
      .eq("wallet_address", auth.walletAddress)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json({ launches: launches ?? [] });
  } catch (err) {
    console.error("[API] GET /launches error:", err);
    return Response.json({ error: "Failed to fetch launches" }, { status: 500 });
  }
}

/**
 * POST /api/launches — Create a launch record (before on-chain deployment).
 *
 * Body: { tokenId, launchpad, initialLiquidity? }
 * Returns: { launch } with status: pending.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const auth = await getAuth();
  if (!auth.isLoggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createLaunchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabase();

    // Verify the token belongs to this user and is minted
    const { data: token } = await supabase
      .from("tokens")
      .select("id, user_id, status")
      .eq("id", parsed.data.tokenId)
      .eq("wallet_address", auth.walletAddress)
      .single();

    if (!token) {
      return Response.json({ error: "Token not found" }, { status: 404 });
    }

    if (token.status !== "active") {
      return Response.json(
        { error: "Token must be minted before launching" },
        { status: 400 }
      );
    }

    // Check for duplicate launch
    const { data: existing } = await supabase
      .from("launches")
      .select("id")
      .eq("token_id", parsed.data.tokenId)
      .eq("launchpad", parsed.data.launchpad)
      .single();

    if (existing) {
      return Response.json(
        { error: "Token already launched on this launchpad" },
        { status: 409 }
      );
    }

    const { data: launch, error } = await supabase
      .from("launches")
      .insert({
        token_id: parsed.data.tokenId,
        user_id: token.user_id,
        wallet_address: auth.walletAddress,
        launchpad: parsed.data.launchpad,
        initial_liquidity: parsed.data.initialLiquidity || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json({ launch }, { status: 201 });
  } catch (err) {
    console.error("[API] POST /launches error:", err);
    return Response.json({ error: "Failed to create launch" }, { status: 500 });
  }
}

/**
 * PATCH /api/launches — Confirm an on-chain launch.
 *
 * Body: { launchId, poolAddress, launchTx, initialLiquidity? }
 */
export async function PATCH(request: Request) {
  const ip = getClientIp(request);
  if (!apiLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const auth = await getAuth();
  if (!auth.isLoggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = confirmLaunchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabase();

    // Verify ownership
    const { data: launch } = await supabase
      .from("launches")
      .select("id")
      .eq("id", parsed.data.launchId)
      .eq("wallet_address", auth.walletAddress)
      .single();

    if (!launch) {
      return Response.json({ error: "Launch not found" }, { status: 404 });
    }

    const { data: updated, error } = await supabase
      .from("launches")
      .update({
        pool_address: parsed.data.poolAddress,
        launch_tx: parsed.data.launchTx,
        initial_liquidity: parsed.data.initialLiquidity || null,
        status: "live",
        launched_at: new Date().toISOString(),
      })
      .eq("id", parsed.data.launchId)
      .select()
      .single();

    if (error) throw error;
    return Response.json({ launch: updated });
  } catch (err) {
    console.error("[API] PATCH /launches error:", err);
    return Response.json({ error: "Failed to confirm launch" }, { status: 500 });
  }
}
