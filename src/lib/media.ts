/** Local editorial photography used when a category has no uploaded image. */
export const CATEGORY_IMAGES: Record<string, string> = {
  sofas: "/images/sofa.jpg",
  beds: "/images/bed.jpg",
  "dining-tables": "/images/dining-detail.jpg",
  chairs: "/images/chair.jpg",
  "gaming-chairs": "/images/gaming.jpg",
  "office-tables": "/images/office-table.jpg",
  "office-chairs": "/images/office-chair.jpg",
  workstations: "/images/workstation.jpg",
  "conference-tables": "/images/conference.jpg",
};

export const DEFAULT_CATEGORY_IMAGE = "/images/interior.jpg";

export function categoryImage(slug: string): string {
  return CATEGORY_IMAGES[slug] ?? DEFAULT_CATEGORY_IMAGE;
}

/** Geometric SVG drawings are not product photography. */
export function isPhotoUrl(url?: string | null): url is string {
  if (!url) return false;
  const clean = url.split("?")[0]?.split("#")[0]?.toLowerCase() ?? "";
  if (!clean) return false;
  if (clean.endsWith(".svg")) return false;
  if (clean.includes("/placeholders/")) return false;
  return true;
}

export function isFileVideo(url: string): boolean {
  return /\.(mp4|webm|ogg)(\?|$)/i.test(url);
}
