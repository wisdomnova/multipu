import { getAuth, getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { createAdminSupabase } from "@/lib/supabase/server";
import { createTokenSchema, confirmTokenSchema } from "@/lib/validations";

/**
 * GET /api/tokens — List the current user's tokens.
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
    const { data: tokens, error } = await supabase
      .from("tokens")
      .select("*, launches(*)")
      .eq("wallet_address", auth.walletAddress)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return Response.json({ tokens: tokens ?? [] });
  } catch (err) {
    console.error("[API] GET /tokens error:", err);
    return Response.json({ error: "Failed to fetch tokens" }, { status: 500 });
  }
}

/**
 * POST /api/tokens — Create a token record (before on-chain mint).
 *
 * Body: { name, symbol, supply, decimals, description, imageUrl }
 * Returns: { token } with the new record (status: pending).
 *
 * After the client mints on-chain, call PATCH to confirm.
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
    const parsed = createTokenSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabase();

    // Get user ID
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("wallet_address", auth.walletAddress)
      .single();

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const { data: token, error } = await supabase
      .from("tokens")
      .insert({
        user_id: user.id,
        wallet_address: auth.walletAddress,
        name: parsed.data.name,
        symbol: parsed.data.symbol,
        supply: parsed.data.supply,
        decimals: parsed.data.decimals,
        description: parsed.data.description || null,
        image_url: parsed.data.imageUrl || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    return Response.json({ token }, { status: 201 });
  } catch (err) {
    console.error("[API] POST /tokens error:", err);
    return Response.json({ error: "Failed to create token" }, { status: 500 });
  }
}

/**
 * PATCH /api/tokens — Confirm an on-chain mint.
 *
 * Body: { tokenId, mintAddress, mintTx }
 * Updates the token record with on-chain data and sets status to active.
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
    const parsed = confirmTokenSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const supabase = createAdminSupabase();

    // Verify ownership
    const { data: token } = await supabase
      .from("tokens")
      .select("id")
      .eq("id", parsed.data.tokenId)
      .eq("wallet_address", auth.walletAddress)
      .single();

    if (!token) {
      return Response.json({ error: "Token not found" }, { status: 404 });
    }

    const { data: updated, error } = await supabase
      .from("tokens")
      .update({
        mint_address: parsed.data.mintAddress,
        mint_tx: parsed.data.mintTx,
        status: "active",
      })
      .eq("id", parsed.data.tokenId)
      .select()
      .single();

    if (error) throw error;
    return Response.json({ token: updated });
  } catch (err) {
    console.error("[API] PATCH /tokens error:", err);
    return Response.json({ error: "Failed to confirm token" }, { status: 500 });
  }
}
