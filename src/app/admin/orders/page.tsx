import { requireAdmin } from "@/lib/auth/admin";
import { OrdersLogisticsManager } from "@/components/admin/OrdersLogisticsManager";
import { createServiceSupabase, hasSupabaseConfig } from "@/lib/supabase/admin";
import type { BookingCampaign, CampaignStatus, Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  await requireAdmin();

  let campaigns: Array<
    BookingCampaign & {
      product?: Product | null;
      history?: Array<{
        id: string;
        from_status: CampaignStatus | null;
        to_status: CampaignStatus;
        note: string | null;
        created_at: string;
      }>;
    }
  > = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = createServiceSupabase();

      // Fetch campaigns that reached threshold
      const { data: campData } = await supabase
        .from("booking_campaigns")
        .select(`
          *,
          products (*),
          order_status_history (*)
        `)
        .in("status", [
          "THRESHOLD_REACHED",
          "ORDER_PLACED",
          "IN_PRODUCTION",
          "IN_TRANSIT",
          "ARRIVED",
          "READY_FOR_PICKUP",
          "COMPLETED",
        ])
        .order("created_at", { ascending: false });

      if (campData && campData.length > 0) {
        campaigns = campData.map((c) => ({
          ...c,
          product: c.products,
          history: (c.order_status_history ?? []).sort(
            (a: { created_at: string }, b: { created_at: string }) =>
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          ),
        }));
      }
    } catch {
      // Fallback
    }
  }

  return <OrdersLogisticsManager campaigns={campaigns} />;
}
