"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export function CatalogFilters({ categories }: { categories: { slug: string; name: string }[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const sort = searchParams.get("sort") ?? "featured";
  const category = searchParams.get("category") ?? "";

  function apply(next: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    const query = params.toString();
    router.push(query ? `/products?${query}` : "/products");
  }

  function onSearch(event: FormEvent) {
    event.preventDefault();
    apply({ q: q.trim() });
  }

  const sorts = useMemo(
    () => [
      { value: "featured", label: "Featured" },
      { value: "newest", label: "Newest" },
      { value: "price_asc", label: "Price: low to high" },
      { value: "price_desc", label: "Price: high to low" },
    ],
    [],
  );

  return (
    <div className="space-y-5">
      <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="catalog-search">
          Search furniture
        </label>
        <input
          id="catalog-search"
          className="field"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Search by name, material, or SKU"
        />
        <button type="submit" className="btn btn-primary sm:w-auto">
          Search
        </button>
      </form>
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          className={`shrink-0 border px-3 py-2 text-sm ${!category ? "border-ink bg-ink text-white" : "border-line bg-card"}`}
          onClick={() => apply({ category: "" })}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.slug}
            type="button"
            className={`shrink-0 border px-3 py-2 text-sm ${category === item.slug ? "border-ink bg-ink text-white" : "border-line bg-card"}`}
            onClick={() => apply({ category: item.slug })}
          >
            {item.name}
          </button>
        ))}
      </div>
      <label className="block max-w-xs">
        <span className="label">Sort</span>
        <select className="field" value={sort} aria-label="Sort furniture" onChange={(event) => apply({ sort: event.target.value })}>
          {sorts.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
