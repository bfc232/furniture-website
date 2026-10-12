"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UnitAdjustmentModal({
  campaignId,
  productName,
  sku,
  paidUnits,
  manualUnits,
  qualifyingUnits,
  minUnits,
  isOpen,
  onClose,
}: {
  campaignId: string;
  productName: string;
  sku: string;
  paidUnits: number;
  manualUnits: number;
  qualifyingUnits: number;
  minUnits: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [newTotal, setNewTotal] = useState<number>(qualifyingUnits);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const difference = newTotal - qualifyingUnits;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason || reason.trim().length < 3) {
      setError("Please provide a legitimate reason (at least 3 characters).");
      return;
    }

    if (newTotal < 0) {
      setError("Total qualifying units cannot be negative.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/adjust`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newTotal,
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust unit count");
      }

      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Adjustment failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-[#f7f3ed] p-6 shadow-2xl border border-line animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold">Manual Unit Adjustment</h2>
            <p className="text-xs text-muted mt-0.5">
              {productName} (SKU: {sku})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-[#efe7dc] p-3 text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted">Paid Units (Real Customer Payments):</span>
            <span className="font-mono font-medium">{paidUnits}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Current Manual Adjustment:</span>
            <span className="font-mono font-medium">
              {manualUnits >= 0 ? `+${manualUnits}` : manualUnits}
            </span>
          </div>
          <div className="flex justify-between border-t border-line/60 pt-1 font-semibold text-ink">
            <span>Total Qualifying Units:</span>
            <span className="font-mono text-sm">
              {qualifyingUnits} / {minUnits}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              New Qualifying Total Units
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0"
                step="1"
                required
                className="field text-lg font-mono font-bold w-32"
                value={newTotal}
                onChange={(e) => setNewTotal(parseInt(e.target.value) || 0)}
              />
              <span className="text-sm font-medium">
                {difference > 0 ? (
                  <span className="text-emerald-700 font-semibold">+{difference} units</span>
                ) : difference < 0 ? (
                  <span className="text-amber-700 font-semibold">{difference} units</span>
                ) : (
                  <span className="text-muted">No change</span>
                )}
              </span>
            </div>
            {newTotal >= minUnits && qualifyingUnits < minUnits ? (
              <p className="text-xs text-emerald-700 mt-1.5 font-medium">
                ✓ This adjustment will achieve the {minUnits}-unit threshold and transition the campaign to Order Confirmed!
              </p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Reason for Adjustment <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g., Offline corporate booking for 2 units, Tarnaka walk-in order, correction..."
              className="field text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-[11px] text-muted mt-1 leading-normal">
              Internal audit log requirement. Not displayed to customers.
            </p>
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
              disabled={loading || difference === 0}
              className="btn btn-primary text-sm py-2 px-5 disabled:opacity-50"
            >
              {loading ? "Recording..." : "Save Adjustment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
