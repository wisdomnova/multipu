import { getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { assertTrustedOrigin } from "@/lib/request-security";
import { isAdminPanelLoggedIn } from "@/lib/admin-session";
import { treasuryManager, type TreasuryChain } from "@/lib/treasury";
import { logAdminAudit } from "@/lib/security";

/**
 * Multi-Chain Treasury Management API - Server-side only
 * 
 * GET  /api/admin/treasury - Fetch treasury status & history for all chains
 * POST /api/admin/treasury/withdraw - Execute withdrawal (admin-only, rate-limited)
 */

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
    const transfers = await treasuryManager.getTransfersHistory();

    const solanaConfigured = treasuryManager.isConfigured("solana");
    const bscConfigured = treasuryManager.isConfigured("bsc");

    const solanaBalance = solanaConfigured ? await treasuryManager.getTreasuryBalance("solana") : 0;
    const bscBalance = bscConfigured ? await treasuryManager.getTreasuryBalance("bsc") : 0;

    return Response.json({
      treasury: {
        solana: {
          configured: solanaConfigured,
          address: treasuryManager.getTreasuryAddress("solana"),
          balanceSol: solanaBalance,
          provider: treasuryManager.getProvider("solana"),
        },
        bsc: {
          configured: bscConfigured,
          address: treasuryManager.getTreasuryAddress("bsc"),
          balanceBnb: bscBalance,
          provider: treasuryManager.getProvider("bsc"),
        },
        transfers,
      },
    });
  } catch (err) {
    console.error("[API] Treasury GET error:", err);
    return Response.json({ error: "Failed to fetch treasury data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

  const body = await request.json();
  const action = body.action || "withdraw";
  const chain = (body.chain || "solana").toLowerCase() as TreasuryChain;
  const recipient = body.recipientAddress || body.recipient;
  const rawAmount = body.amountNative ?? body.amountSol ?? body.amount;
  const amount = typeof rawAmount === "string" ? parseFloat(rawAmount) : Number(rawAmount);

  // Only withdraw action is supported via POST
  if (action !== "withdraw") {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  // Validate chain
  if (!["solana", "bsc"].includes(chain)) {
    return Response.json({ error: "Invalid chain. Must be solana or bsc" }, { status: 400 });
  }

  // Validate inputs
  if (!recipient || typeof recipient !== "string" || !recipient.trim()) {
    return Response.json({ error: "Invalid recipient address" }, { status: 400 });
  }

  if (isNaN(amount) || amount <= 0) {
    return Response.json({ error: "Invalid amount. Must be greater than 0" }, { status: 400 });
  }

  try {
    // Execute withdrawal (server-side signed via Privy Server Wallets or Keypair)
    const result = await treasuryManager.executeWithdrawal(
      chain,
      recipient.trim(),
      amount,
      "admin"
    );

    const currencySymbol = chain === "solana" ? "SOL" : "BNB";

    if (!result.success) {
      await logAdminAudit("admin", "suspicious_activity", {
        action: "treasury_withdrawal_failed",
        chain,
        reason: result.error,
        recipient: recipient.trim(),
        amount: `${amount} ${currencySymbol}`,
      }, ip);

      return Response.json(
        { error: result.error || "Withdrawal failed" },
        { status: 400 }
      );
    }

    // Log successful withdrawal
    await logAdminAudit("admin", "update_launch_controls", {
      action: "treasury_withdrawal",
      chain,
      recipient: recipient.trim(),
      amount: `${amount} ${currencySymbol}`,
      signature: result.signature,
    }, ip);

    return Response.json({
      ok: true,
      signature: result.signature,
      message: `Successfully transferred ${amount} ${currencySymbol} to ${recipient.trim()}`,
    });
  } catch (err: any) {
    console.error("[API] Treasury POST error:", err);
    return Response.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
