"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console or error reporter
    console.error("Application runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#040507] text-white selection:bg-accent/30 selection:text-white px-6 py-10">
      
      {/* Top Header */}
      <div className="mx-auto w-full max-w-[1200px] flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative w-7 h-7 flex-shrink-0">
            <Image src="/logo.png" alt="Multipu" fill sizes="28px" className="object-contain" />
          </div>
          <span className="text-base font-bold tracking-tight text-white font-mono">
            Multipu
          </span>
        </Link>
        <span className="font-mono text-[11px] text-error uppercase tracking-widest">
          HTTP Status: 500
        </span>
      </div>

      {/* Center Error Content */}
      <div className="mx-auto w-full max-w-2xl py-20 text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-error/10 border border-error/20 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-error" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-error">
            Runtime Exception
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight mb-4">
          Transaction or render fault occurred.
        </h1>

        <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-lg mx-auto mb-8">
          The application encountered an unexpected runtime fault while processing this view. You can retry the operation or return to the main terminal.
        </p>

        {error.digest && (
          <div className="mb-8 p-3 rounded bg-black/60 border border-white/[0.08] inline-block font-mono text-xs text-text-dim">
            Error Digest: {error.digest}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs">
          <button
            onClick={() => reset()}
            className="px-6 py-3 rounded bg-accent text-white font-medium hover:bg-accent-hover transition-colors cursor-pointer"
          >
            Retry Execution &gt;
          </button>
          <Link
            href="/"
            className="px-6 py-3 rounded bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-colors"
          >
            Return to Terminal
          </Link>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-colors"
          >
            Open Dashboard
          </Link>
        </div>

      </div>

      {/* Bottom Telemetry Bar */}
      <div className="mx-auto w-full max-w-[1200px] pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-text-dim">
        <div>
          Exception Handler: Active
        </div>
        <div>
          Multipu Network Node 0.1.0
        </div>
      </div>

    </div>
  );
}
