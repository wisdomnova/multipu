import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
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
        <span className="font-mono text-[11px] text-text-dim uppercase tracking-widest">
          HTTP Status: 404
        </span>
      </div>

      {/* Center 404 Hero */}
      <div className="mx-auto w-full max-w-2xl py-20 text-center">
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-white/[0.03] border border-white/[0.08] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          <span className="font-mono text-[11px] uppercase tracking-widest text-text-secondary">
            404 Not Found
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight mb-4">
          Route does not exist on-chain.
        </h1>

        <p className="text-sm md:text-base text-text-secondary leading-relaxed font-normal max-w-lg mx-auto mb-10">
          The requested coordinate or transaction view could not be resolved in the multi-chain registry.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 font-mono text-xs">
          <Link
            href="/"
            className="px-6 py-3 rounded bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
          >
            Return Home &gt;
          </Link>
          <Link
            href="/dashboard/explore"
            className="px-6 py-3 rounded bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-colors"
          >
            Explore Tokens
          </Link>
          <Link
            href="/launch"
            className="px-6 py-3 rounded bg-white/[0.04] border border-white/[0.08] text-white hover:bg-white/[0.08] transition-colors"
          >
            Launch Token
          </Link>
        </div>

      </div>

      {/* Bottom Telemetry Bar */}
      <div className="mx-auto w-full max-w-[1200px] pt-6 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-text-dim">
        <div>
          Cluster Verification: Active
        </div>
        <div>
          Multipu Network Node 0.1.0
        </div>
      </div>

    </div>
  );
}
