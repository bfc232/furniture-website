import { requireAdmin } from "@/lib/auth/admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { createServiceSupabase, hasSupabaseConfig } from "@/lib/supabase/admin";
import { MOCK_CATEGORIES } from "@/lib/mock-data";
import type { Category } from "@/types";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  await requireAdmin();

  let categories: Category[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = createServiceSupabase();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (data && data.length > 0) {
        categories = data as Category[];
      }
    } catch {
      // Fallback below
    }
  }

  if (!hasSupabaseConfig() && categories.length === 0) {
    categories = MOCK_CATEGORIES;
  }

  return <ProductForm categories={categories} />;
}
