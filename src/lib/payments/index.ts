import { PhonePeProvider } from "@/lib/payments/phonepe";
import { RazorpayProvider } from "@/lib/payments/razorpay";
import type { PaymentProvider } from "@/lib/payments/types";

export function getPaymentProvider(): PaymentProvider {
  const name = process.env.PAYMENT_PROVIDER ?? "razorpay";
  switch (name) {
    case "phonepe":
      return new PhonePeProvider();
    case "razorpay":
      return new RazorpayProvider();
    default: {
      const _exhaustive: never = name as never;
      throw new Error(`Unsupported payment provider: ${_exhaustive}`);
    }
  }
}

export function getPublicRazorpayKey(): string | null {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ?? process.env.RAZORPAY_KEY_ID ?? null;
}
