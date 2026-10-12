import { NextRequest, NextResponse } from "next/server";
import { confirmPaymentFromGateway } from "@/lib/bookings/checkout";
import { getPaymentProvider } from "@/lib/payments";
import { createServiceSupabase } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type RazorpayWebhook = {
  event?: string;
  payload?: {
    payment?: { entity?: Record<string, unknown> };
    refund?: { entity?: Record<string, unknown> };
  };
};

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") ?? "";
  const provider = getPaymentProvider();
  if (!provider.verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: RazorpayWebhook;
  try {
    event = JSON.parse(raw) as RazorpayWebhook;
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  if (event.event === "payment.captured" || event.event === "payment.authorized") {
    const entity = event.payload?.payment?.entity ?? {};
    const orderId = String(entity.order_id ?? "");
    const paymentId = String(entity.id ?? "");
    if (orderId && paymentId) {
      try {
        await confirmPaymentFromGateway({
          orderId,
          paymentId,
          payload: entity,
        });
      } catch {
        return NextResponse.json({ error: "Confirmation pending" }, { status: 500 });
      }
    }
  }

  if (event.event === "payment.failed") {
    const entity = event.payload?.payment?.entity ?? {};
    const orderId = String(entity.order_id ?? "");
    if (orderId) {
      const { data: payment } = await supabase
        .from("payments")
        .select("id, booking_id, status")
        .eq("provider_order_id", orderId)
        .maybeSingle();
      if (payment && payment.status !== "CAPTURED") {
        await supabase.from("payments").update({ status: "FAILED", raw_payload: entity }).eq("id", payment.id);
        await supabase
          .from("bookings")
          .update({ status: "PAYMENT_FAILED" })
          .eq("id", payment.booking_id)
          .eq("status", "PENDING_PAYMENT");
      }
    }
  }

  if (event.event === "refund.processed") {
    const entity = event.payload?.refund?.entity ?? {};
    const refundId = String(entity.id ?? "");
    const paymentId = String(entity.payment_id ?? "");
    if (refundId) {
      const { data: refund } = await supabase
        .from("refunds")
        .select("id, booking_id")
        .eq("provider_refund_id", refundId)
        .maybeSingle();
      if (refund) {
        await supabase.from("refunds").update({ status: "PROCESSED" }).eq("id", refund.id);
        await supabase
          .from("bookings")
          .update({ status: "REFUNDED" })
          .eq("id", refund.booking_id);
      } else if (paymentId) {
        const { data: payment } = await supabase
          .from("payments")
          .select("id, booking_id")
          .eq("provider_payment_id", paymentId)
          .maybeSingle();
        if (payment) {
          await supabase
            .from("refunds")
            .update({ provider_refund_id: refundId, status: "PROCESSED" })
            .eq("payment_id", payment.id);
          await supabase
            .from("bookings")
            .update({ status: "REFUNDED" })
            .eq("id", payment.booking_id);
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}
