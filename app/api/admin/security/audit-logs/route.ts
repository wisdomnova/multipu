import { getClientIp } from "@/lib/auth";
import { apiLimiter } from "@/lib/rate-limit";
import { assertTrustedOrigin } from "@/lib/request-security";
import { isAdminPanelLoggedIn } from "@/lib/admin-session";
import { getRecentAuditLogs } from "@/lib/security";

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
    const logs = await getRecentAuditLogs(100);
    return Response.json({ logs });
  } catch (err) {
    console.error("[API] GET /api/admin/security/audit-logs error:", err);
    return Response.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
