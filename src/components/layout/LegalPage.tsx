import { SITE } from "@/lib/site";

export function LegalPage({
  title,
  lede,
  children,
}: {
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="container-page max-w-3xl py-10 lg:py-14">
      <p className="eyebrow">{SITE.brand}</p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">{title}</h1>
      {lede ? <p className="mt-4 text-lg leading-8 text-[#334155]">{lede}</p> : null}
      <div className="mt-8 space-y-4 text-base leading-7 text-[#263449]">{children}</div>
      <p className="mt-12 border-t border-line pt-6 text-sm leading-6 text-muted">
        {SITE.brand} is a customer-facing brand operated by {SITE.legalName}. GSTIN {SITE.gstin}.{" "}
        {SITE.addressLines.join(", ")}. {SITE.email}. WhatsApp {SITE.whatsappDisplay}.
      </p>
    </article>
  );
}
