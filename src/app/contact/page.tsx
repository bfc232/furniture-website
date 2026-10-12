import { SITE } from "@/lib/site";
import { generalWhatsAppUrl } from "@/lib/whatsapp";

export const metadata = {
  title: "Contact",
  description: "Contact ImportNow by WhatsApp or email. Pickup is in Tarnaka, Hyderabad.",
};

export default function ContactPage() {
  return (
    <article className="container-page py-10 lg:py-14">
      <p className="eyebrow">Contact</p>
      <h1 className="mt-2 max-w-xl font-serif text-4xl md:text-5xl">Talk to ImportNow</h1>
      <div className="mt-10 grid gap-10 md:grid-cols-2">
        <div>
          <h2 className="font-serif text-3xl">WhatsApp and email</h2>
          <p className="mt-3 text-base leading-7">
            The fastest way to ask about a product is WhatsApp. Include the product name and SKU if you have them.
          </p>
          <a href={generalWhatsAppUrl()} className="btn btn-primary mt-6">
            WhatsApp {SITE.whatsappDisplay}
          </a>
          <p className="mt-4 text-base">
            <a href={`mailto:${SITE.email}`}>{SITE.email}</a>
          </p>
        </div>
        <div>
          <h2 className="font-serif text-3xl">Address</h2>
          <div className="mt-3 text-base leading-7">
            {SITE.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          <p className="mt-4 text-sm leading-6 text-muted">
            {SITE.brand} is operated by {SITE.legalName}. GSTIN {SITE.gstin}. Warehouse pickup is at this Tarnaka
            address. Pan-India delivery is arranged separately.
          </p>
        </div>
      </div>
    </article>
  );
}
