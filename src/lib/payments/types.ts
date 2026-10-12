export type CreateOrderInput = {
  amountPaise: number;
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
};

export type CreateOrderResult = {
  provider: "razorpay" | "phonepe";
  orderId: string;
  amountPaise: number;
  currency: string;
};

export type RefundInput = {
  providerPaymentId: string;
  amountPaise: number;
  notes?: Record<string, string>;
};

export type RefundResult = {
  providerRefundId: string;
  status: string;
};

export interface PaymentProvider {
  name: "razorpay" | "phonepe";
  isConfigured(): boolean;
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>;
  verifyCheckoutSignature(input: {
    orderId: string;
    paymentId: string;
    signature: string;
  }): boolean;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  refund(input: RefundInput): Promise<RefundResult>;
}
