import { z } from "zod";

export const checkoutSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
  variantId: z
    .union([z.string().trim().min(1), z.literal(""), z.null()])
    .optional()
    .transform((value) => (value ? value : null)),
  customerName: z.string().trim().min(2, "Enter your full name.").max(80, "Name is too long."),
  customerMobile: z
    .string()
    .trim()
    .min(10, "Enter a valid mobile number.")
    .max(15, "Enter a valid mobile number."),
  customerWhatsapp: z
    .string()
    .trim()
    .min(10, "Enter a WhatsApp number.")
    .max(15, "Enter a valid WhatsApp number."),
  customerEmail: z.string().trim().email("Enter a valid email address.").max(120),
  addressLine: z.string().trim().min(6, "Enter your full address.").max(200),
  city: z.string().trim().min(2, "Enter your city.").max(80),
  state: z.string().trim().min(2, "Enter your state.").max(80),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit pincode."),
  idempotencyKey: z.string().uuid(),
});

export function fieldErrorsFromZod(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

export const productFormSchema = z.object({
  name: z.string().trim().min(2).max(120),
  sku: z.string().trim().min(2).max(40),
  slug: z.string().trim().min(2).max(80).optional(),
  categoryId: z.string().uuid(),
  shortDescription: z.string().trim().max(280).optional().nullable(),
  fullDescription: z.string().trim().max(8000).optional().nullable(),
  basePriceRupees: z.number().positive(),
  gstPercent: z.number().min(0).max(100).default(18),
  advancePercent: z.number().int().min(1).max(90).default(10),
  material: z.string().trim().max(160).optional().nullable(),
  dimensions: z.string().trim().max(160).optional().nullable(),
  colour: z.string().trim().max(120).optional().nullable(),
  videoUrl: z.string().trim().url().optional().nullable().or(z.literal("")),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  minUnits: z.number().int().min(1).default(5),
  bookingWindowDays: z.number().int().min(1).default(7),
  deliveryEstimate: z.string().trim().min(2).max(80).default("30–40 days"),
  displayOrder: z.number().int().default(0),
  seoTitle: z.string().trim().max(120).optional().nullable(),
  seoDescription: z.string().trim().max(200).optional().nullable(),
  colours: z.string().trim().max(400).optional().nullable(),
});
