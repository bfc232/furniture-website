import fs from "node:fs";
import path from "node:path";
import Image from "next/image";
import Link from "next/link";
import { HeroCarousel, type HeroSlide } from "@/components/home/HeroCarousel";
import { ProductGrid } from "@/components/products/ProductGrid";
import { listCategories, listProducts } from "@/lib/catalog";
import { categoryImage, isPhotoUrl } from "@/lib/media";
import { formatInrFromPaise, resolveAdvancePercent } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { generalWhatsAppUrl } from "@/lib/whatsapp";

function bannerFile(baseName: string): string | null {
  for (const extension of ["jpg", "jpeg", "png", "webp"]) {
    const filename = `${baseName}.${extension}`;
    const filePath = path.join(process.cwd(), "public", "images", "banners", filename);
    if (fs.existsSync(filePath)) return `/images/banners/${filename}`;
  }
  return null;
}

function heroSlides(): HeroSlide[] {
  return [
    {
      desktop: bannerFile("banner-1-desktop") ?? "/images/hero.jpg",
      mobile: bannerFile("banner-1-mobile"),
      title: "Buy furniture from China together.",
      href: "/how-it-works",
    },
    {
      desktop: bannerFile("banner-2-desktop") ?? "/images/dining-detail.jpg",
      mobile: bannerFile("banner-2-mobile"),
      title: "Buy furniture from China together at factory prices.",
      href: "/products",
    },
  ];
}

