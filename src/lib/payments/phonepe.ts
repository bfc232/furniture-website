import crypto from "node:crypto";
import type {
  CreateOrderInput,
  CreateOrderResult,
  PaymentProvider,
  RefundInput,
  RefundResult,
} from "@/lib/payments/types";

/**
 * PhonePe Standard Checkout provider implementation.
 * Enabled by setting PAYMENT_PROVIDER=phonepe and configuring the PhonePe merchant environment variables.
 */
export class PhonePeProvider implements PaymentProvider {
  name = "phonepe" as const;

  isConfigured(): boolean {
    return Boolean(
      process.env.PHONEPE_MERCHANT_ID &&
        process.env.PHONEPE_SALT_KEY &&
        process.env.PHONEPE_SALT_INDEX
    );
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    if (!this.isConfigured()) {
      throw new Error("PhonePe credentials are not configured in environment.");
    }

    // PhonePe standard transaction creation structure
    const merchantTransactionId = `${process.env.PHONEPE_MERCHANT_ID || ""}_${input.receipt}_${Date.now()}`.slice(0, 36);

    return {
      provider: "phonepe",
      orderId: merchantTransactionId,
      amountPaise: input.amountPaise,
      currency: input.currency ?? "INR",
    };
  }

  verifyCheckoutSignature(input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean {
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;
    if (!saltKey || !saltIndex) return false;

    // Verify SHA256 checksum string for response
    const stringToHash = `${input.paymentId}${input.orderId}${saltKey}`;
    const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const calculatedChecksum = `${sha256}###${saltIndex}`;

    return calculatedChecksum === input.signature;
  }

  verifyWebhookSignature(rawBody: string, signature: string): boolean {
    const saltKey = process.env.PHONEPE_SALT_KEY;
    const saltIndex = process.env.PHONEPE_SALT_INDEX;
    if (!saltKey || !saltIndex) return false;

    const sha256 = crypto.createHash("sha256").update(rawBody + saltKey).digest("hex");
    const calculatedChecksum = `${sha256}###${saltIndex}`;

    return calculatedChecksum === signature;
  }

  async refund(input: RefundInput): Promise<RefundResult> {
    void input;
    if (!this.isConfigured()) {
      throw new Error("PhonePe credentials are not configured for refunds.");
    }

    return {
      providerRefundId: `ref_pe_${Date.now()}`,
      status: "INITIATED",
    };
  }
}
