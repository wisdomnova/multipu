import { getClientIp } from "@/lib/auth";
import { adminAuthLimiter } from "@/lib/rate-limit";
import { assertTrustedOrigin } from "@/lib/request-security";
import {
  defaultAdminSession,
  getAdminSession,
  isAdminPanelLoggedIn,
} from "@/lib/admin-session";

export async function GET(request: Request) {
  const ip = getClientIp(request);
  if (!adminAuthLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const isLoggedIn = await isAdminPanelLoggedIn();
  return Response.json({ isAdminLoggedIn: isLoggedIn });
}

export async function DELETE(request: Request) {
  const originError = assertTrustedOrigin(request);
  if (originError) {
    return Response.json({ error: originError }, { status: 403 });
  }

  const ip = getClientIp(request);
  if (!adminAuthLimiter.check(ip)) {
    return Response.json({ error: "Rate limited" }, { status: 429 });
  }

  const session = await getAdminSession();
  session.destroy();
  return Response.json(defaultAdminSession);
}
