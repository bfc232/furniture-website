"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { BrandMark } from "@/components/layout/BrandMark";
import { generalWhatsAppUrl } from "@/lib/whatsapp";
import type { Category } from "@/types";

export function Header({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false);
  const drawerId = useId();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/95 text-ink shadow-[0_1px_12px_rgba(15,35,60,0.04)] backdrop-blur-md">
      <div className="container-page grid h-16 grid-cols-[2.75rem_1fr_2.75rem] items-center lg:flex lg:h-[4.25rem] lg:gap-8">
        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center lg:hidden"
          aria-expanded={open}
          aria-controls={drawerId}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="flex w-5 flex-col gap-1.5">
            <span className="block h-px w-5 bg-ink" />
            <span className="block h-px w-5 bg-ink" />
            <span className="block h-px w-3.5 bg-ink" />
          </span>
        </button>

        <BrandMark className="justify-self-center lg:justify-self-auto" />

        <div className="hidden min-w-0 flex-1 items-center justify-end gap-3 lg:flex">
          <SearchForm className="w-56" />
          <a href={generalWhatsAppUrl()} className="btn btn-ghost px-4">
            WhatsApp
          </a>
        </div>

        <a
          href={generalWhatsAppUrl()}
          className="inline-flex h-11 w-11 items-center justify-center justify-self-end lg:hidden"
          aria-label="WhatsApp ImportNow"
        >
          <WhatsAppIcon />
        </a>
      </div>

      <nav className="hidden border-t border-line/70 bg-[#f8fafc] lg:block" aria-label="Furniture categories">
        <div className="container-page flex flex-wrap items-center gap-x-6 gap-y-2 py-3">
          <Link href="/products" className="text-sm font-semibold text-ink">
            All furniture
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="text-sm text-[#475569] transition-colors hover:text-accent"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </nav>

      {open ? (
        <div id={drawerId} className="fixed inset-0 z-50 bg-background lg:hidden">
          <div className="flex h-16 items-center justify-between px-5">
            <BrandMark />
            <button
              type="button"
              className="inline-flex h-11 items-center px-2 text-sm font-semibold"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <div className="h-[calc(100dvh-4rem)] overflow-y-auto px-5 pb-10">
            <SearchForm autoFocus onSubmit={() => setOpen(false)} />
            <div className="mt-8 flex flex-col gap-4 text-lg">
              <Link href="/products" onClick={() => setOpen(false)}>
                All furniture
              </Link>
              <Link href="/how-it-works" onClick={() => setOpen(false)}>
                How it works
              </Link>
              <Link href="/about" onClick={() => setOpen(false)}>
                About
              </Link>
              <Link href="/contact" onClick={() => setOpen(false)}>
                Contact
              </Link>
            </div>
            <p className="eyebrow mt-8">Categories</p>
            <div className="mt-4 flex flex-col">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/category/${category.slug}`}
                  className="border-t border-line py-3.5 text-base"
                  onClick={() => setOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
            </div>
            <a href={generalWhatsAppUrl()} className="btn btn-primary mt-8 w-full">
              WhatsApp {`+91 63058 22055`}
            </a>
          </div>
        </div>
      ) : null}
    </header>
  );
}

function SearchForm({
  className = "",
  autoFocus = false,
  onSubmit,
}: {
  className?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
}) {
  const inputId = useId();
  return (
    <form action="/products" className={className} onSubmit={onSubmit}>
      <label className="sr-only" htmlFor={inputId}>
        Search furniture
      </label>
      <input
        id={inputId}
        name="q"
        className="field"
        placeholder="Search furniture"
        autoFocus={autoFocus}
        enterKeyHint="search"
      />
    </form>
  );
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.15 6.4 2.15 11.83c0 1.74.46 3.45 1.33 4.95L2 22l5.38-1.4a10 10 0 0 0 4.66 1.18h.01c5.46 0 9.89-4.4 9.89-9.84C21.94 6.4 17.5 2 12.04 2Zm5.76 14.13c-.24.68-1.4 1.26-1.94 1.34-.49.07-1.12.1-1.81-.11-.42-.13-.95-.31-1.64-.6-2.89-1.25-4.77-4.15-4.92-4.35-.14-.2-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.78-.36h.56c.18 0 .42-.07.66.5.24.6.82 2.07.89 2.22.07.15.12.32.02.52-.1.2-.14.32-.28.5-.14.17-.3.39-.42.52-.14.15-.28.31-.12.6.16.29.7 1.15 1.5 1.86 1.03.91 1.9 1.2 2.19 1.34.29.13.46.11.63-.07.17-.17.73-.85.93-1.14.2-.29.39-.24.66-.14.27.1 1.72.81 2.01.96.29.14.49.22.56.34.07.13.07.74-.17 1.42Z" />
    </svg>
  );
}
