import crypto from "node:crypto";
import Razorpay from "razorpay";
import type {
  CreateOrderInput,
  CreateOrderResult,
  PaymentProvider,
  RefundInput,
  RefundResult,
} from "@/lib/payments/types";

export class RazorpayProvider implements PaymentProvider {
  name = "razorpay" as const;

  isConfigured(): boolean {
    return Boolean(
      process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET,
    );
  }

  private client() {
    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_id || !key_secret) {
      throw new Error("Razorpay is not configured.");
    }
    return new Razorpay({ key_id, key_secret });
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const order = await this.client().orders.create({
      amount: input.amountPaise,
      currency: input.currency ?? "INR",
      receipt: input.receipt.slice(0, 40),
      notes: input.notes,
    });

    return {
      provider: "razorpay",
      orderId: String(order.id),
      amountPaise: Number(order.amount),
      currency: String(order.currency),
    };
  }

  verifyCheckoutSignature(input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return false;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(`${input.orderId}|${input.paymentId}`)
      .digest("hex");
    return timingSafeEqual(expected, input.signature);
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return false;
    const expected = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");
    return timingSafeEqual(expected, signature);
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    const refund = await this.client().payments.refund(input.providerPaymentId, {
      amount: input.amountPaise,
      notes: input.notes,
    });
    return {
      providerRefundId: String(refund.id),
      status: String(refund.status ?? "processed"),
    };
  }
}

function timingSafeEqual(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}
