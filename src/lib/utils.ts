export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function publicBookingRef(id: string): string {
  return `IN-${id.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
}

export function sanitizePlainText(value: string, max = 4000): string {
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

export function isLikelyIndianMobile(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  const national = digits.startsWith("91") && digits.length === 12 ? digits.slice(2) : digits;
  return /^[6-9]\d{9}$/.test(national);
}

export function isValidPincode(value: string): boolean {
  return /^\d{6}$/.test(value.trim());
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
