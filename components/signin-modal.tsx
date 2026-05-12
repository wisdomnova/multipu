"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const { wallets, connecting, select } = useWallet();
  const { connectEvmWallet, signInWithSolana, signInWithEvm, session } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Close modal when successfully signed in
  useEffect(() => {
    if (session.isLoggedIn) {
      const timer = setTimeout(() => {
        onClose();
        setSelectedMethod(null);
        setIsConnecting(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [session.isLoggedIn, onClose]);

  const handleSolanaSignIn = async () => {
    if (wallets.length === 0) {
      toast.error("No Solana wallet detected. Install Phantom or another compatible wallet.");
      return;
    }

    setSelectedMethod("solana");
    setIsConnecting(true);

    try {
      // Select wallet (prefer Phantom if available)
      const phantomWallet = wallets.find(w => w.adapter.name === "Phantom");
      const walletToSelect = phantomWallet?.adapter.name || wallets[0].adapter.name;
      
      select(walletToSelect);

      // Wait for wallet selection + connection
      await new Promise(resolve => setTimeout(resolve, 800));

      // Then sign in
      await signInWithSolana();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in with Solana";
      toast.error(message);
      setIsConnecting(false);
      setSelectedMethod(null);
    }
  };

  const handleBscSignIn = async () => {
    setSelectedMethod("bsc");
    setIsConnecting(true);

    try {
      // Connect and sign in
      await connectEvmWallet();
      await signInWithEvm();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to sign in with BSC";
      toast.error(message);
      setIsConnecting(false);
      setSelectedMethod(null);
    }
  };

  const handleGoogleOAuth = async () => {
    setSelectedMethod("google");
    setIsConnecting(true);
    try {
      // TODO: Implement Google OAuth
      toast.error("Google OAuth coming soon");
      setIsConnecting(false);
      setSelectedMethod(null);
    } catch {
      setIsConnecting(false);
      setSelectedMethod(null);
    }
  };

  const handleXOAuth = async () => {
    setSelectedMethod("x");
    setIsConnecting(true);
    try {
      // TODO: Implement X OAuth
      toast.error("X OAuth coming soon");
      setIsConnecting(false);
      setSelectedMethod(null);
    } catch {
      setIsConnecting(false);
      setSelectedMethod(null);
    }
  };

  const authMethods = [
    {
      id: "solana",
      label: "Solana Wallet",
      description: "Fast multi-chain deployment",
      onClick: handleSolanaSignIn,
      isPrimary: true,
      icon: <Wallet className="w-5 h-5 text-[#14F195]" />,
    },
    {
      id: "bsc",
      label: "BSC Wallet",
      description: "BNB Smart Chain networks",
      onClick: handleBscSignIn,
      isPrimary: true,
      icon: <Wallet className="w-5 h-5 text-[#F3BA2F]" />,
    },
    {
      id: "google",
      label: "Google Account",
      description: "Continue with Google",
      onClick: handleGoogleOAuth,
      isPrimary: false,
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
    },
    {
      id: "x",
      label: "X / Twitter",
      description: "Continue with X",
      onClick: handleXOAuth,
      isPrimary: false,
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.627l-5.1-6.614L2.896 21.75H.588l7.753-8.835L0 2.25h6.791l4.6 6.088 5.253-6.088zM17.15 19.812h1.828L5.97 4.11H4.036l13.114 15.702z" />
        </svg>
      ),
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="relative w-full max-w-[400px] pointer-events-auto">
              {/* Outer Glow */}
              <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-accent/10 rounded-[28px] blur-2xl opacity-50" />
              
              <div className="relative border border-white/10 rounded-3xl bg-[#0a0a0a] shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="relative px-8 pt-10 pb-6 text-center">
                  <button
                    onClick={onClose}
                    disabled={isConnecting}
                    className="absolute top-6 right-6 p-2 text-text-muted hover:text-white hover:bg-white/5 rounded-full transition-all"
                  >
                    <X size={18} />
                  </button>
                  
                  <h2 className="text-2xl font-bold text-white tracking-tight">Welcome back</h2>
                  <p className="text-[15px] text-text-secondary mt-2 leading-relaxed">
                    Choose a secure way to access <br/> your multipu dashboard
                  </p>
                </div>

                {/* Content */}
                <div className="px-8 pb-10">
                  <div className="flex flex-col gap-3">
                    {authMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={method.onClick}
                        disabled={isConnecting}
                        className={cn(
                          "relative group w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300",
                          "border border-white/[0.05] hover:border-white/20",
                          "bg-white/[0.02] hover:bg-white/[0.06]",
                          "disabled:opacity-50 disabled:cursor-not-allowed"
                        )}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-white/10 transition-colors">
                          {isConnecting && selectedMethod === method.id ? (
                            <Loader2 size={20} className="animate-spin text-accent" />
                          ) : (
                            method.icon
                          )}
                        </div>
                        
                        <div className="flex-1 text-left">
                          <div className="text-[15px] font-semibold text-white">
                            {method.label}
                          </div>
                          <div className="text-[13px] text-text-muted mt-0.5">
                            {method.description}
                          </div>
                        </div>

                        {/* Hover arrow */}
                        <div className="opacity-0 group-hover:opacity-100 translate-x-1 group-hover:translate-x-0 transition-all text-white/30">
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-white/[0.05] bg-white/[0.02]">
                  <p className="text-[12px] text-text-muted text-center leading-relaxed px-4">
                    By accessing, you agree to our <span className="text-white hover:underline cursor-pointer">Terms</span> and acknowledge our <span className="text-white hover:underline cursor-pointer">Privacy Policy</span>
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
