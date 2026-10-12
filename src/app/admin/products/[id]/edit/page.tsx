import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { createServiceSupabase, hasSupabaseConfig } from "@/lib/supabase/admin";
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/lib/mock-data";
import type { Category, Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  let product: Product | null = null;
  let categories: Category[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = createServiceSupabase();

      // Fetch product with images and categories
      const { data: prodData } = await supabase
        .from("products")
        .select(`
          *,
          categories (*),
          product_images (*),
          product_variants (*)
        `)
        .eq("id", id)
        .maybeSingle();

      if (prodData) {
        const category = Array.isArray(prodData.categories)
          ? prodData.categories[0]
          : prodData.categories;
        product = {
          ...prodData,
          category,
          images: (prodData.product_images ?? []).sort(
            (a: { display_order: number }, b: { display_order: number }) =>
              a.display_order - b.display_order
          ),
          variants: prodData.product_variants ?? [],
        };
      }

      // Fetch categories
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
    if (!product) product = MOCK_PRODUCTS.find((p) => p.id === id) ?? null;
    if (categories.length === 0) categories = MOCK_CATEGORIES;
  }

  if (!product) {
    notFound();
  }

  return <ProductForm categories={categories} initialProduct={product} />;
}
