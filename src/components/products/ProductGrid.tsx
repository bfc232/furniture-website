import { ProductCard } from "@/components/products/ProductCard";
import type { Product } from "@/types";

export function ProductGrid({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <div className="border border-line bg-card px-6 py-14 text-center">
        <p className="font-serif text-3xl">Nothing in this view yet</p>
        <p className="mx-auto mt-3 max-w-md text-base leading-7 text-muted">
          New pieces appear here as soon as they are published. Browse another category, or message ImportNow on
          WhatsApp.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-x-4 gap-y-10 min-[360px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
