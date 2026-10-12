import Link from "next/link";
import { ProductPhoto } from "@/components/media/ProductPhoto";
import { BookingMeter } from "@/components/products/BookingMeter";
import { isThresholdReached, qualifyingUnits } from "@/lib/campaign";
import { formatInrFromPaise, resolveAdvancePercent } from "@/lib/pricing";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const image = product.images?.find((img) => img.is_primary) ?? product.images?.[0];
  const campaign = product.campaign;
  const booked = qualifyingUnits(campaign);
  const min = campaign?.min_units ?? product.min_units;
  const confirmed = isThresholdReached(campaign);
  const advance = resolveAdvancePercent(product.advance_percent);

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-line bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[#e5ebf2]">
        <ProductPhoto
          src={image?.url}
          alt={image?.alt_text ?? product.name}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex flex-1 flex-col p-4">
        {product.category?.name ? (
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.14em] text-muted">
            {product.category.name}
          </p>
        ) : null}
        <h3 className="mt-1 font-serif text-lg leading-tight text-ink group-hover:text-accent sm:text-[1.35rem]">
          {product.name}
        </h3>
        <p className="mt-2 text-[0.95rem] font-semibold">
          {formatInrFromPaise(product.base_price_paise)} <span className="font-medium text-muted">+ GST</span>
        </p>
        <p className="mt-1 text-sm font-bold text-emerald-800">Pay {advance}% today</p>
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-2.5">
          <BookingMeter booked={booked} min={min} confirmed={confirmed} compact />
        </div>
        <p className="mt-auto flex items-center justify-between pt-4 text-sm font-bold text-ink">
          <span>View product</span>
          <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
            →
          </span>
        </p>
      </div>
    </Link>
  );
}
