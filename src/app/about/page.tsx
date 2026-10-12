import { SITE } from "@/lib/site";
import { generalWhatsAppUrl } from "@/lib/whatsapp";

export const metadata = {
  title: "About",
  description: "ImportNow is operated by VALCOR GLOBAL LLP and sources furniture directly from manufacturers in China.",
};

export default function AboutPage() {
  return (
    <article className="container-page max-w-3xl py-10 lg:py-14">
      <p className="eyebrow">The company</p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">About ImportNow</h1>
      <p className="mt-5 text-lg leading-8 text-[#3f3a36]">
        ImportNow sources furniture directly from manufacturers in China and offers it through a group booking model,
        so the price stays closer to the factory than to a showroom.
      </p>
      <div className="mt-8 space-y-4 text-base leading-7">
        <p>
          The customer-facing brand is {SITE.brand}. It is operated by {SITE.legalName}, GSTIN {SITE.gstin}.
        </p>
        <p>
          Registered address: {SITE.addressLines.join(", ")}. Warehouse pickup is at {SITE.pickupLines.join(", ")}.
          Pan-India delivery can be arranged, and shipping is charged separately.
        </p>
        <p>
          A booking is the advance shown on that product. On selected pieces it is 10% of the GST-inclusive price. The supplier order is placed when at least 5 units
          of that product are booked. If the seven-day window closes before the threshold is reached, successful
          advances for that campaign are refunded.
        </p>
        <p>
          Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> or{" "}
          <a href={generalWhatsAppUrl()}>WhatsApp {SITE.whatsappDisplay}</a>.
        </p>
      </div>
    </article>
  );
}
