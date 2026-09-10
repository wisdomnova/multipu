"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconX, IconLogout, IconLoader2 } from "@tabler/icons-react";
import { scaleIn } from "@/components/motion";

interface DisconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  walletAddress?: string | null;
  walletKind?: string | null;
}

export function DisconnectModal({
  isOpen,
  onClose,
  onConfirm,
  walletAddress,
  walletKind,
}: DisconnectModalProps) {
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleConfirm = async () => {
    try {
      setIsDisconnecting(true);
      await onConfirm();
    } catch (err) {
      console.error("Disconnect error:", err);
    } finally {
      setIsDisconnecting(false);
      onClose();
    }
  };

  const formattedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="relative z-10 w-full max-w-md border border-border bg-[#0a0a0a] rounded-sm p-6 shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={isDisconnecting}
              className="absolute top-4 right-4 p-1.5 text-text-dim hover:text-text-primary hover:bg-white/[0.05] rounded-sm transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Close modal"
            >
              <IconX size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-sm bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <IconLogout size={18} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary tracking-tight">
                  Disconnect Session
                </h3>
                <p className="text-xs text-text-dim">
                  Confirm ending your active session
                </p>
              </div>
            </div>

            {/* Content & Account Summary */}
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Are you sure you want to disconnect? Your session will be invalidated and you will be redirected to the home page.
            </p>

            {formattedAddress && (
              <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-border rounded-sm mb-6">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
                  <span className="font-mono text-xs text-text-primary truncate">
                    {formattedAddress}
                  </span>
                </div>
                {walletKind && (
                  <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider bg-white/[0.04] px-2 py-0.5 rounded-sm">
                    {walletKind}
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isDisconnecting}
                className="px-4 py-2 text-xs font-mono border border-border text-text-secondary hover:text-text-primary hover:bg-white/[0.04] rounded-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isDisconnecting}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-mono font-semibold bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30 rounded-sm transition-colors cursor-pointer disabled:opacity-50"
              >
                {isDisconnecting ? (
                  <>
                    <IconLoader2 size={14} className="animate-spin" />
                    Disconnecting...
                  </>
                ) : (
                  <>
                    <IconLogout size={14} />
                    Disconnect
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
