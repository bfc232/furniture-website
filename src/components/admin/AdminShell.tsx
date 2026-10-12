"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { createBrowserSupabase } from "@/lib/supabase/client";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminShell({
  children,
  adminEmail,
}: {
  children: ReactNode;
  adminEmail?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoggingOut(true);
      const supabase = createBrowserSupabase();
      await supabase.auth.signOut();
      router.push("/admin/login");
      router.refresh();
    } catch {
      router.push("/admin/login");
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-ink pb-24 md:pb-10">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandMark />
            <span className="rounded-md bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
              Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden text-xs text-muted hover:text-ink md:inline-flex items-center gap-1"
            >
              <span>View Storefront</span>
              <span>↗</span>
            </Link>

            {adminEmail ? (
              <span className="hidden text-xs text-muted md:inline">
                {adminEmail}
              </span>
            ) : null}

            <button
              onClick={handleSignOut}
              disabled={loggingOut}
              className="text-xs font-medium text-accent hover:underline disabled:opacity-50"
            >
              {loggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        </div>

        {/* Desktop horizontal subnav */}
        <div className="hidden border-t border-line/60 bg-[#edf3f9] md:block">
          <div className="container-page flex items-center gap-6 overflow-x-auto py-2">
            {navItems.map((item) => {
              const isActive =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-sm font-medium py-1 transition-colors ${
                    isActive
                      ? "text-accent border-b-2 border-accent"
                      : "text-muted hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="container-page py-6 max-w-5xl">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white md:hidden">
        <div className="flex gap-1 overflow-x-auto px-3 py-2">
          {navItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-11 shrink-0 items-center px-3 text-sm ${
                  isActive ? "bg-ink font-semibold text-white" : "text-ink"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