export default async function HomePage() {
  const [featured, products, categories] = await Promise.all([
    listProducts({ featured: true }),
    listProducts(),
    listCategories(),
  ]);

  const spotlight = featured[0] ?? products[0] ?? null;
  const discovery = products.filter((product) => product.id !== spotlight?.id).slice(0, 8);
  const spotlightPhoto =
    spotlight?.images?.find((image) => isPhotoUrl(image.url))?.url ??
    (spotlight?.category ? categoryImage(spotlight.category.slug) : "/images/hero.jpg");

  return (
    <div>
      <HeroCarousel slides={heroSlides()} />

      <section className="border-b border-line bg-card">
        <div className="container-page grid grid-cols-3 divide-x divide-line py-5">
          {[
            ["5 units", "Minimum group order"],
            ["Factory-direct", "Sourced from China"],
            ["Advance shown", "Set for each product"],
          ].map(([value, label]) => (
            <div key={value} className="px-2 text-center sm:px-6">
              <p className="text-sm font-bold text-ink sm:text-base">{value}</p>
              <p className="mt-1 text-[0.68rem] leading-4 text-muted sm:text-sm">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page py-14 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow text-emerald-800">Open group orders</p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Furniture booking now</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
              Join an active order, watch the green meter fill, and pay only the advance shown for that piece.
            </p>
          </div>
          <Link href="/products" className="btn btn-ghost !hidden shrink-0 sm:!inline-flex">
            View all furniture
          </Link>
        </div>
        <ProductGrid products={discovery.length ? discovery : products.slice(0, 8)} />
        <Link href="/products" className="btn btn-ghost mt-8 w-full sm:hidden">
          View all furniture
        </Link>
      </section>

      <section className="border-y border-line bg-[#eaf0f7]">
        <div className="container-page py-14 lg:py-20">
          <div className="max-w-2xl">
            <p className="eyebrow">The collection</p>
            <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Find furniture for every space</h2>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-[#dce5ef] shadow-sm"
              >
                  <Image
                    src={categoryImage(category.slug)}
                    alt={category.name}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3 text-white sm:p-5">
                    <h3 className="font-serif text-xl leading-tight sm:text-2xl">{category.name}</h3>
                    {category.description ? (
                      <p className="mt-1 hidden text-sm text-white/80 sm:block">{category.description}</p>
                    ) : null}
                  </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14 lg:py-20">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.5fr] lg:gap-14">
          <div>
            <p className="eyebrow">The booking model</p>
            <h2 className="mt-2 max-w-xl font-serif text-4xl sm:text-5xl">Simple from booking to pickup</h2>
            <p className="mt-4 max-w-md text-base leading-7 text-[#334155]">
              Each product has a seven-day booking window to reach the minimum quantity. Every amount and milestone is
              shown before you pay.
            </p>
          </div>
          <ol className="grid gap-3 sm:grid-cols-2">
          {[
            ["01", "Choose your furniture.", "Open a product, select a quantity, and review the GST-inclusive price."],
            ["02", "Pay the advance shown on the product.", "On selected pieces that is 10% of the GST-inclusive total. Other products ask for a different amount. No account is required."],
            ["03", "We order when at least 5 units are booked.", "Qualifying units are paid bookings plus recorded adjustments. Unpaid checkouts do not count."],
            ["04", "Expected in Hyderabad in 30–40 days.", "That estimate starts after the threshold is reached. Pickup is in Tarnaka. Shipping is charged separately."],
          ].map(([index, title, copy]) => (
            <li key={index} className="rounded-xl border border-line bg-card p-5 shadow-sm">
              <p className="text-sm font-bold text-emerald-700">{index}</p>
              <h3 className="mt-3 font-serif text-2xl leading-tight">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#475569]">{copy}</p>
            </li>
          ))}
          </ol>
        </div>
      </section>

      {spotlight ? (
        <section className="bg-ink py-14 text-white lg:py-20">
          <div className="container-page grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#132d4a]">
              <Image
                src={spotlightPhoto}
                alt={spotlight.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div className="lg:pr-10">
              <p className="eyebrow text-emerald-300">Featured group order</p>
              <h2 className="mt-2 font-serif text-4xl text-white md:text-5xl">{spotlight.name}</h2>
              <p className="mt-4 max-w-md text-base leading-7 text-slate-300">
                {spotlight.short_description ??
                  "A current group booking, priced before GST and open until the minimum quantity is reached."}
              </p>
              <p className="mt-5 text-xl">
                {formatInrFromPaise(spotlight.base_price_paise)}{" "}
                <span className="text-base text-slate-400">+ GST</span>
              </p>
              <p className="mt-2 text-sm font-semibold text-emerald-200">
                Pay {resolveAdvancePercent(spotlight.advance_percent)}% today
              </p>
              <Link href={`/product/${spotlight.slug}`} className="btn mt-6 bg-accent text-white hover:bg-accent-dark">
                View this piece
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      <section className="container-page py-14 lg:py-20">
        <div className="grid items-center overflow-hidden rounded-2xl border border-line bg-card shadow-sm lg:grid-cols-2">
          <div className="relative aspect-[4/3] bg-[#e5ebf2] lg:h-full lg:min-h-[25rem]">
            <Image
              src="/images/desks.jpg"
              alt="A timber meeting table in a naturally lit office interior"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          <div className="p-6 sm:p-10 lg:p-14">
          <p className="eyebrow">Why the price is lower</p>
          <h2 className="mt-2 font-serif text-4xl sm:text-5xl">Factory-direct sourcing</h2>
          <p className="mt-4 text-base leading-7 text-[#334155]">
            Showroom furniture carries layers of margin. ImportNow waits until a product reaches its minimum quantity,
            then places one order with the manufacturer in China. That is why the price is shown before GST, and why
            the advance is the percentage set on that product. On selected pieces it is 10% of the GST-inclusive total.
          </p>
          <p className="mt-3 text-base leading-7 text-[#334155]">
            If five units are not booked before the seven-day window closes, successful advances for that campaign are
            refunded.
          </p>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-ivory">
        <div className="container-page grid gap-4 py-14 md:grid-cols-2 lg:py-20">
          <div className="rounded-xl border border-line bg-white p-6 sm:p-8">
            <p className="eyebrow">Hyderabad pickup</p>
            <h2 className="mt-2 font-serif text-4xl">Warehouse pickup in Tarnaka</h2>
            <p className="mt-4 text-base leading-7 text-[#334155]">
              Collect your furniture from {SITE.pickupLines.join(", ")}. Pickup is included. We will contact you when
              the shipment is ready.
            </p>
          </div>
          <div className="rounded-xl border border-line bg-white p-6 sm:p-8">
            <p className="eyebrow">Outside Hyderabad</p>
            <h2 className="mt-2 font-serif text-4xl">Pan-India delivery</h2>
            <p className="mt-4 text-base leading-7 text-[#334155]">
              Delivery across India can be arranged. Shipping is charged separately and is not included in the
              furniture price or the booking advance.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-emerald-900 px-6 py-8 text-white shadow-lg sm:flex-row sm:items-center sm:px-10">
          <div>
            <h2 className="font-serif text-3xl">Ask about a piece</h2>
            <p className="mt-2 max-w-lg text-sm leading-6 text-emerald-50/80">
              WhatsApp {SITE.whatsappDisplay}. Include the product name if you already have one in mind.
            </p>
          </div>
          <a href={generalWhatsAppUrl()} className="btn shrink-0 bg-white text-emerald-950 hover:bg-emerald-50">
            WhatsApp ImportNow
          </a>
        </div>
      </section>
    </div>
  );
}
