"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/launch", label: "Launch" },
  { href: "/dashboard/explore", label: "Explore" },
  { href: "/dashboard/launches", label: "Launchpads" },
  { href: "/dashboard/api", label: "Docs" },
];

export function MinimalNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-colors duration-300",
        scrolled ? "bg-black/90 backdrop-blur-xl" : "bg-transparent"
      )}
    >
      <div className="mx-auto max-w-[1360px] px-6 md:px-12">
        <div className="flex h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-white">
            <span className="text-xl leading-none select-none text-accent">●</span>
            <span className="text-lg font-bold tracking-tight">multipu</span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <span>{link.label}</span>
                <span className="text-[10px] text-neutral-500 font-mono">⌵</span>
              </Link>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-neutral-400 hover:text-white transition-colors px-3 py-2"
            >
              Dashboard
            </Link>
            <Link
              href="/launch"
              className="px-5 py-2.5 text-sm font-semibold rounded-full bg-white text-black hover:bg-neutral-200 transition-colors cursor-pointer select-none"
            >
              Launch App
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-neutral-400 hover:text-white cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="md:hidden bg-black/95 px-6 py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-base font-medium text-neutral-300 hover:text-white py-2"
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-4 flex flex-col gap-3">
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className="text-center py-2.5 text-sm font-medium text-neutral-300 hover:text-white bg-neutral-900 rounded-full"
            >
              Dashboard
            </Link>
            <Link
              href="/launch"
              onClick={() => setMobileOpen(false)}
              className="text-center py-2.5 text-sm font-semibold text-black bg-white rounded-full"
            >
              Launch App
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
