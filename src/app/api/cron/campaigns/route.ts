import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabase } from "@/lib/supabase/admin";
import { processPendingRefunds } from "@/lib/bookings/refunds";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get("authorization");
  const urlSecret = request.nextUrl.searchParams.get("secret");
  const authorized =
    (secret && auth === `Bearer ${secret}`) || (secret && urlSecret === secret);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceSupabase();
  const { data: expiredCount, error } = await supabase.rpc("expire_due_campaigns");
  if (error) {
    return NextResponse.json({ error: "Unable to process campaigns." }, { status: 500 });
  }
  const refunds = await processPendingRefunds();
  return NextResponse.json({
    expired: expiredCount,
    refunds,
  });
}

export async function POST(request: NextRequest) {
  return GET(request);
}
