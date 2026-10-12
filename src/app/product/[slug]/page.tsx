import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingPanel } from "@/components/products/BookingPanel";
import { ProductGallery } from "@/components/products/ProductGallery";
import { customerCampaignCopy } from "@/lib/campaign";
import { getProductBySlug } from "@/lib/catalog";
import { isFileVideo } from "@/lib/media";
import { formatInrFromPaise, resolveAdvancePercent } from "@/lib/pricing";
import { getSiteUrl } from "@/lib/site";
import { requestTimeMs } from "@/lib/server-time";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product" };
  return {
    title: product.seo_title ?? product.name,
    description: product.seo_description ?? product.short_description ?? undefined,
    alternates: { canonical: `${getSiteUrl()}/product/${slug}` },
    openGraph: {
      title: product.name,
      description: product.short_description ?? undefined,
      images: product.images?.[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const serverNowMs = requestTimeMs();
  const description = product.full_description?.trim() || null;

  const advance = resolveAdvancePercent(product.advance_percent);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.short_description,
    image: product.images?.map((img) => img.url),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: (product.base_price_paise / 100).toFixed(2),
      availability: "https://schema.org/LimitedAvailability",
    },
  };

  return (
    <div className="container-page py-6 lg:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted">
        <Link href="/products" className="hover:text-ink">
          Furniture
        </Link>
        {product.category ? (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/category/${product.category.slug}`} className="hover:text-ink">
              {product.category.name}
            </Link>
          </>
        ) : null}
        <span aria-hidden="true">/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-12">
        <ProductGallery images={product.images ?? []} name={product.name} />
        <BookingPanel product={product} serverNowMs={serverNowMs} />
      </div>

      {product.video_url ? (
        <section className="mt-12">
          <h2 className="font-serif text-3xl">Product video</h2>
          <div className="mt-4 overflow-hidden bg-black">
            {isFileVideo(product.video_url) ? (
              <video src={product.video_url} controls className="aspect-video w-full" preload="metadata">
                <track kind="captions" />
              </video>
            ) : (
              <iframe
                title={`${product.name} video`}
                src={product.video_url}
                className="aspect-video w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>
        </section>
      ) : null}

      {description ? (
        <section className="mt-12 max-w-3xl">
          <h2 className="font-serif text-3xl">About this piece</h2>
          <p className="mt-4 whitespace-pre-line text-base leading-7 text-[#334155]">{description}</p>
        </section>
      ) : null}

      <section className="mt-12 max-w-3xl border-t border-line pt-8">
        <h2 className="font-serif text-3xl">Booking terms for this product</h2>
        <p className="mt-4 text-base leading-7 text-[#334155]">{customerCampaignCopy(product)}</p>
        <p className="mt-3 text-base leading-7 text-[#334155]">
          Pay {advance}% of the GST-inclusive price now. We place the supplier order when at least {product.min_units} units
          are booked. The booking window is {product.booking_window_days} days. The remaining {100 - advance}% is due after
          arrival in Hyderabad. Base price {formatInrFromPaise(product.base_price_paise)} excludes GST. Delivery beyond
          Tarnaka warehouse pickup is charged separately.
        </p>
      </section>
    </div>
  );
}
