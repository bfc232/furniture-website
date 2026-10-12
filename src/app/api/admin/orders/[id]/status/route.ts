import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { CAMPAIGN_STATUSES, type CampaignStatus } from "@/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: campaignId } = await params;
  const body = await request.json();
  const { status, note } = body as { status: CampaignStatus; note?: string | null };

  if (!CAMPAIGN_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid campaign status" }, { status: 400 });
  }

  const supabase = createServiceSupabase();

  try {
    // Fetch previous status
    const { data: campaign, error: fetchErr } = await supabase
      .from("booking_campaigns")
      .select("status")
      .eq("id", campaignId)
      .single();

    if (fetchErr || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const fromStatus = campaign.status;

    // Update campaign status
    const { error: updateErr } = await supabase
      .from("booking_campaigns")
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Log to order_status_history
    await supabase.from("order_status_history").insert({
      campaign_id: campaignId,
      admin_id: session.admin.id,
      from_status: fromStatus,
      to_status: status,
      note: note ?? null,
    });

    // Also record in admin audit log
    await supabase.from("admin_audit_logs").insert({
      admin_id: session.admin.id,
      action: "order_status_update",
      entity_type: "booking_campaign",
      entity_id: campaignId,
      metadata: {
        from: fromStatus,
        to: status,
        note: note ?? null,
      },
    });

    return NextResponse.json({ ok: true, status });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
