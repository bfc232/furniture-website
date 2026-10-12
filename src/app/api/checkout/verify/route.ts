import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { confirmPaymentFromGateway } from "@/lib/bookings/checkout";
import { getPaymentProvider } from "@/lib/payments";

const schema = z.object({
  razorpay_order_id: z.string().min(3),
  razorpay_payment_id: z.string().min(3),
  razorpay_signature: z.string().min(8),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payment response." }, { status: 400 });
  }

  const provider = getPaymentProvider();
  const valid = provider.verifyCheckoutSignature({
    orderId: parsed.data.razorpay_order_id,
    paymentId: parsed.data.razorpay_payment_id,
    signature: parsed.data.razorpay_signature,
  });
  if (!valid) {
    return NextResponse.json({ error: "Payment could not be verified." }, { status: 400 });
  }

  try {
    const result = await confirmPaymentFromGateway({
      orderId: parsed.data.razorpay_order_id,
      paymentId: parsed.data.razorpay_payment_id,
      payload: parsed.data,
    });
    return NextResponse.json({
      ok: true,
      bookingId: result.booking_id,
      publicRef: result.public_ref,
    });
  } catch {
    return NextResponse.json(
      { error: "Payment was received but confirmation is still processing." },
      { status: 202 },
    );
  }
}
