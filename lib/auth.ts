import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import { sessionOptions, SessionData, defaultSession } from "./session";

/**
 * Server-side auth helper.
 *
 * Usage in API routes:
 *   const auth = await getAuth();
 *   if (!auth.isLoggedIn) return Response.json({ error: "Unauthorized" }, { status: 401 });
 *   // auth.walletAddress is now safe to use
 */
export async function getAuth(): Promise<SessionData> {
  try {
    const session = await getIronSession<SessionData>(
      await cookies(),
      sessionOptions
    );
    if (!session.isLoggedIn || !session.walletAddress) {
      return defaultSession;
    }
    return {
      walletAddress: session.walletAddress,
      isLoggedIn: session.isLoggedIn,
      v: session.v,
    };
  } catch {
    return defaultSession;
  }
}

/**
 * Helper to extract client IP from request headers.
 * Works on Vercel, Cloudflare, and direct connections.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real;
  return "unknown";
}
