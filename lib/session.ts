import { SessionOptions } from "iron-session";

/**
 * Session data shape — what we store in the encrypted cookie.
 * Contains wallet address and a version counter for revocation.
 */
export interface SessionData {
  walletAddress: string;
  walletKind: "solana" | "evm";
  v: number; // token version — increment in DB to revoke all sessions
  isLoggedIn: boolean;
}

/**
 * Iron-session configuration.
 * The cookie is encrypted + signed, httpOnly, secure, SameSite=Lax.
 * No JS can read it. No DB needed per request. Revocable via version counter.
 */
export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "complex_password_at_least_32_characters_long_for_dev_only",
  cookieName: "multipu_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  },
};

/**
 * Default (empty) session — used when no session exists.
 */
export const defaultSession: SessionData = {
  walletAddress: "",
  walletKind: "solana",
  v: 0,
  isLoggedIn: false,
};
