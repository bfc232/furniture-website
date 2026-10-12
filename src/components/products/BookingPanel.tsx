"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookingMeter } from "@/components/products/BookingMeter";
import { Countdown } from "@/components/products/Countdown";
import { QuantityStepper } from "@/components/products/QuantityStepper";
import {
  campaignLabel,
  canAcceptBooking,
  isThresholdReached,
  qualifyingUnits,
} from "@/lib/campaign";
import { calculatePricing, formatInrFromPaise, resolveAdvancePercent } from "@/lib/pricing";
import { buildWhatsAppUrl, productEnquiryMessage } from "@/lib/whatsapp";
import type { Product } from "@/types";

export function BookingPanel({
  product,
  serverNowMs,
}: {
  product: Product;
  serverNowMs?: number;
}) {
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState(product.variants?.[0]?.id ?? "");
  const campaign = product.campaign;
  const bookable = canAcceptBooking(product);
  const advance = resolveAdvancePercent(product.advance_percent);
  const pricing = useMemo(
    () => calculatePricing(product.base_price_paise, quantity, Number(product.gst_percent), advance),
    [advance, product.base_price_paise, product.gst_percent, quantity],
  );
  const booked = qualifyingUnits(campaign);
  const min = campaign?.min_units ?? product.min_units;
  const confirmed = isThresholdReached(campaign);
  const whatsapp = buildWhatsAppUrl(
    productEnquiryMessage({
      name: product.name,
      sku: product.sku,
      unitBasePaise: product.base_price_paise,
      paidUnits: booked,
      minUnits: min,
    }),
  );
  const checkoutHref = `/checkout/${product.slug}?qty=${quantity}${variantId ? `&variant=${variantId}` : ""}`;

  const specs = [
    product.material ? ["Material", product.material] : null,
    product.dimensions ? ["Dimensions", product.dimensions] : null,
    product.colour ? ["Colour", product.colour] : null,
  ].filter((row): row is [string, string] => Boolean(row));

  return (
    <div className="pb-28 lg:pb-0">
      <p className="eyebrow">{product.category?.name ?? "Furniture"}</p>
      <h1 className="mt-2 font-serif text-4xl leading-[1.05] md:text-5xl">{product.name}</h1>
      <p className="mt-4 text-2xl font-semibold">
        {formatInrFromPaise(product.base_price_paise)} <span className="text-base font-medium text-muted">+ GST</span>
      </p>
      <p className="mt-1 text-sm text-[#475569]">GST is {Number(product.gst_percent)}% of the base price.</p>
      <p className="mt-3 text-sm text-muted">SKU {product.sku}</p>

      {product.short_description ? (
        <p className="mt-5 max-w-xl text-base leading-7 text-[#334155]">{product.short_description}</p>
      ) : null}

      {specs.length > 0 ? (
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {specs.map(([label, value]) => (
            <div key={label} className="grid grid-cols-[8rem_1fr] gap-3 py-3 text-sm">
              <dt className="text-muted">{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-4">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Booking progress</p>
        <div className="mt-2">
          <BookingMeter booked={booked} min={min} confirmed={confirmed} />
        </div>
        <p className="mt-3 text-sm font-medium text-emerald-950">
          {campaign ? campaignLabel(campaign.status) : "Booking is not open."}
        </p>
        {confirmed ? (
          <p className="mt-2 text-sm leading-6">
            The countdown has stopped. Expected arrival in Hyderabad is {product.delivery_estimate} after the
            threshold was reached. This is an estimate, not a guaranteed delivery date.
          </p>
        ) : (
          <div className="mt-2">
            <Countdown endsAt={campaign?.window_ends_at ?? null} serverNowMs={serverNowMs} />
          </div>
        )}
      </div>

      {product.variants && product.variants.length > 0 ? (
        <label className="mt-6 block">
          <span className="label">Option</span>
          <select className="field" value={variantId} onChange={(event) => setVariantId(event.target.value)}>
            {product.variants.map((variant) => (
              <option key={variant.id} value={variant.id}>
                {variant.name}: {variant.value}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <div className="mt-6 border border-line bg-ivory p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="font-semibold">Quantity</p>
          <QuantityStepper value={quantity} onChange={setQuantity} />
        </div>
        <dl className="mt-5 space-y-2 text-sm">
          <Row label="Base price" value={formatInrFromPaise(pricing.basePaise)} />
          <Row label={`GST ${pricing.gstPercent}%`} value={formatInrFromPaise(pricing.gstPaise)} />
          <Row label="Total product price" value={formatInrFromPaise(pricing.totalPaise)} />
          <Row label={`Pay today (${pricing.advancePercent}%)`} value={formatInrFromPaise(pricing.advancePaise)} strong />
          <Row label={`Remaining balance (${100 - pricing.advancePercent}%)`} value={formatInrFromPaise(pricing.balancePaise)} />
        </dl>
        <p className="mt-4 text-sm leading-6 text-[#475569]">
          The {pricing.advancePercent}% advance is calculated on the GST-inclusive total. The remaining{" "}
          {100 - pricing.advancePercent}% is due after the furniture reaches Hyderabad.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {bookable.ok ? (
          <Link href={checkoutHref} className="btn btn-primary hidden w-full lg:inline-flex">
            Book with {advance}% advance
          </Link>
        ) : (
          <p className="rounded-lg border border-line bg-[#edf2f7] px-4 py-3 text-sm">{bookable.reason}</p>
        )}
        <a href={whatsapp} className="btn btn-ghost w-full">
          WhatsApp enquiry
        </a>
      </div>

      <p className="mt-4 text-sm leading-6 text-[#475569]">
        Book with {product.booking_window_days} days to reach {min} units. If the threshold is not reached, the
        advance is refunded. After the threshold is reached, the booking cannot be cancelled on the website. Arrival
        in Hyderabad is expected in {product.delivery_estimate} after the threshold — not a guaranteed date. Shipping
        beyond warehouse pickup is charged separately.
      </p>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-background/95 px-4 py-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{formatInrFromPaise(pricing.advancePaise)}</p>
            <p className="text-xs text-muted">{advance}% today · qty {quantity}</p>
          </div>
          <div className="ml-auto min-w-0 flex-1">
            {bookable.ok ? (
              <Link href={checkoutHref} className="btn btn-primary w-full px-3 text-sm">
                Book with {advance}% advance
              </Link>
            ) : (
              <p className="text-xs leading-5">{bookable.reason}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 ${strong ? "text-base font-semibold" : ""}`}>
      <dt>{label}</dt>
      <dd className="text-right">{value}</dd>
    </div>
  );
}
