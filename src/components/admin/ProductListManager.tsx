"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductPhoto } from "@/components/media/ProductPhoto";
import { UnitAdjustmentModal } from "@/components/admin/UnitAdjustmentModal";
import { ResetTimerModal } from "@/components/admin/ResetTimerModal";
import { formatInrFromPaise, calculatePricing, resolveAdvancePercent } from "@/lib/pricing";
import { qualifyingUnits, campaignLabel, campaignProgress } from "@/lib/campaign";
import type { Category, Product } from "@/types";

export function ProductListManager({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [adjustTarget, setAdjustTarget] = useState<{
    campaignId: string;
    productName: string;
    sku: string;
    paidUnits: number;
    manualUnits: number;
    qualifyingUnits: number;
    minUnits: number;
  } | null>(null);

  const [timerTarget, setTimerTarget] = useState<{
    campaignId: string;
    productName: string;
    windowStartedAt: string | null;
    windowEndsAt: string | null;
    bookingWindowDays: number;
  } | null>(null);

  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Filter products
  const filtered = initialProducts.filter((p) => {
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "all" || p.category_id === selectedCategory || p.category?.slug === selectedCategory;

    const matchesStatus =
      statusFilter === "all"
        ? true
        : statusFilter === "active"
        ? p.is_active
        : statusFilter === "inactive"
        ? !p.is_active
        : statusFilter === "threshold"
        ? (p.campaign?.qualifying_units ?? 0) >= (p.campaign?.min_units ?? 5)
        : true;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const handleToggleActive = async (productId: string, currentActive: boolean) => {
    setActionLoadingId(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (!res.ok) throw new Error("Failed to toggle status");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (productId: string, name: string) => {
    if (!confirm(`Delete “${name}”? This cannot be undone.`)) return;
    setActionLoadingId(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDuplicate = async (productId: string) => {
    if (!confirm("Duplicate this product as a draft copy?")) return;
    setActionLoadingId(productId);
    try {
      const res = await fetch(`/api/admin/products/${productId}/duplicate`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to duplicate product");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Duplication failed");
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">Furniture Products</h1>
          <p className="text-xs text-muted mt-0.5">
            Manage pricing, group booking campaigns, and factory order status
          </p>
        </div>
        <Link href="/admin/products/new" className="btn btn-primary text-sm py-2.5 px-4 self-start sm:self-auto">
          + Add Product
        </Link>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
        <div>
          <input
            type="text"
            placeholder="Search by name or SKU..."
            className="field text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <select
            className="field text-sm"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="all">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            className="field text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="threshold">Threshold Reached Only</option>
          </select>
        </div>
      </div>

      {/* Product List Cards */}
      <div className="space-y-3 pt-2">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="font-serif text-lg text-muted">No products match your criteria</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCategory("all");
                setStatusFilter("all");
              }}
              className="btn btn-ghost text-xs mt-3"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          filtered.map((product) => {
            const pricing = calculatePricing(
              product.base_price_paise,
              1,
              product.gst_percent,
              resolveAdvancePercent(product.advance_percent),
            );
            const campaign = product.campaign;
            const booked = qualifyingUnits(campaign);
            const min = campaign?.min_units ?? product.min_units;
            const paid = campaign?.paid_units ?? 0;
            const manual = campaign?.manual_adjustment_units ?? 0;
            const isQualified = booked >= min;
            const primaryImg = product.images?.[0]?.url;

            return (
              <div
                key={product.id}
                className={`card p-4 transition-shadow hover:shadow-md ${
                  !product.is_active ? "opacity-75 bg-[#e9eef5]/60" : ""
                }`}
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Thumbnail */}
                  <div className="relative h-28 w-full sm:h-28 sm:w-28 shrink-0 overflow-hidden rounded-xl bg-[#edf3f9] border border-line">
                    <ProductPhoto src={primaryImg} alt={product.name} sizes="112px" />
                    {!product.is_active ? (
                      <span className="absolute top-2 left-2 rounded bg-ink/80 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Inactive
                      </span>
                    ) : product.is_featured ? (
                      <span className="absolute top-2 left-2 rounded bg-accent px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        Featured
                      </span>
                    ) : null}
                  </div>

                  {/* Product & Campaign Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex flex-wrap items-start justify-between gap-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-muted">
                            SKU: {product.sku}
                          </span>
                          <span className="text-[11px] text-muted">•</span>
                          <span className="text-[11px] text-muted">
                            {product.category?.name ?? "General"}
                          </span>
                        </div>
                        <h2 className="font-serif text-xl font-bold text-ink truncate mt-0.5">
                          {product.name}
                        </h2>
                      </div>

                      {/* Pricing Breakdown */}
                      <div className="text-right">
                        <p className="font-serif text-lg font-bold">
                          {formatInrFromPaise(product.base_price_paise)}
                          <span className="text-xs text-muted font-normal"> + {product.gst_percent}% GST</span>
                        </p>
                        <p className="text-[11px] text-muted">
                          Total: {formatInrFromPaise(pricing.totalPaise)} • {pricing.advancePercent}% advance: {formatInrFromPaise(pricing.advancePaise)}
                        </p>
                      </div>
                    </div>

                    {/* Booking Progress Tracker */}
                    <div className="rounded-xl bg-[#edf3f9] p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">
                            Qualifying: {booked} / {min} units
                          </span>
                          <span className="text-[11px] text-muted">
                            Paid units: {paid}
                            {manual !== 0 ? ` · Manual adjustment: ${manual > 0 ? "+" : ""}${manual}` : ""}
                          </span>
                        </div>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isQualified
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {campaignLabel(campaign?.status ?? "OPEN")}
                        </span>
                      </div>

                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line">
                        <div
                          className={`h-full ${isQualified ? "bg-emerald-600" : "bg-accent"}`}
                          style={{ width: `${campaignProgress(campaign)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-muted">
                        <span>
                          {campaign?.window_ends_at
                            ? `Window closes: ${new Date(campaign.window_ends_at).toLocaleDateString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}`
                            : "Window starts on 1st booking"}
                        </span>
                        <span>Delivery: {product.delivery_estimate}</span>
                      </div>
                    </div>

                    {/* Mobile-friendly action buttons */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="btn btn-ghost text-xs py-1.5 px-3"
                      >
                        Edit Details
                      </Link>

                      <Link
                        href={`/product/${product.slug}`}
                        target="_blank"
                        className="btn btn-ghost text-xs py-1.5 px-3"
                      >
                        View Live ↗
                      </Link>

                      {campaign ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setAdjustTarget({
                                campaignId: campaign.id,
                                productName: product.name,
                                sku: product.sku,
                                paidUnits: paid,
                                manualUnits: manual,
                                qualifyingUnits: booked,
                                minUnits: min,
                              })
                            }
                            className="btn btn-ghost text-xs py-1.5 px-3"
                          >
                            Adjust Units
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setTimerTarget({
                                campaignId: campaign.id,
                                productName: product.name,
                                windowStartedAt: campaign.window_started_at,
                                windowEndsAt: campaign.window_ends_at,
                                bookingWindowDays: campaign.booking_window_days,
                              })
                            }
                            className="btn btn-ghost text-xs py-1.5 px-3"
                          >
                            Reset Timer
                          </button>
                        </>
                      ) : null}

                      <button
                        type="button"
                        onClick={() => handleDuplicate(product.id)}
                        disabled={actionLoadingId === product.id}
                        className="btn btn-ghost text-xs py-1.5 px-3"
                      >
                        Duplicate
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(product.id, product.name)}
                        disabled={actionLoadingId === product.id}
                        className="btn btn-ghost text-xs py-1.5 px-3 text-rose-800"
                      >
                        Delete
                      </button>

                      <button
                        type="button"
                        onClick={() => handleToggleActive(product.id, product.is_active)}
                        disabled={actionLoadingId === product.id}
                        className={`text-xs font-semibold py-1.5 px-3 rounded-full transition-colors ml-auto ${
                          product.is_active
                            ? "text-rose-700 hover:bg-rose-50"
                            : "text-emerald-700 hover:bg-emerald-50"
                        }`}
                      >
                        {product.is_active ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Unit Adjustment Modal */}
      {adjustTarget ? (
        <UnitAdjustmentModal
          {...adjustTarget}
          isOpen={true}
          onClose={() => setAdjustTarget(null)}
        />
      ) : null}

      {/* Reset Timer Modal */}
      {timerTarget ? (
        <ResetTimerModal
          {...timerTarget}
          isOpen={true}
          onClose={() => setTimerTarget(null)}
        />
      ) : null}
    </div>
  );
}
