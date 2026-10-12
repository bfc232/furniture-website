import { requireAdmin } from "@/lib/auth/admin";
import { ProductListManager } from "@/components/admin/ProductListManager";
import { createServiceSupabase, hasSupabaseConfig } from "@/lib/supabase/admin";
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/lib/mock-data";
import type { Category, Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  await requireAdmin();

  let products: Product[] = [];
  let categories: Category[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = createServiceSupabase();

      // Fetch all products (including inactive)
      const { data: prodData } = await supabase
        .from("products")
        .select(`
          *,
          categories (*),
          product_images (*),
          booking_campaigns (*)
        `)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (prodData && prodData.length > 0) {
        products = prodData.map((row) => {
          const category = Array.isArray(row.categories)
            ? row.categories[0]
            : row.categories;
          const campaigns = row.booking_campaigns ?? [];
          const current = campaigns.find((c: { is_current: boolean }) => c.is_current) ?? campaigns[0] ?? null;
          return {
            ...row,
            category,
            images: (row.product_images ?? []).sort(
              (a: { display_order: number }, b: { display_order: number }) =>
                a.display_order - b.display_order
            ),
            campaign: current,
          };
        });
      }

      // Fetch all categories (including inactive)
      const { data: catData } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (catData && catData.length > 0) {
        categories = catData as Category[];
      }
    } catch {
      // Fallback below
    }
  }

  if (!hasSupabaseConfig()) {
    if (products.length === 0) products = MOCK_PRODUCTS;
    if (categories.length === 0) categories = MOCK_CATEGORIES;
  }

  return (
    <ProductListManager
      initialProducts={products}
      categories={categories}
    />
  );
}
