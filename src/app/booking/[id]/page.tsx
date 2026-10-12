import Link from "next/link";
import { Countdown } from "@/components/products/Countdown";
import { campaignLabel, isThresholdReached, qualifyingUnits } from "@/lib/campaign";
import { getBookingForCustomer } from "@/lib/catalog";
import { advanceSharePercent, formatInrFromPaise } from "@/lib/pricing";
import { requestTimeMs } from "@/lib/server-time";

export const dynamic = "force-dynamic";

export default async function BookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pending?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  let data = null;
  try {
    data = await getBookingForCustomer(id);
  } catch {
    data = null;
  }

  if (!data?.booking) {
    return (
      <div className="container-page max-w-xl py-16">
        <h1 className="font-serif text-4xl">Booking not found</h1>
        <p className="mt-3 text-base leading-7 text-muted">
          If you just paid, wait a moment and refresh this page. A booking is confirmed only after server verification.
        </p>
        <Link href="/products" className="btn btn-primary mt-6">
          Browse furniture
        </Link>
      </div>
    );
  }

  const { booking, product, campaign } = data;
  const serverNowMs = requestTimeMs();
  const pending = query.pending === "1" && booking.status !== "PAID";
  const failed = booking.status === "PAYMENT_FAILED" || booking.status === "PENDING_PAYMENT";
  const refunding = booking.status === "REFUND_PENDING" || booking.status === "REFUNDED";
  const confirmed = booking.status === "PAID";
  const advanceShare = advanceSharePercent(booking.advance_amount_paise, booking.total_amount_paise);

  return (
    <div className="container-page max-w-xl py-10 lg:py-14">
      <p className="eyebrow">{booking.public_ref}</p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">
        {confirmed ? "Booking confirmed" : pending || failed ? "Payment not confirmed" : "Booking update"}
      </h1>
      {failed || pending ? (
        <p className="mt-4 text-base leading-7">
          Payment was not completed. This booking has not been confirmed and does not count toward the group order.
        </p>
      ) : null}
      {confirmed ? (
        <p className="mt-4 text-base leading-7">
          Your {advanceShare}% advance is recorded. The remaining balance is due after the furniture reaches Hyderabad.
        </p>
      ) : null}
      {refunding ? (
        <p className="mt-4 text-base leading-7">
          This group order did not reach the required quantity. Your advance is{" "}
          {booking.status === "REFUNDED" ? "refunded" : "being refunded"}.
        </p>
      ) : null}

      <div className="mt-8 space-y-3 border border-line bg-card p-5 text-sm leading-6">
        <p className="font-serif text-3xl">{product?.name ?? "Furniture"}</p>
        <p>Quantity: {booking.quantity}</p>
        {confirmed || refunding ? (
          <>
            <p>Paid today: {formatInrFromPaise(booking.advance_amount_paise)}</p>
            <p>Balance after arrival: {formatInrFromPaise(booking.balance_amount_paise)}</p>
          </>
        ) : (
          <p>Advance due if you complete payment: {formatInrFromPaise(booking.advance_amount_paise)}</p>
        )}
        {campaign ? (
          <>
            <p>
              Group order: {qualifyingUnits(campaign)} of {campaign.min_units} units
            </p>
            <p>Status: {campaignLabel(campaign.status)}</p>
            {!isThresholdReached(campaign) && campaign.status === "OPEN" ? (
              <Countdown endsAt={campaign.window_ends_at} serverNowMs={serverNowMs} />
            ) : null}
            {isThresholdReached(campaign) ? (
              <p>
                Expected arrival in Hyderabad: {product?.delivery_estimate ?? "30–40 days"} after the threshold. This is
                an estimate, not a guaranteed date.
              </p>
            ) : null}
          </>
        ) : null}
      </div>

      {failed || pending ? (
        <Link
          href={product?.slug ? `/checkout/${product.slug}?qty=${booking.quantity}` : "/products"}
          className="btn btn-primary mt-6 w-full"
        >
          Retry payment
        </Link>
      ) : null}
      <Link href={product?.slug ? `/product/${product.slug}` : "/products"} className="btn btn-ghost mt-3 w-full">
        Back to product
      </Link>
    </div>
  );
}
