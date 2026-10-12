import { Suspense } from "react";
import { CatalogFilters } from "@/components/products/CatalogFilters";
import { ProductGrid } from "@/components/products/ProductGrid";
import { listCategories, listProducts } from "@/lib/catalog";

export const metadata = {
  title: "Furniture",
  description: "Browse imported furniture from China at factory-level prices. The advance is shown on each product.",
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts({
      query: params.q,
      categorySlug: params.category,
      sort: params.sort,
    }),
  ]);

  return (
    <div className="container-page py-8 lg:py-12">
      <p className="eyebrow">Catalog</p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">All furniture</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[#3f3a36]">
        Prices are shown before GST. The advance is the percentage shown on each product. On selected pieces that is 10%
        of the GST-inclusive total. The supplier order is placed when 5 units are booked.
      </p>
      <div className="mt-8">
        <Suspense>
          <CatalogFilters categories={categories.map((category) => ({ slug: category.slug, name: category.name }))} />
        </Suspense>
      </div>
      <p className="mt-8 text-sm text-muted">
        {products.length} {products.length === 1 ? "piece" : "pieces"}
        {params.q ? ` matching “${params.q}”` : ""}
      </p>
      <div className="mt-5">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
