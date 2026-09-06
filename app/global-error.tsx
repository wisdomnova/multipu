"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Critical global runtime error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col justify-between bg-[#040507] text-white selection:bg-accent/30 selection:text-white px-6 py-10 antialiased">
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
            Critical Failure
          </span>
        </div>

        {/* Center Content */}
        <div className="mx-auto w-full max-w-2xl py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-error/10 border border-error/20 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-error" />
            <span className="font-mono text-[11px] uppercase tracking-widest text-error">
              Root Level Exception
            </span>
          </div>

          <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight mb-4">
            System initialization fault.
          </h1>

          <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-lg mx-auto mb-8">
            A root-level runtime crash occurred. You can reload the application state or return to the main dashboard.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs">
            <button
              onClick={() => reset()}
              className="px-6 py-3 rounded bg-accent text-white font-medium hover:bg-accent-hover transition-colors cursor-pointer"
            >
              Reboot Runtime &gt;
            </button>
            <a
              href="/"
              className="px-6 py-3 rounded bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-colors"
            >
              Reload Application
            </a>
          </div>
        </div>

        {/* Bottom Telemetry Bar */}
        <div className="mx-auto w-full max-w-[1200px] pt-6 border-t border-white/[0.06] flex items-center justify-between font-mono text-[11px] text-text-dim">
          <div>Global Error Boundary</div>
          <div>Multipu 0.1.0</div>
        </div>
      </body>
    </html>
  );
}
