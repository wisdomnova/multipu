import "server-only";

/**
 * Basic CSRF protection for cookie-authenticated APIs.
 * Requires same-origin requests for mutating endpoints.
 */
export function assertTrustedOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const forwardedHost = request.headers.get("x-forwarded-host");
  const host = forwardedHost ?? request.headers.get("host");
  if (!host) return "Missing host header";

  const forwardedProto = request.headers.get("x-forwarded-proto");
  const proto =
    forwardedProto ?? new URL(request.url).protocol.replace(":", "");
  const expectedOrigin = `${proto}://${host}`;

  if (origin !== expectedOrigin) {
    return "Cross-origin request blocked";
  }

  return null;
}
