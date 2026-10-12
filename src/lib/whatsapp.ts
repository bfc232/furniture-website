import { SITE } from "@/lib/site";
import { formatInrFromPaise } from "@/lib/pricing";

export function buildWhatsAppUrl(text: string): string {
  const encoded = encodeURIComponent(text);
  return `https://wa.me/${SITE.whatsappE164}?text=${encoded}`;
}

export function productEnquiryMessage(input: {
  name: string;
  sku: string;
  unitBasePaise: number;
  paidUnits: number;
  minUnits: number;
}): string {
  return [
    `Hi ${SITE.brand}, I am interested in the ${input.name} (SKU: ${input.sku}).`,
    "",
    `Price: ${formatInrFromPaise(input.unitBasePaise)} + GST`,
    `Current booking status: ${input.paidUnits}/${input.minUnits} units`,
    "",
    "I would like to know more about this product.",
  ].join("\n");
}

export function generalWhatsAppUrl(): string {
  return buildWhatsAppUrl(`Hi ${SITE.brand}, I would like to know more about your furniture.`);
}
