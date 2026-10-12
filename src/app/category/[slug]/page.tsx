import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/products/ProductGrid";
import { getCategoryBySlug, listProducts } from "@/lib/catalog";
import { categoryImage } from "@/lib/media";
import { getSiteUrl } from "@/lib/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: "Category" };
  return {
    title: category.name,
    description: category.description ?? `Imported ${category.name.toLowerCase()} at factory-level prices.`,
    alternates: { canonical: `${getSiteUrl()}/category/${slug}` },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const products = await listProducts({ categorySlug: slug });

  return (
    <div>
      <div className="container-page grid items-end gap-6 py-8 lg:grid-cols-[1fr_18rem] lg:py-12">
        <div>
          <p className="eyebrow">
            <Link href="/products" className="hover:text-ink">
              Furniture
            </Link>
          </p>
          <h1 className="mt-2 font-serif text-4xl md:text-6xl">{category.name}</h1>
          {category.description ? (
            <p className="mt-3 max-w-xl text-base leading-7 text-[#3f3a36]">{category.description}</p>
          ) : null}
        </div>
        <div className="relative aspect-[4/3] overflow-hidden bg-[#e7e2da]">
          <Image
            src={categoryImage(category.slug)}
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 18rem"
            className="object-cover"
          />
        </div>
      </div>
      <div className="container-page pb-8">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
