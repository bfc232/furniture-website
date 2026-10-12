export const SITE = {
  brand: "ImportNow",
  tagline:
    "Premium furniture directly from Chinese manufacturers at factory-level prices.",
  legalName: "VALCOR GLOBAL LLP",
  gstin: "36ABBFV4487G1ZU",
  email: "hello@importnow.in",
  phoneDisplay: "+91 63058 22055",
  whatsappDisplay: "+91 63058 22055",
  whatsappE164: "916305822055",
  addressLines: [
    "C Block, 106, Saraswathi Apartments",
    "Vijayapuri Colony, Tarnaka",
    "Hyderabad, Secunderabad",
    "Telangana - 500017, India",
  ],
  pickupLines: [
    "C Block, 106, Saraswathi Apartments",
    "Vijayapuri Colony, Tarnaka",
    "Hyderabad, Telangana - 500017",
  ],
} as const;

export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
}
