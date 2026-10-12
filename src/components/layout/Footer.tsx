import Link from "next/link";
import { BrandMark } from "@/components/layout/BrandMark";
import { SITE } from "@/lib/site";
import { generalWhatsAppUrl } from "@/lib/whatsapp";
import type { Category } from "@/types";

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/contact", label: "Contact" },
  { href: "/shipping-delivery", label: "Shipping and delivery" },
];

const legalLinks = [
  { href: "/payment-terms", label: "Payment terms" },
  { href: "/refund-policy", label: "Refund policy" },
  { href: "/cancellation-policy", label: "Cancellation policy" },
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms-and-conditions", label: "Terms and conditions" },
];

export function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-20 border-t border-[#1f3857] bg-ink text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <BrandMark />
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">{SITE.tagline}</p>
          <p className="mt-5 text-sm leading-6">
            Operated by
            <br />
            <strong className="font-semibold">{SITE.legalName}</strong>
          </p>
          <p className="mt-2 text-sm text-slate-400">GSTIN {SITE.gstin}</p>
        </div>

        <div>
          <p className="eyebrow text-slate-400">Visit and pickup</p>
          <div className="mt-4 space-y-0.5 text-sm leading-6">
            {SITE.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6">
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <br />
            <a href={generalWhatsAppUrl()}>WhatsApp {SITE.whatsappDisplay}</a>
          </p>
        </div>

        <div>
          <p className="eyebrow text-slate-400">Furniture</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <Link href="/products" className="hover:text-accent">
              All furniture
            </Link>
            {categories.map((category) => (
              <Link key={category.id} href={`/category/${category.slug}`} className="hover:text-accent">
                {category.name}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="eyebrow text-slate-400">Company</p>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            {companyLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-accent">
                {link.label}
              </Link>
            ))}
            {legalLinks.map((link) => (
              <Link key={link.href} href={link.href} className="hover:text-accent">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[#1f3857]">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-slate-400 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.brand}. {SITE.legalName}.
          </p>
          <p>Factory-direct furniture. Group booking from Hyderabad.</p>
        </div>
      </div>
    </footer>
  );
}
