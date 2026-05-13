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
        },
        bsc: {
          configured: bscConfigured,
          address: treasuryManager.getTreasuryAddress("bsc"),
          balanceBnb: bscBalance,
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
  const { action, chain, recipientAddress, amountNative } = body;

  // Only withdraw action is supported via POST
  if (action !== "withdraw") {
    return Response.json({ error: "Invalid action" }, { status: 400 });
  }

  // Validate chain
  if (!["solana", "bsc"].includes(chain)) {
    return Response.json({ error: "Invalid chain" }, { status: 400 });
  }

  // Validate inputs
  if (!recipientAddress || typeof recipientAddress !== "string") {
    return Response.json({ error: "Invalid recipient address" }, { status: 400 });
  }

  if (!amountNative || typeof amountNative !== "number" || amountNative <= 0) {
    return Response.json({ error: "Invalid amount" }, { status: 400 });
  }

  try {
    // Execute withdrawal (server-side signed!)
    const result = await treasuryManager.executeWithdrawal(
      chain as TreasuryChain,
      recipientAddress,
      amountNative,
      "admin-password"
    );

    if (!result.success) {
      await logAdminAudit("admin-password", "suspicious_activity", {
        action: "treasury_withdrawal_failed",
        chain,
        reason: result.error,
        recipient: recipientAddress,
        amount: amountNative,
      }, ip);

      return Response.json(
        { error: result.error || "Withdrawal failed" },
        { status: 400 }
      );
    }

    // Log successful withdrawal
    const currencySymbol = chain === "solana" ? "SOL" : "BNB";
    await logAdminAudit("admin-password", "update_launch_controls", {
      action: "treasury_withdrawal",
      chain,
      recipient: recipientAddress,
      amount: `${amountNative} ${currencySymbol}`,
      signature: result.signature,
    }, ip);

    return Response.json({
      ok: true,
      signature: result.signature,
      message: `Withdrew ${amountNative} ${currencySymbol} to ${recipientAddress}`,
    });
  } catch (err) {
    console.error("[API] Treasury POST error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
