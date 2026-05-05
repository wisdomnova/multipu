"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { SessionData, defaultSession } from "@/lib/session";

interface AuthContextType {
  session: SessionData;
  isLoading: boolean;
  evmAddress: string | null;
  evmConnected: boolean;
  connectEvmWallet: () => Promise<string>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: defaultSession,
  isLoading: true,
  evmAddress: null,
  evmConnected: false,
  connectEvmWallet: async () => "",
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
  const [evmAddress, setEvmAddress] = useState<string | null>(null);

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

  const connectEvmWallet = useCallback(async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      throw new Error("No EVM wallet detected. Install MetaMask or a compatible wallet.");
    }
    const ethereum = (window as Window & { ethereum?: { request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown> } }).ethereum;
    if (!ethereum) {
      throw new Error("No EVM wallet detected. Install MetaMask or a compatible wallet.");
    }
    const accounts = (await ethereum.request({
      method: "eth_requestAccounts",
    })) as string[];

    const address = accounts[0];
    if (!address) {
      throw new Error("No EVM wallet account available.");
    }
    setEvmAddress(address);
    return address;
  }, []);

  // Sign in: challenge → sign → verify
  const signIn = useCallback(async () => {
    try {
      // Prefer SIWS when Solana wallet signing is available.
      if (publicKey && signMessage) {
        const challengeRes = await fetch("/api/auth/challenge");
        const { nonce } = await challengeRes.json();

        const message = new TextEncoder().encode(nonce);
        const signatureBytes = await signMessage(message);

        const bs58 = await import("bs58");
        const signature = bs58.default.encode(signatureBytes);

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
      } else {
        // Fallback to SIWB using EVM wallet.
        const walletAddress = evmAddress ?? (await connectEvmWallet());
        const ethereum = (window as Window & { ethereum?: { request: (args: { method: string; params?: unknown[] | object }) => Promise<unknown> } }).ethereum;
        if (typeof window === "undefined" || !ethereum) {
          throw new Error("No EVM wallet provider available.");
        }

        const challengeRes = await fetch("/api/auth/challenge-evm");
        const challenge = await challengeRes.json();
        if (!challengeRes.ok) {
          throw new Error(challenge.error || "Failed to get EVM challenge");
        }

        const message = [
          `${challenge.domain} wants you to sign in with your Ethereum account:`,
          walletAddress,
          "",
          challenge.statement,
          "",
          `URI: ${challenge.uri}`,
          "Version: 1",
          `Chain ID: ${challenge.chainId}`,
          `Nonce: ${challenge.nonce}`,
        ].join("\n");

        const signature = (await ethereum.request({
          method: "personal_sign",
          params: [message, walletAddress],
        })) as string;

        const verifyRes = await fetch("/api/auth/verify-evm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            walletAddress,
            message,
            signature,
          }),
        });

        if (!verifyRes.ok) {
          const err = await verifyRes.json();
          throw new Error(err.error || "EVM verification failed");
        }
      }

      // Refresh session state
      await fetchSession();
    } catch (error) {
      console.error("[AUTH] Sign-in error:", error);
      throw error;
    }
  }, [publicKey, signMessage, fetchSession, evmAddress, connectEvmWallet]);

  // Sign out: destroy session + disconnect wallet
  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/session", { method: "DELETE" });
      setSession(defaultSession);
      setEvmAddress(null);
      await disconnect();
    } catch (error) {
      console.error("[AUTH] Sign-out error:", error);
    }
  }, [disconnect]);

  return (
    <AuthContext.Provider
      value={{
        session,
        isLoading,
        evmAddress,
        evmConnected: Boolean(evmAddress),
        connectEvmWallet,
        signIn,
        signOut,
      }}
    >
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
