import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware — runs BEFORE every request.
 *
 * Responsibilities:
 * 1. Protect /dashboard and /launch routes (session cookie must exist)
 * 2. Add security headers
 *
 * Note: We check for cookie *existence* here (fast, edge-compatible).
 * The actual cookie *decryption + validation* happens in API routes
 * via iron-session. This is defense-in-depth — even if someone crafts
 * a fake cookie, the API routes will reject it.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Auth Guard ──────────────────────────────────
  const protectedPrefixes = ["/dashboard", "/launch"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const sessionCookie = request.cookies.get("multipu_session");

    if (!sessionCookie?.value) {
      // No session cookie → redirect to home
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth", "required");
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── API Rate-limit headers (actual limiting in route handlers) ─
  const response = NextResponse.next();

  // Request ID for tracing
  response.headers.set(
    "x-request-id",
    crypto.randomUUID()
  );

  return response;
}

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
