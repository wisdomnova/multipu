"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/protocol-fee", label: "Protocol Fee" },
  { href: "/admin/launch-controls", label: "Launch Controls" },
  { href: "/admin/security", label: "Security" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-64 border-r border-border p-4 space-y-2">
        <h2 className="text-lg font-semibold mb-4">Admin</h2>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block px-3 py-2 text-sm border",
              pathname === item.href
                ? "border-accent/30 bg-accent/10 text-accent"
                : "border-border text-text-secondary hover:text-text-primary"
            )}
          >
            {item.label}
          </Link>
        ))}
        <button
          onClick={async () => {
            await fetch("/api/admin/auth/session", { method: "DELETE" });
            router.push("/admin/login");
          }}
          className="mt-6 w-full px-3 py-2 text-sm border border-border text-text-secondary hover:text-text-primary"
        >
          Sign out
        </button>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
