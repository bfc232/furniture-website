import type { MetadataRoute } from "next";
import { listCategories, listProducts } from "@/lib/catalog";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();

  const [categories, products] = await Promise.all([
    listCategories(),
    listProducts(),
  ]);

  const staticRoutes = [
    "",
    "/products",
    "/about",
    "/how-it-works",
    "/contact",
    "/shipping-delivery",
    "/payment-terms",
    "/refund-policy",
    "/cancellation-policy",
    "/privacy-policy",
    "/terms-and-conditions",
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" || route === "/products" ? ("daily" as const) : ("monthly" as const),
    priority: route === "" ? 1.0 : route === "/products" ? 0.9 : 0.5,
  }));

  const categoryRoutes = categories.map((cat) => ({
    url: `${siteUrl}/category/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productRoutes = products.map((prod) => ({
    url: `${siteUrl}/product/${prod.slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
