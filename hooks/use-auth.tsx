"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SessionData, defaultSession } from "@/lib/session";

interface AuthContextType {
  session: SessionData;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: defaultSession,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

/**
 * Auth provider — bridges Solana wallet adapter ↔ iron-session.
 *
 * Flow:
 * 1. Wallet connects (handled by wallet adapter)
 * 2. User clicks "Sign In" → signIn() runs
 * 3. GET /api/auth/challenge → nonce
 * 4. Wallet signs the nonce
 * 5. POST /api/auth/verify → encrypted cookie set
 * 6. Session state updates → UI reacts
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const [session, setSession] = useState<SessionData>(defaultSession);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch session on mount
  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setSession(data);
    } catch {
      setSession(defaultSession);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Sign in: challenge → sign → verify
  const signIn = useCallback(async () => {
    if (!publicKey || !signMessage) {
      throw new Error("Wallet not connected or doesn't support message signing");
    }

    try {
      // 1. Get challenge nonce
      const challengeRes = await fetch("/api/auth/challenge");
      const { nonce } = await challengeRes.json();

      // 2. Sign the nonce with wallet
      const message = new TextEncoder().encode(nonce);
      const signatureBytes = await signMessage(message);

      // 3. Encode signature as base58
      // Import bs58 dynamically to avoid SSR issues
      const bs58 = await import("bs58");
      const signature = bs58.default.encode(signatureBytes);

      // 4. Verify with server
      const verifyRes = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: publicKey.toBase58(),
          signature,
        }),
      });

      if (!verifyRes.ok) {
        const err = await verifyRes.json();
        throw new Error(err.error || "Verification failed");
      }

      // 5. Refresh session state
      await fetchSession();
    } catch (error) {
      console.error("[AUTH] Sign-in error:", error);
      throw error;
    }
  }, [publicKey, signMessage, fetchSession]);

  // Sign out: destroy session + disconnect wallet
  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      setSession(defaultSession);
      await disconnect();
    } catch (error) {
      console.error("[AUTH] Sign-out error:", error);
    }
  }, [disconnect]);

  return (
    <AuthContext.Provider value={{ session, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth state and actions.
 *
 * Usage:
 *   const { session, signIn, signOut, isLoading } = useAuth();
 *   if (session.isLoggedIn) { ... }
 */
export function useAuth() {
  return useContext(AuthContext);
}
