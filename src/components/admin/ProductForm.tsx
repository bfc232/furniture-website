"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MediaUploader } from "@/components/admin/MediaUploader";
import { ProductPhoto } from "@/components/media/ProductPhoto";
import { formatInrFromPaise, calculatePricing, resolveAdvancePercent } from "@/lib/pricing";
import type { Category, Product } from "@/types";

export function ProductForm({
  categories,
  initialProduct,
}: {
  categories: Category[];
  initialProduct?: Product | null;
}) {
  const router = useRouter();

  // Basic Information
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [sku, setSku] = useState(initialProduct?.sku ?? "");
  const [categoryId, setCategoryId] = useState(
    initialProduct?.category_id ?? categories[0]?.id ?? ""
  );
  const [shortDesc, setShortDesc] = useState(initialProduct?.short_description ?? "");
  const [fullDesc, setFullDesc] = useState(initialProduct?.full_description ?? "");

  // Pricing & Defaults (Section 5)
  const [basePriceRupees, setBasePriceRupees] = useState<number>(
    initialProduct ? initialProduct.base_price_paise / 100 : 30000
  );
  const [gstPercent, setGstPercent] = useState<number>(
    initialProduct?.gst_percent ?? 18
  );
  const [advancePercent, setAdvancePercent] = useState<number>(
    resolveAdvancePercent(initialProduct?.advance_percent ?? 10)
  );
  const [minUnits, setMinUnits] = useState<number>(
    initialProduct?.min_units ?? 5
  );
  const [bookingWindowDays, setBookingWindowDays] = useState<number>(
    initialProduct?.booking_window_days ?? 7
  );
  const [deliveryEstimate, setDeliveryEstimate] = useState(
    initialProduct?.delivery_estimate ?? "30–40 days"
  );

  // Specifications
  const [material, setMaterial] = useState(initialProduct?.material ?? "");
  const [dimensions, setDimensions] = useState(initialProduct?.dimensions ?? "");
  const [colour, setColour] = useState(initialProduct?.colour ?? "");
  const [videoUrl, setVideoUrl] = useState(initialProduct?.video_url ?? "");
  const [variantValues, setVariantValues] = useState(
    initialProduct?.variants?.map((v) => v.value).join(", ") ?? "",
  );
  const [seoTitle, setSeoTitle] = useState(initialProduct?.seo_title ?? "");
  const [seoDescription, setSeoDescription] = useState(initialProduct?.seo_description ?? "");

  // Flags & Order
  const [isFeatured, setIsFeatured] = useState(initialProduct?.is_featured ?? false);
  const [isActive, setIsActive] = useState(initialProduct?.is_active ?? true);
  const [displayOrder, setDisplayOrder] = useState(initialProduct?.display_order ?? 0);

  const [imageUrls, setImageUrls] = useState<string[]>(
    initialProduct?.images?.map((img) => img.url).filter(Boolean) ?? [],
  );

  // UI state
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate suggested SKU if creating new
  const handleNameChange = (val: string) => {
    setName(val);
    if (!initialProduct && !sku) {
      const initials = val
        .split(" ")
        .map((w) => w[0])
        .filter(Boolean)
        .join("")
        .toUpperCase()
        .slice(0, 3);
      if (initials) {
        setSku(`${initials}001`);
      }
    }
  };

  // Instant pricing computation
  const basePaise = Math.round(basePriceRupees * 100);
  const advanceValid = Number.isInteger(advancePercent) && advancePercent >= 1 && advancePercent <= 90;
  const pricing = calculatePricing(
    basePaise > 0 ? basePaise : 100,
    1,
    gstPercent > 0 ? gstPercent : 18,
    advanceValid ? advancePercent : 10,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!sku.trim()) {
      setError("SKU is required.");
      return;
    }
    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    if (basePriceRupees <= 0) {
      setError("Base price must be greater than zero.");
      return;
    }

    if (!Number.isInteger(advancePercent) || advancePercent < 1 || advancePercent > 90) {
      setError("Advance to collect must be a whole number from 1 to 90.");
      return;
    }

    setLoading(true);

    const imagesPayload = imageUrls
      .map((url) => url.trim())
      .filter(Boolean)
      .map((url, index) => ({
        url,
        alt_text: `${name} photo ${index + 1}`,
      }));

    if (imagesPayload.length === 0) {
      setError("Add at least one product image.");
      return;
    }

    try {
      const endpoint = initialProduct
        ? `/api/admin/products/${initialProduct.id}`
        : "/api/admin/products";

      const method = initialProduct ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          sku: sku.trim().toUpperCase(),
          category_id: categoryId,
          base_price_rupees: basePriceRupees,
          gst_percent: gstPercent,
          advance_percent: advancePercent,
          min_units: minUnits,
          booking_window_days: bookingWindowDays,
          delivery_estimate: deliveryEstimate.trim(),
          material: material.trim() || null,
          dimensions: dimensions.trim() || null,
          colour: colour.trim() || null,
          short_description: shortDesc.trim() || null,
          full_description: fullDesc.trim() || null,
          video_url: videoUrl.trim() || null,
          is_featured: isFeatured,
          is_active: isActive,
          display_order: displayOrder,
          seo_title: seoTitle.trim() || null,
          seo_description: seoDescription.trim() || null,
          variants: variantValues
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
            .map((value) => ({ name: "Colour", value })),
          images: imagesPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      router.push("/admin/products");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error saving product");
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryName =
    categories.find((c) => c.id === categoryId)?.name ?? "Furniture";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/products"
            className="text-xs text-muted hover:text-ink inline-flex items-center gap-1 mb-1"
          >
            ← Back to Products
          </Link>
          <h1 className="font-serif text-3xl font-bold">
            {initialProduct ? "Edit Product" : "Create New Product"}
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="btn btn-ghost text-xs py-2 px-3"
        >
          {showPreview ? "Hide Preview" : "Show Live Preview"}
        </button>
      </div>

      {error ? (
        <div className="rounded-2xl bg-rose-50 p-4 text-xs text-rose-800 border border-rose-200">
          {error}
        </div>
      ) : null}

      {/* Live Preview Card */}
      {showPreview ? (
        <div className="rounded-2xl border-2 border-accent/40 bg-[#edf3f9] p-5 shadow-sm">
          <p className="text-xs uppercase tracking-wider text-accent font-bold mb-3">
            Customer-Facing Preview
          </p>
          <div className="card max-w-sm mx-auto overflow-hidden">
            <div className="relative aspect-[4/3] w-full bg-[#e5ebf2]">
              <ProductPhoto src={imageUrls[0]} alt={name || "Product preview"} sizes="320px" />
            </div>
            <div className="p-4 space-y-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-muted">
                {selectedCategoryName}
              </span>
              <h3 className="font-serif text-lg font-bold">
                {name || "Product Name"}
              </h3>
              <p className="font-serif text-xl font-bold text-ink">
                {formatInrFromPaise(pricing.basePaise)}{" "}
                <span className="text-xs text-muted font-normal">+ {gstPercent}% GST</span>
              </p>
              <div className="rounded-xl bg-[#edf3f9] p-2.5 text-xs">
                <div className="flex justify-between font-semibold">
                  <span>Pay {pricing.advancePercent}% today:</span>
                  <span className="text-accent">{formatInrFromPaise(pricing.advancePaise)}</span>
                </div>
                <div className="flex justify-between text-muted text-[11px] mt-1">
                  <span>Balance after arrival:</span>
                  <span>{formatInrFromPaise(pricing.balancePaise)}</span>
                </div>
              </div>
              <p className="text-[11px] text-muted">
                Requires {minUnits} booked units to confirm factory order. Delivery in{" "}
                {deliveryEstimate} after threshold.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Information */}
        <div className="card p-5 space-y-4">
          <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
            1. Basic Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Product Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Modern 6-Seater Dining Table"
                className="field text-sm"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                SKU / Product ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. DT001"
                className="field text-sm font-mono uppercase"
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              required
              className="field text-sm"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Short Description
            </label>
            <input
              type="text"
              placeholder="Brief summary shown on product cards"
              className="field text-sm"
              value={shortDesc}
              onChange={(e) => setShortDesc(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Full Description
            </label>
            <textarea
              rows={3}
              placeholder="Detailed description of materials, workmanship, and usage"
              className="field text-sm"
              value={fullDesc}
              onChange={(e) => setFullDesc(e.target.value)}
            />
          </div>
        </div>

        {/* Section 2: Pricing & Advance Calculator (Defaults applied automatically) */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-line/60 pb-2">
            <h2 className="font-serif text-lg font-bold">2. Pricing & Taxes</h2>
            <span className="text-[11px] text-muted">
              Advance is chosen per product
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Base Furniture Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="100"
                step="100"
                required
                className="field text-base font-bold font-mono"
                value={basePriceRupees}
                onChange={(e) => setBasePriceRupees(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[11px] text-muted mt-1">Excludes GST</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                GST Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="field text-sm font-mono"
                value={gstPercent}
                onChange={(e) => setGstPercent(parseFloat(e.target.value) || 0)}
              />
              <p className="text-[11px] text-muted mt-1">Default 18% standard furniture GST</p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Advance to collect (%) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="90"
                step="1"
                required
                className="field text-base font-bold font-mono"
                value={advancePercent}
                onChange={(e) => setAdvancePercent(parseInt(e.target.value, 10) || 0)}
              />
              <p className="text-[11px] text-muted mt-1">
                Whole number from 1 to 90. 10 means the customer pays 10% today. This is not the same for every product.
                The remaining {advanceValid ? 100 - pricing.advancePercent : "—"}% is due after arrival.
              </p>
              {advanceValid ? null : (
                <p className="mt-1 text-[11px] font-semibold text-rose-700">Enter a whole number from 1 to 90.</p>
              )}
            </div>
          </div>

          {/* Computed Breakdown Callout */}
          <div className="rounded-xl bg-[#edf3f9] p-4 text-xs space-y-2">
            <p className="font-semibold text-ink text-sm">Automated Price Breakdown (Per Unit):</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div>
                <span className="text-muted block">Base Price:</span>
                <span className="font-bold text-sm">{formatInrFromPaise(pricing.basePaise)}</span>
              </div>
              <div>
                <span className="text-muted block">GST ({gstPercent}%):</span>
                <span className="font-bold text-sm">{formatInrFromPaise(pricing.gstPaise)}</span>
              </div>
              <div>
                <span className="text-muted block">{pricing.advancePercent}% Advance Today:</span>
                <span className="font-bold text-sm text-accent">{formatInrFromPaise(pricing.advancePaise)}</span>
              </div>
              <div>
                <span className="text-muted block">{100 - pricing.advancePercent}% Balance Due:</span>
                <span className="font-bold text-sm">{formatInrFromPaise(pricing.balancePaise)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Group Booking Thresholds & Defaults */}
        <div className="card p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-line/60 pb-2">
            <h2 className="font-serif text-lg font-bold">3. Group Booking Rules</h2>
            <span className="text-[11px] text-muted">Prefilled with standard 5-unit / 7-day rule</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Minimum Units Required
              </label>
              <input
                type="number"
                min="1"
                required
                className="field text-sm font-mono"
                value={minUnits}
                onChange={(e) => setMinUnits(parseInt(e.target.value) || 5)}
              />
              <p className="text-[11px] text-muted mt-1">Default: 5 units</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Booking Window (Days)
              </label>
              <input
                type="number"
                min="1"
                required
                className="field text-sm font-mono"
                value={bookingWindowDays}
                onChange={(e) => setBookingWindowDays(parseInt(e.target.value) || 7)}
              />
              <p className="text-[11px] text-muted mt-1">Default: 7 days</p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Delivery Estimate
              </label>
              <input
                type="text"
                required
                className="field text-sm"
                value={deliveryEstimate}
                onChange={(e) => setDeliveryEstimate(e.target.value)}
              />
              <p className="text-[11px] text-muted mt-1">Default: 30–40 days</p>
            </div>
          </div>
        </div>

        {/* Section 4: Specifications */}
        <div className="card p-5 space-y-4">
          <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
            4. Material & Specifications
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Material
              </label>
              <input
                type="text"
                placeholder="e.g. Engineered Wood + Metal"
                className="field text-sm"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Dimensions
              </label>
              <input
                type="text"
                placeholder="e.g. 180 × 90 × 75 cm"
                className="field text-sm"
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
                Colour
              </label>
              <input
                type="text"
                placeholder="e.g. Natural Oak / Black"
                className="field text-sm"
                value={colour}
                onChange={(e) => setColour(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Section 5: Media (Images & Video) */}
        <div className="card p-5 space-y-4">
          <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
            5. Product Media
          </h2>
          <MediaUploader urls={imageUrls} onChange={setImageUrls} />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Colour / option variants
            </label>
            <input
              type="text"
              placeholder="Natural Oak, Walnut, Black"
              className="field text-sm"
              value={variantValues}
              onChange={(e) => setVariantValues(e.target.value)}
            />
            <p className="text-[11px] text-muted mt-1">Comma-separated. Shown as selectable options on the product page.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Product Video URL (YouTube / Embed URL, Optional)
            </label>
            <input
              type="url"
              placeholder="https://www.youtube.com/embed/..."
              className="field text-sm"
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
            />
          </div>
        </div>

        <div className="card p-5 space-y-4">
          <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
            6. SEO
          </h2>
          <input
            className="field text-sm"
            placeholder="Page title"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
          />
          <textarea
            className="field text-sm min-h-20"
            placeholder="Meta description"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
          />
        </div>

        {/* Section 6: Visibility & Publishing */}
        <div className="card p-5 space-y-4">
          <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
            7. Publishing Settings
          </h2>

          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded accent-accent"
              />
              <span className="text-sm font-semibold">Active (Available for booking)</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="h-4 w-4 rounded accent-accent"
              />
              <span className="text-sm font-semibold">Featured on Homepage</span>
            </label>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted uppercase font-semibold">Display Order:</span>
              <input
                type="number"
                className="field text-sm w-20"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        {/* Sticky Mobile Save Action Bar */}
        <div className="sticky bottom-16 md:bottom-4 z-20 rounded-2xl bg-[#edf3f9] p-3 shadow-lg border border-line flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="btn btn-ghost text-xs py-2.5 px-3"
          >
            {showPreview ? "Hide Preview" : "Preview"}
          </button>

          <div className="flex items-center gap-2">
            <Link href="/admin/products" className="btn btn-ghost text-sm py-2 px-3">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary text-sm py-2.5 px-6 font-semibold disabled:opacity-50"
            >
              {loading
                ? "Saving..."
                : initialProduct
                ? "Update Product"
                : "Publish Product"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
