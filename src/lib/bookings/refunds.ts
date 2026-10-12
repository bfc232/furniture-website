import { getPaymentProvider } from "@/lib/payments";
import { createServiceSupabase } from "@/lib/supabase/admin";

export async function processPendingRefunds(): Promise<{ attempted: number; succeeded: number }> {
  const supabase = createServiceSupabase();
  const provider = getPaymentProvider();
  if (!provider.isConfigured()) {
    return { attempted: 0, succeeded: 0 };
  }

  const { data: pending } = await supabase
    .from("refunds")
    .select("id, booking_id, payment_id, amount_paise, provider_refund_id")
    .in("status", ["PENDING", "FAILED"])
    .limit(50);

  let succeeded = 0;
  for (const refund of pending ?? []) {
    if (refund.provider_refund_id) {
      continue;
    }
    const { data: payment } = await supabase
      .from("payments")
      .select("provider_payment_id")
      .eq("id", refund.payment_id)
      .maybeSingle();
    if (!payment?.provider_payment_id) continue;

    try {
      const result = await provider.refund({
        providerPaymentId: payment.provider_payment_id,
        amountPaise: refund.amount_paise,
        notes: { booking_id: refund.booking_id },
      });
      await supabase
        .from("refunds")
        .update({
          provider_refund_id: result.providerRefundId,
          status: result.status.toLowerCase().includes("process") ? "PROCESSED" : "PROCESSING",
          last_error: null,
        })
        .eq("id", refund.id);

      if (result.status.toLowerCase().includes("process")) {
        await supabase
          .from("bookings")
          .update({ status: "REFUNDED" })
          .eq("id", refund.booking_id)
          .eq("status", "REFUND_PENDING");
        succeeded += 1;
      }
    } catch (error) {
      await supabase
        .from("refunds")
        .update({
          status: "FAILED",
          last_error: error instanceof Error ? error.message : "Refund failed",
        })
        .eq("id", refund.id);
    }
  }

  await closeCampaignsIfRefundsDone(supabase);
  return { attempted: pending?.length ?? 0, succeeded };
}

async function closeCampaignsIfRefundsDone(
  supabase: ReturnType<typeof createServiceSupabase>,
) {
  const { data: campaigns } = await supabase
    .from("booking_campaigns")
    .select("id")
    .eq("status", "REFUND_PENDING");

  for (const campaign of campaigns ?? []) {
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .eq("status", "REFUND_PENDING");
    if ((count ?? 0) === 0) {
      await supabase
        .from("booking_campaigns")
        .update({ status: "REFUNDED" })
        .eq("id", campaign.id);
    }
  }
}
