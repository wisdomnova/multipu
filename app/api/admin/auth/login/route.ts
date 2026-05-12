import { timingSafeEqual } from "crypto";
import { getClientIp } from "@/lib/auth";
import { adminAuthLimiter } from "@/lib/rate-limit";
import { assertTrustedOrigin } from "@/lib/request-security";
import { getAdminSession, setAdminPanelLogin } from "@/lib/admin-session";
import { isIpWhitelisted, logAdminAudit } from "@/lib/security";

function safeCompare(a: string, b: string) {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function POST(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) {
    return Response.json({ error: originError }, { status: 403 });
  }

  const ip = getClientIp(request);
  
  // Check IP whitelist
  if (!isIpWhitelisted(ip)) {
    await logAdminAudit("system", "suspicious_activity", {
      reason: "IP not whitelisted",
      ip,
    }, ip);
    return Response.json(
      { error: "Access denied. IP not authorized." },
      { status: 403 }
    );
  }

  if (!adminAuthLimiter.check(ip)) {
    await logAdminAudit("system", "suspicious_activity", {
      reason: "Rate limit exceeded",
      ip,
    }, ip);
    return Response.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429 }
    );
  }

  const configured = process.env.ADMIN_PANEL_PASSWORD;
  if (!configured) {
    return Response.json(
      { error: "ADMIN_PANEL_PASSWORD is not configured." },
      { status: 500 }
    );
  }

  const body = (await request.json()) as { password?: string };
  const provided = body.password ?? "";
  if (!provided) {
    return Response.json({ error: "Password is required." }, { status: 400 });
  }

  if (!safeCompare(provided, configured)) {
    await logAdminAudit("system", "suspicious_activity", {
      reason: "Invalid admin password attempt",
      ip,
    }, ip);
    return Response.json({ error: "Invalid password." }, { status: 401 });
  }

  const session = await getAdminSession();
  await setAdminPanelLogin(session, true);
  
  // Log successful login
  await logAdminAudit("admin-password", "admin_login", { ip }, ip);
  
  return Response.json({ ok: true, isAdminLoggedIn: true });
}
