import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/bookings/checkout";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!rateLimit(`checkout:${ip}`, 8, 60_000)) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const result = await createCheckoutSession(body, ip);
    if ("error" in result) {
      return NextResponse.json(
        {
          error: result.error,
          fieldErrors: "fieldErrors" in result ? result.fieldErrors : null,
        },
        { status: result.status },
      );
    }
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 500 },
    );
  }
}
