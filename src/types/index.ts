export const CAMPAIGN_STATUSES = [
  "OPEN",
  "THRESHOLD_REACHED",
  "ORDER_PLACED",
  "IN_PRODUCTION",
  "IN_TRANSIT",
  "ARRIVED",
  "READY_FOR_PICKUP",
  "COMPLETED",
  "EXPIRED",
  "REFUND_PENDING",
  "REFUNDED",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const BOOKING_STATUSES = [
  "PENDING_PAYMENT",
  "PAID",
  "PAYMENT_FAILED",
  "CANCELLED",
  "REFUND_PENDING",
  "REFUNDED",
] as const;

export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "CREATED",
  "AUTHORIZED",
  "CAPTURED",
  "FAILED",
  "REFUNDED",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  is_active: boolean;
};

export type ProductImage = {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
};

export type ProductVariant = {
  id: string;
  product_id: string;
  name: string;
  value: string;
  is_active: boolean;
};

export type BookingCampaign = {
  id: string;
  product_id: string;
  status: CampaignStatus;
  min_units: number;
  booking_window_days: number;
  paid_units: number;
  manual_adjustment_units: number;
  qualifying_units: number;
  window_started_at: string | null;
  window_ends_at: string | null;
  threshold_reached_at: string | null;
  is_current: boolean;
};

export type Product = {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  sku: string;
  short_description: string | null;
  full_description: string | null;
  base_price_paise: number;
  gst_percent: number;
  advance_percent: number;
  material: string | null;
  dimensions: string | null;
  colour: string | null;
  video_url: string | null;
  is_featured: boolean;
  is_active: boolean;
  min_units: number;
  booking_window_days: number;
  delivery_estimate: string;
  display_order: number;
  seo_title: string | null;
  seo_description: string | null;
  category?: Category | null;
  images?: ProductImage[];
  variants?: ProductVariant[];
  campaign?: BookingCampaign | null;
};

export type Booking = {
  id: string;
  public_ref: string;
  campaign_id: string;
  product_id: string;
  quantity: number;
  variant_id: string | null;
  customer_name: string;
  customer_mobile: string;
  customer_whatsapp: string;
  customer_email: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  base_amount_paise: number;
  gst_amount_paise: number;
  total_amount_paise: number;
  advance_amount_paise: number;
  balance_amount_paise: number;
  gst_percent: number;
  status: BookingStatus;
  paid_at: string | null;
  created_at: string;
};

export type CheckoutInput = {
  productId: string;
  quantity: number;
  variantId?: string | null;
  customerName: string;
  customerMobile: string;
  customerWhatsapp: string;
  customerEmail: string;
  addressLine: string;
  city: string;
  state: string;
  pincode: string;
  idempotencyKey: string;
};
