import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { advanceSharePercent, formatInrFromPaise } from "@/lib/pricing";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { createServiceSupabase, hasSupabaseConfig } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let booking = null;
  let product = null;
  let campaign = null;
  let payments = [];
  let refund = null;

  if (hasSupabaseConfig()) {
    try {
      const supabase = createServiceSupabase();
      const { data: bkg } = await supabase
        .from("bookings")
        .select("*, products(*), booking_campaigns(*)")
        .eq("id", id)
        .maybeSingle();

      if (bkg) {
        booking = bkg;
        product = bkg.products;
        campaign = bkg.booking_campaigns;

        // Fetch payments for this booking
        const { data: pmtData } = await supabase
          .from("payments")
          .select("*")
          .eq("booking_id", id);
        payments = pmtData ?? [];

        // Fetch refund if any
        const { data: refData } = await supabase
          .from("refunds")
          .select("*")
          .eq("booking_id", id)
          .maybeSingle();
        refund = refData ?? null;
      }
    } catch {
      // Fallback
    }
  }

  if (!booking) {
    notFound();
  }

  const waMessage = `Hi ${booking.customer_name}, this is ImportNow regarding your furniture booking ${booking.public_ref} for ${product?.name ?? "furniture"} (${booking.quantity} units).`;
  const waUrl = buildWhatsAppUrl(waMessage);
  const advanceShare = advanceSharePercent(booking.advance_amount_paise, booking.total_amount_paise);
  const balanceShare = 100 - advanceShare;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/admin/bookings"
          className="text-xs text-muted hover:text-ink inline-flex items-center gap-1 mb-1"
        >
          ← Back to All Bookings
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold">{booking.public_ref}</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                {booking.status}
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold mt-1">
              Booking Details
            </h1>
          </div>

          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary text-xs py-2 px-4"
          >
            💬 WhatsApp Customer
          </a>
        </div>
      </div>

      {/* Customer Profile Card */}
      <div className="card p-5 space-y-3">
        <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
          Customer & Delivery Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted block">Full Name:</span>
            <span className="font-semibold text-sm">{booking.customer_name}</span>
          </div>
          <div>
            <span className="text-muted block">Mobile / Phone:</span>
            <span className="font-semibold text-sm">{booking.customer_mobile}</span>
          </div>
          <div>
            <span className="text-muted block">Email Address:</span>
            <span className="font-semibold text-sm">{booking.customer_email}</span>
          </div>
          <div>
            <span className="text-muted block">WhatsApp Number:</span>
            <span className="font-semibold text-sm">{booking.customer_whatsapp}</span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-muted block">Delivery Address:</span>
            <span className="text-sm">
              {booking.address_line}, {booking.city}, {booking.state} - {booking.pincode}
            </span>
          </div>
        </div>
      </div>

      {/* Product & Financial Breakdown */}
      <div className="card p-5 space-y-3">
        <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
          Financial & Product Breakdown
        </h2>

        <div className="rounded-xl bg-[#efe7dc] p-4 text-xs space-y-2">
          <div className="flex justify-between text-sm font-bold">
            <span>
              {product?.name ?? "Product"} (SKU: {product?.sku})
            </span>
            <span>Quantity: {booking.quantity} unit(s)</span>
          </div>

          <div className="border-t border-line/60 pt-2 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-muted">Base Furniture Amount:</span>
              <span className="font-mono">{formatInrFromPaise(booking.base_amount_paise)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">GST ({booking.gst_percent}%):</span>
              <span className="font-mono">{formatInrFromPaise(booking.gst_amount_paise)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-line/60 pt-1 text-ink">
              <span>Total GST-Inclusive Order Value:</span>
              <span className="font-mono text-sm">{formatInrFromPaise(booking.total_amount_paise)}</span>
            </div>
          </div>
        </div>

        {/* 10% Advance vs 90% Balance */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="rounded-xl border border-accent bg-[#efe7dc]/50 p-4">
            <span className="text-xs uppercase tracking-wider text-muted font-bold block">
              {advanceShare}% Advance Collected
            </span>
            <span className="font-serif text-2xl font-bold text-accent mt-1 block">
              {formatInrFromPaise(booking.advance_amount_paise)}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              Paid via online payment gateway
            </span>
          </div>

          <div className="rounded-xl border border-line bg-card p-4">
            <span className="text-xs uppercase tracking-wider text-muted font-bold block">
              {balanceShare}% Balance Pending
            </span>
            <span className="font-serif text-2xl font-bold text-ink mt-1 block">
              {formatInrFromPaise(booking.balance_amount_paise)}
            </span>
            <span className="text-[11px] text-muted block mt-1">
              Payable after furniture arrives in Hyderabad
            </span>
          </div>
        </div>
      </div>

      {/* Payment Gateway Audit Data */}
      <div className="card p-5 space-y-3">
        <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
          Payment Gateway Record
        </h2>
        <div className="text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-muted">Booking Reference:</span>
            <span className="font-mono">{booking.public_ref}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Payment Status:</span>
            <span className="font-semibold">{booking.status}</span>
          </div>
          {campaign ? (
            <div className="flex justify-between">
              <span className="text-muted">Associated Campaign Status:</span>
              <span className="font-medium">{campaign.status}</span>
            </div>
          ) : null}
          <div className="flex justify-between">
            <span className="text-muted">Booking Timestamp:</span>
            <span>
              {new Date(booking.created_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "medium",
              })}
            </span>
          </div>
          {booking.paid_at ? (
            <div className="flex justify-between">
              <span className="text-muted">Paid Timestamp:</span>
              <span>
                {new Date(booking.paid_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "medium",
                })}
              </span>
            </div>
          ) : null}
          {payments.length > 0 ? (
            <div className="border-t border-line/60 pt-2 space-y-1">
              <span className="text-muted block font-semibold">Gateway Transactions:</span>
              {payments.map((p: { id: string; provider: string; provider_order_id: string | null; provider_payment_id: string | null; status: string }) => (
                <div key={p.id} className="rounded bg-[#efe7dc] p-2 space-y-0.5">
                  <div className="flex justify-between font-mono text-[11px]">
                    <span>Provider: {p.provider.toUpperCase()}</span>
                    <span>Status: {p.status}</span>
                  </div>
                  {p.provider_order_id ? (
                    <div className="text-muted text-[10px] font-mono">Order ID: {p.provider_order_id}</div>
                  ) : null}
                  {p.provider_payment_id ? (
                    <div className="text-muted text-[10px] font-mono">Payment ID: {p.provider_payment_id}</div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
          {refund ? (
            <div className="border-t border-line/60 pt-2 space-y-1">
              <span className="text-rose-700 block font-semibold">Refund Status:</span>
              <div className="rounded bg-rose-50 p-2 text-rose-800 text-[11px] space-y-0.5">
                <div>Status: {refund.status}</div>
                <div>Amount: {formatInrFromPaise(refund.amount_paise)}</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
