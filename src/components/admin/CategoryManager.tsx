"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CategoryFormModal } from "@/components/admin/CategoryFormModal";
import type { Category } from "@/types";

export function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  const router = useRouter();
  const [modalCategory, setModalCategory] = useState<Category | null | undefined>(
    undefined
  );
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const handleToggleActive = async (category: Category) => {
    setActionLoadingId(category.id);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category.id,
          is_active: !category.is_active,
        }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">Category Management</h1>
          <p className="text-xs text-muted mt-0.5">
            Add or edit categories on the fly (TV Units, Coffee Tables, Cabinets, etc.)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalCategory(null)}
          className="btn btn-primary text-sm py-2.5 px-4 self-start sm:self-auto"
        >
          + Add Category
        </button>
      </div>

      {/* Categories Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {categories.map((category) => (
          <div
            key={category.id}
            className={`card p-4 space-y-3 transition-colors ${
              !category.is_active ? "opacity-60 bg-[#ede5d8]/60" : ""
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-muted">
                  Order: {category.display_order} • /{category.slug}
                </span>
                <h3 className="font-serif text-xl font-bold mt-0.5">{category.name}</h3>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                  category.is_active
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-ink/10 text-muted"
                }`}
              >
                {category.is_active ? "Active" : "Inactive"}
              </span>
            </div>

            <p className="text-xs text-muted leading-relaxed line-clamp-2">
              {category.description || "No description provided."}
            </p>

            <div className="flex items-center justify-between border-t border-line/60 pt-2 text-xs">
              <button
                type="button"
                onClick={() => setModalCategory(category)}
                className="font-medium text-accent hover:underline"
              >
                Edit Category
              </button>

              <button
                type="button"
                onClick={() => handleToggleActive(category)}
                disabled={actionLoadingId === category.id}
                className={`font-semibold hover:underline ${
                  category.is_active ? "text-rose-700" : "text-emerald-700"
                }`}
              >
                {category.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {modalCategory !== undefined ? (
        <CategoryFormModal
          key={modalCategory?.id ?? "new"}
          category={modalCategory}
          isOpen={true}
          onClose={() => setModalCategory(undefined)}
        />
      ) : null}
    </div>
  );
}
