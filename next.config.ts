import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // ─── Security Headers ──────────────────────────────
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://*.helius-rpc.com https://api.devnet.solana.com https://api.mainnet-beta.solana.com wss://*.solana.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // ─── Image Domains ─────────────────────────────────
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "arweave.net" },
      { protocol: "https", hostname: "**.ipfs.dweb.link" },
    ],
  },

  // ─── Performance ───────────────────────────────────
  poweredByHeader: false,
};

export default nextConfig;
