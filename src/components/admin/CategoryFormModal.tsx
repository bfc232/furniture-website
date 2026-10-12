"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/types";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryFormModal({
  category,
  isOpen,
  onClose,
}: {
  category?: Category | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [description, setDescription] = useState(category?.description ?? "");
  const [displayOrder, setDisplayOrder] = useState(category?.display_order ?? 10);
  const [isActive, setIsActive] = useState(category?.is_active ?? true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!category) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Category name is required.");
      return;
    }
    if (!slug.trim()) {
      setError("Slug is required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: category ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: category?.id,
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || null,
          display_order: Number(displayOrder),
          is_active: isActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save category");
      }

      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-[#f7f3ed] p-6 shadow-2xl border border-line animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold">
              {category ? "Edit Category" : "Add New Category"}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {category ? `Update category details` : "Create new furniture category"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Category Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g., TV Units, Recliners, Cabinets"
              className="field text-sm"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              URL Slug <span className="text-rose-500">*</span>
            </label>
            <div className="flex items-center text-xs text-muted">
              <span>/category/</span>
              <input
                type="text"
                required
                placeholder="tv-units"
                className="field text-sm ml-1"
                value={slug}
                onChange={(e) => setSlug(slugify(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Short description displayed on category cards"
              className="field text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Display Order
              </label>
              <input
                type="number"
                min="0"
                className="field text-sm"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded accent-accent"
                />
                <span className="text-sm font-medium">Active</span>
              </label>
            </div>
          </div>

          {error ? (
            <div className="rounded-xl bg-rose-100 p-2.5 text-xs text-rose-800 border border-rose-200">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn btn-ghost text-sm py-2 px-4"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary text-sm py-2 px-5 disabled:opacity-50"
            >
              {loading ? "Saving..." : category ? "Update Category" : "Create Category"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
