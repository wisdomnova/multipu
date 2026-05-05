import { timingSafeEqual } from "crypto";
import { getClientIp } from "@/lib/auth";
import { adminAuthLimiter } from "@/lib/rate-limit";
import { assertTrustedOrigin } from "@/lib/request-security";
import { getAdminSession, setAdminPanelLogin } from "@/lib/admin-session";

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
  if (!adminAuthLimiter.check(ip)) {
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
    return Response.json({ error: "Invalid password." }, { status: 401 });
  }

  const session = await getAdminSession();
  await setAdminPanelLogin(session, true);
  return Response.json({ ok: true, isAdminLoggedIn: true });
}
