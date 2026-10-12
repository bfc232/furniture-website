import { canAcceptBooking } from "@/lib/campaign";
import { createServiceSupabase, hasSupabaseConfig } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import type { BookingCampaign, Category, Product, ProductImage, ProductVariant } from "@/types";

import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/lib/mock-data";

export { canAcceptBooking };

type ProductRow = Product & {
  categories: Category | Category[] | null;
  product_images: ProductImage[] | null;
  product_variants: ProductVariant[] | null;
  booking_campaigns: BookingCampaign[] | null;
};

function mapProduct(row: ProductRow): Product {
  const category = Array.isArray(row.categories) ? row.categories[0] : row.categories;
  const campaigns = row.booking_campaigns ?? [];
  const current = campaigns.find((c) => c.is_current) ?? campaigns[0] ?? null;
  return {
    ...row,
    category,
    images: (row.product_images ?? []).slice().sort((a, b) => a.display_order - b.display_order),
    variants: (row.product_variants ?? []).filter((v) => v.is_active),
    campaign: current,
  };
}

const PRODUCT_SELECT = `
  *,
  categories (*),
  product_images (*),
  product_variants (*),
  booking_campaigns (*)
`;

export async function getPublicSupabase() {
  if (!hasSupabaseConfig()) return null;
  try {
    return await createServerSupabase();
  } catch {
    return null;
  }
}

export async function listCategories(): Promise<Category[]> {
  const supabase = await getPublicSupabase();
  if (!supabase) return hasSupabaseConfig() ? [] : MOCK_CATEGORIES;
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order");
  if (!hasSupabaseConfig() && (!data || data.length === 0)) {
    return MOCK_CATEGORIES;
  }
  return (data ?? []) as Category[];
}

export async function listProducts(options?: {
  categorySlug?: string;
  query?: string;
  sort?: string;
  featured?: boolean;
}): Promise<Product[]> {
  const supabase = await getPublicSupabase();
  let products: Product[] = [];

  if (supabase) {
    let builder = supabase.from("products").select(PRODUCT_SELECT).eq("is_active", true);

    if (options?.featured) {
      builder = builder.eq("is_featured", true);
    }
    if (options?.categorySlug) {
      const { data: category } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", options.categorySlug)
        .eq("is_active", true)
        .maybeSingle();
      if (category) {
        builder = builder.eq("category_id", category.id);
      }
    }

    const { data } = await builder.order("display_order").order("created_at", { ascending: false });
    if (data && data.length > 0) {
      products = (data as ProductRow[]).map(mapProduct);
    }
  }

  if (products.length === 0 && !hasSupabaseConfig()) {
    products = MOCK_PRODUCTS.slice();
    if (options?.featured) {
      products = products.filter((p) => p.is_featured);
    }
    if (options?.categorySlug) {
      products = products.filter((p) => p.category?.slug === options.categorySlug);
    }
  }

  const q = options?.query?.trim().toLowerCase();
  if (q) {
    products = products.filter((p) =>
      [p.name, p.sku, p.short_description, p.material, p.colour]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }

  switch (options?.sort) {
    case "price_asc":
      products.sort((a, b) => a.base_price_paise - b.base_price_paise);
      break;
    case "price_desc":
      products.sort((a, b) => b.base_price_paise - a.base_price_paise);
      break;
    case "newest":
      break;
    default:
      products.sort((a, b) => {
        if (a.is_featured !== b.is_featured) return a.is_featured ? -1 : 1;
        return a.display_order - b.display_order;
      });
  }

  return products;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = await getPublicSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("products")
      .select(PRODUCT_SELECT)
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (data) return mapProduct(data as ProductRow);
    return null;
  }
  return MOCK_PRODUCTS.find((p) => p.slug === slug) ?? null;
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  const supabase = await getPublicSupabase();
  if (supabase) {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .maybeSingle();
    if (data) return (data as Category | null) ?? null;
    return null;
  }
  return MOCK_CATEGORIES.find((c) => c.slug === slug) ?? null;
}

export async function getBookingForCustomer(bookingId: string) {
  if (!hasSupabaseConfig()) return null;
  const supabase = createServiceSupabase();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();
  if (!booking) return null;
  const { data: product } = await supabase
    .from("products")
    .select("name, slug, sku, delivery_estimate")
    .eq("id", booking.product_id)
    .maybeSingle();
  const { data: campaign } = await supabase
    .from("booking_campaigns")
    .select("*")
    .eq("id", booking.campaign_id)
    .maybeSingle();
  return { booking, product, campaign };
}
