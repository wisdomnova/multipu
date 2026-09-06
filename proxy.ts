import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge Proxy & Route Guard — runs BEFORE every request.
 *
 * Responsibilities:
 * 1. Protect /dashboard and /launch routes (session cookie must exist)
 * 2. Admin area access guard (admin session cookie)
 * 3. Add security headers and request tracing IDs
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ─── Auth Guard ──────────────────────────────────
  const protectedPrefixes = ["/dashboard", "/launch"];
  const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const sessionCookie = request.cookies.get("multipu_session");

    if (!sessionCookie?.value) {
      const loginUrl = new URL("/", request.url);
      loginUrl.searchParams.set("auth", "required");
      return NextResponse.redirect(loginUrl);
    }
  }

  // ─── Admin Guard (password session cookie) ─────────
  const isAdminLogin = pathname === "/admin/login";
  const isAdminArea = pathname.startsWith("/admin");
  const adminSessionCookie = request.cookies.get("multipu_admin_session");

  if (isAdminArea && !isAdminLogin && !adminSessionCookie?.value) {
    const loginUrl = new URL("/admin/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAdminLogin && adminSessionCookie?.value) {
    const adminUrl = new URL("/admin", request.url);
    return NextResponse.redirect(adminUrl);
  }

  // ─── Request Tracing & Security Headers ───────────
  const response = NextResponse.next();

  response.headers.set("x-request-id", crypto.randomUUID());

  return response;
}

// Backward-compatibility export for Next.js middleware runner
export const middleware = proxy;

export const config = {
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
