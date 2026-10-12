import type { BookingCampaign, CampaignStatus, Product } from "@/types";

export function canAcceptBooking(product: Product): { ok: boolean; reason?: string } {
  if (!product.is_active) return { ok: false, reason: "This product is currently unavailable." };
  const campaign = product.campaign;
  if (!campaign) return { ok: false, reason: "Booking is not open for this product." };
  if (["EXPIRED", "REFUND_PENDING", "REFUNDED", "COMPLETED"].includes(campaign.status)) {
    return { ok: false, reason: "This booking campaign is closed." };
  }
  if (
    campaign.status === "OPEN" &&
    campaign.window_ends_at &&
    new Date(campaign.window_ends_at).getTime() < Date.now() &&
    qualifyingUnits(campaign) < campaign.min_units
  ) {
    return { ok: false, reason: "The 7-day booking window has closed." };
  }
  return { ok: true };
}

export function qualifyingUnits(campaign: BookingCampaign | null | undefined): number {
  if (!campaign) return 0;
  return campaign.qualifying_units ?? campaign.paid_units + campaign.manual_adjustment_units;
}

export function unitsNeeded(campaign: BookingCampaign | null | undefined): number {
  if (!campaign) return 0;
  return Math.max(0, campaign.min_units - qualifyingUnits(campaign));
}

export function campaignProgress(campaign: BookingCampaign | null | undefined): number {
  if (!campaign || campaign.min_units <= 0) return 0;
  return Math.min(100, Math.round((qualifyingUnits(campaign) / campaign.min_units) * 100));
}

export function isThresholdReached(campaign: BookingCampaign | null | undefined): boolean {
  if (!campaign) return false;
  return (
    qualifyingUnits(campaign) >= campaign.min_units ||
    [
      "THRESHOLD_REACHED",
      "ORDER_PLACED",
      "IN_PRODUCTION",
      "IN_TRANSIT",
      "ARRIVED",
      "READY_FOR_PICKUP",
      "COMPLETED",
    ].includes(campaign.status)
  );
}

export function campaignLabel(status: CampaignStatus): string {
  switch (status) {
    case "OPEN":
      return "Open for booking";
    case "THRESHOLD_REACHED":
      return "Order confirmed";
    case "ORDER_PLACED":
      return "Order placed with supplier";
    case "IN_PRODUCTION":
      return "In production";
    case "IN_TRANSIT":
      return "In transit";
    case "ARRIVED":
      return "Arrived in Hyderabad";
    case "READY_FOR_PICKUP":
      return "Ready for pickup";
    case "COMPLETED":
      return "Completed";
    case "EXPIRED":
      return "Booking closed";
    case "REFUND_PENDING":
      return "Refund in progress";
    case "REFUNDED":
      return "Refunded";
    default:
      return status;
  }
}

export function customerCampaignCopy(product: Product): string {
  const campaign = product.campaign;
  if (!campaign) return "Booking is not open for this product.";
  if (isThresholdReached(campaign)) {
    return `Minimum quantity reached. Estimated arrival in Hyderabad is ${product.delivery_estimate} after the order is placed with the supplier.`;
  }
  if (["EXPIRED", "REFUND_PENDING", "REFUNDED"].includes(campaign.status)) {
    return "This booking window closed before the minimum quantity was reached. Successful advances are refunded.";
  }
  return `Once ${campaign.min_units} units are booked, we place the order with our supplier in China. Estimated arrival in Hyderabad is ${product.delivery_estimate} after the minimum order quantity is reached.`;
}

export const LOGISTICS_STATUSES: CampaignStatus[] = [
  "THRESHOLD_REACHED",
  "ORDER_PLACED",
  "IN_PRODUCTION",
  "IN_TRANSIT",
  "ARRIVED",
  "READY_FOR_PICKUP",
  "COMPLETED",
];
