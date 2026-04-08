"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/hooks/use-auth";
import { Wallet, LogOut, Loader2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Wallet connect / auth button.
 *
 * States:
 * 1. No wallet connected → "Connect Wallet" (triggers wallet adapter modal)
 * 2. Wallet connected but not signed in → "Sign In" (triggers SIWS flow)
 * 3. Signed in → shows truncated address with dropdown to disconnect
 */
export function WalletButton({ className }: { className?: string }) {
  const { select, wallets, publicKey, connected, connecting, disconnect } =
    useWallet();
  const { session, isLoading, signIn, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showWalletList, setShowWalletList] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 text-sm font-mono text-text-muted",
          className
        )}
      >
        <Loader2 size={14} className="animate-spin" />
      </div>
    );
  }

  // State 3: signed in
  if (session.isLoggedIn && connected) {
    const addr = session.walletAddress;
    const short = `${addr.slice(0, 4)}...${addr.slice(-4)}`;

    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 text-sm font-mono border border-border hover:border-border-hover bg-elevated hover:bg-elevated rounded-full transition-all",
            className
          )}
        >
          <div className="w-2 h-2 rounded-full bg-success" />
          <span className="text-text-primary">{short}</span>
          <ChevronDown
            size={12}
            className={cn(
              "text-text-muted transition-transform",
              showMenu && "rotate-180"
            )}
          />
        </button>

        {showMenu && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            {/* Dropdown */}
            <div className="absolute right-0 top-full mt-2 w-48 border border-border bg-background rounded-sm shadow-lg z-50 overflow-hidden">
              <div className="px-3 py-2 border-b border-border">
                <div className="font-mono text-xs text-text-muted">
                  Connected
                </div>
                <div className="font-mono text-xs text-text-primary truncate mt-0.5">
                  {addr}
                </div>
              </div>
              <button
                onClick={async () => {
                  setShowMenu(false);
                  await signOut();
                }}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
              >
                <LogOut size={14} />
                Disconnect
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  // State 2: wallet connected but not signed in
  if (connected && publicKey) {
    return (
      <button
        onClick={async () => {
          setIsSigningIn(true);
          try {
            await signIn();
          } catch {
            // Error already logged in hook
          } finally {
            setIsSigningIn(false);
          }
        }}
        disabled={isSigningIn}
        className={cn(
          "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.3)] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0",
          className
        )}
      >
        {isSigningIn ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Signing in...
          </>
        ) : (
          <>
            <Wallet size={14} />
            Sign In
          </>
        )}
      </button>
    );
  }

  // State 1: no wallet connected
  return (
    <div className="relative">
      <button
        onClick={() => {
          // If there are wallets available, try connecting the first one
          // otherwise show the wallet list
          if (wallets.length === 1) {
            select(wallets[0].adapter.name);
          } else {
            setShowWalletList(!showWalletList);
          }
        }}
        disabled={connecting}
        className={cn(
          "inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-accent hover:bg-accent-hover text-white rounded-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(139,92,246,0.3)] disabled:opacity-50",
          className
        )}
      >
        {connecting ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <Wallet size={14} />
            Connect Wallet
          </>
        )}
      </button>

      {/* Wallet selection dropdown */}
      {showWalletList && wallets.length > 1 && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowWalletList(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-56 border border-border bg-background rounded-sm shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 border-b border-border">
              <div className="font-mono text-xs text-text-muted">
                Select wallet
              </div>
            </div>
            {wallets.map((wallet) => (
              <button
                key={wallet.adapter.name}
                onClick={() => {
                  select(wallet.adapter.name);
                  setShowWalletList(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-text-secondary hover:text-text-primary hover:bg-elevated transition-colors"
              >
                {wallet.adapter.icon && (
                  <img
                    src={wallet.adapter.icon}
                    alt=""
                    className="w-5 h-5 rounded-sm"
                  />
                )}
                {wallet.adapter.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
