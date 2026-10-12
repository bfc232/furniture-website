import { NextResponse, type NextRequest } from "next/server";
import { getAdminSession } from "@/lib/auth/admin";
import { createServiceSupabase } from "@/lib/supabase/admin";

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
  const { reason, restartFromNow = true } = body;

  if (!reason || typeof reason !== "string" || reason.trim().length < 3) {
    return NextResponse.json(
      { error: "A valid reason (at least 3 characters) is required." },
      { status: 400 }
    );
  }

  const supabase = createServiceSupabase();

  try {
    const { data, error } = await supabase.rpc("reset_campaign_window", {
      p_campaign_id: campaignId,
      p_reason: reason.trim(),
      p_admin_id: session.admin.id,
      p_restart_from_now: Boolean(restartFromNow),
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal error" },
      { status: 500 }
    );
  }
}
