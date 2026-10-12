import { calculatePricing, resolveAdvancePercent } from "@/lib/pricing";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { publicBookingRef, sanitizePlainText } from "@/lib/utils";
import { checkoutSchema, fieldErrorsFromZod } from "@/lib/validation";
import { getPaymentProvider, getPublicRazorpayKey } from "@/lib/payments";
import { canAcceptBooking } from "@/lib/catalog";
import type { BookingCampaign, Product } from "@/types";

export async function createCheckoutSession(input: unknown, ip: string) {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return {
      error: "Please check the highlighted fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
      status: 400 as const,
    };
  }
  const data = parsed.data;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      error: "Payments are not configured yet. Please contact ImportNow on WhatsApp.",
      status: 503 as const,
    };
  }
  const supabase = createServiceSupabase();

  const { data: existing } = await supabase
    .from("payments")
    .select("id, provider_order_id, amount_paise, booking_id, status")
    .eq("idempotency_key", data.idempotencyKey)
    .maybeSingle();

  if (existing?.provider_order_id) {
    return {
      status: 200 as const,
      razorpayKeyId: getPublicRazorpayKey(),
      orderId: existing.provider_order_id,
      amountPaise: existing.amount_paise,
      bookingId: existing.booking_id,
      currency: "INR",
    };
  }

  const { data: productRow } = await supabase
    .from("products")
    .select("*, booking_campaigns(*)")
    .eq("id", data.productId)
    .maybeSingle();

  if (!productRow) {
    return { error: "This product is unavailable.", status: 404 as const };
  }

  const campaigns = (productRow.booking_campaigns ?? []) as BookingCampaign[];
  let campaign = campaigns.find((c) => c.is_current) ?? null;
  if (!campaign && productRow.is_active) {
    const { data: created } = await supabase
      .from("booking_campaigns")
      .insert({
        product_id: productRow.id,
        status: "OPEN",
        min_units: productRow.min_units ?? 5,
        booking_window_days: productRow.booking_window_days ?? 7,
        is_current: true,
      })
      .select()
      .single();
    campaign = created as BookingCampaign | null;
  }
  const product = { ...(productRow as Product), campaign };

  const bookable = canAcceptBooking(product);
  if (!bookable.ok) {
    return { error: bookable.reason ?? "Booking is closed.", status: 409 as const };
  }
  if (!campaign) {
    return { error: "Booking is closed.", status: 409 as const };
  }

  if (data.variantId) {
    const { data: variant } = await supabase
      .from("product_variants")
      .select("id")
      .eq("id", data.variantId)
      .eq("product_id", product.id)
      .eq("is_active", true)
      .maybeSingle();
    if (!variant) {
      return { error: "Selected option is unavailable.", status: 400 as const };
    }
  }

  const pricing = calculatePricing(
    Number(product.base_price_paise),
    data.quantity,
    Number(product.gst_percent),
    resolveAdvancePercent(product.advance_percent),
  );

  const provider = getPaymentProvider();
  if (!provider.isConfigured()) {
    return {
      error: "Payments are not configured yet. Please contact ImportNow on WhatsApp.",
      status: 503 as const,
    };
  }

  const bookingId = crypto.randomUUID();
  const publicRef = publicBookingRef(bookingId);

  const { error: bookingError } = await supabase.from("bookings").insert({
    id: bookingId,
    public_ref: publicRef,
    campaign_id: campaign.id,
    product_id: product.id,
    quantity: data.quantity,
    variant_id: data.variantId ?? null,
    customer_name: sanitizePlainText(data.customerName, 80),
    customer_mobile: sanitizePlainText(data.customerMobile, 15),
    customer_whatsapp: sanitizePlainText(data.customerWhatsapp, 15),
    customer_email: sanitizePlainText(data.customerEmail, 120),
    address_line: sanitizePlainText(data.addressLine, 200),
    city: sanitizePlainText(data.city, 80),
    state: sanitizePlainText(data.state, 80),
    pincode: sanitizePlainText(data.pincode, 6),
    base_amount_paise: pricing.basePaise,
    gst_amount_paise: pricing.gstPaise,
    total_amount_paise: pricing.totalPaise,
    advance_amount_paise: pricing.advancePaise,
    balance_amount_paise: pricing.balancePaise,
    gst_percent: pricing.gstPercent,
    status: "PENDING_PAYMENT",
  });

  if (bookingError) {
    return { error: "Unable to start checkout. Please try again.", status: 500 as const };
  }

  const order = await provider.createOrder({
    amountPaise: pricing.advancePaise,
    receipt: publicRef,
    notes: {
      booking_id: bookingId,
      product_id: product.id,
      ip,
    },
  });

  const { error: paymentError } = await supabase.from("payments").insert({
    booking_id: bookingId,
    provider: provider.name,
    provider_order_id: order.orderId,
    amount_paise: order.amountPaise,
    currency: order.currency,
    status: "CREATED",
    idempotency_key: data.idempotencyKey,
  });

  if (paymentError) {
    return { error: "Unable to start payment. Please try again.", status: 500 as const };
  }

  return {
    status: 200 as const,
    razorpayKeyId: getPublicRazorpayKey(),
    orderId: order.orderId,
    amountPaise: order.amountPaise,
    bookingId,
    publicRef,
    currency: order.currency,
    productName: product.name,
  };
}

export async function confirmPaymentFromGateway(input: {
  orderId: string;
  paymentId: string;
  payload?: unknown;
}) {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase.rpc("confirm_paid_booking", {
    p_provider_order_id: input.orderId,
    p_provider_payment_id: input.paymentId,
    p_raw_payload: input.payload ?? null,
  });
  if (error) {
    throw new Error(error.message);
  }
  return data as { ok: boolean; duplicate: boolean; booking_id: string; public_ref: string };
}
