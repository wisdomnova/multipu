"use client";

import Link from "next/link";
import Image from "next/image";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10">
        <div className="flex flex-col md:flex-row items-center justify-between py-8 gap-4">
          {/* Logo + copy */}
          <div className="flex items-center gap-2.5">
            <span className="text-sm text-text-muted">
              © {new Date().getFullYear()} Multipu
            </span>
          </div>



          {/* Links */}
          <div className="flex items-center gap-6">
            {["Docs", "GitHub", "Twitter"].map((link) => (
              <Link
                key={link}
                href="#"
                className="font-mono text-xs text-text-muted hover:text-text-primary transition-colors"
              >
                {link}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
