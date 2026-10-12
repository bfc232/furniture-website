"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { CampaignStatus } from "@/types";

const ORDER_STATUS_FLOW: { status: CampaignStatus; label: string; desc: string }[] = [
  {
    status: "THRESHOLD_REACHED",
    label: "Threshold Reached",
    desc: "5+ units booked. Qualifies for manufacturer ordering.",
  },
  {
    status: "ORDER_PLACED",
    label: "Order Placed",
    desc: "Purchase order confirmed with Chinese factory.",
  },
  {
    status: "IN_PRODUCTION",
    label: "In Production",
    desc: "Factory is manufacturing the batch in China.",
  },
  {
    status: "IN_TRANSIT",
    label: "In Transit",
    desc: "Container shipped by sea freight towards India.",
  },
  {
    status: "ARRIVED",
    label: "Arrived Hyderabad",
    desc: "Customs cleared, container arrived at Tarnaka warehouse.",
  },
  {
    status: "READY_FOR_PICKUP",
    label: "Ready for Pickup / Delivery",
    desc: "Quality checked. Customers can collect or dispatch arranged.",
  },
  {
    status: "COMPLETED",
    label: "Completed",
    desc: "All customer items delivered or picked up. Campaign closed.",
  },
];

export function OrderStatusModal({
  campaignId,
  productName,
  currentStatus,
  isOpen,
  onClose,
}: {
  campaignId: string;
  productName: string;
  currentStatus: CampaignStatus;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<CampaignStatus>(currentStatus);
  const [internalNote, setInternalNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${campaignId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: selectedStatus,
          note: internalNote.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update logistics status");
      }

      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Status update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-[#f7f3ed] p-6 shadow-2xl border border-line animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold">Update Logistics Status</h2>
            <p className="text-xs text-muted mt-0.5">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Select Current Milestone
            </label>
            <div className="grid gap-2">
              {ORDER_STATUS_FLOW.map((step) => {
                const isSelected = selectedStatus === step.status;
                const isCurrent = currentStatus === step.status;
                return (
                  <label
                    key={step.status}
                    className={`flex items-start gap-3 rounded-xl border p-3 cursor-pointer transition-colors ${
                      isSelected
                        ? "border-accent bg-[#efe7dc]"
                        : "border-line bg-card hover:bg-[#efe7dc]/50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="campaignStatus"
                      value={step.status}
                      checked={isSelected}
                      onChange={() => setSelectedStatus(step.status)}
                      className="mt-1 accent-accent"
                    />
                    <div className="flex-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-ink">{step.label}</span>
                        {isCurrent ? (
                          <span className="text-[10px] rounded-sm bg-ink/10 px-1.5 py-0.5 font-medium text-ink">
                            Current
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted mt-0.5">{step.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Internal Admin Note (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="e.g., Factory PO #CN-8841 sent. Bill of Lading BL-HYD-993. Customer pickup date scheduled..."
              className="field text-sm"
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
            />
            <p className="text-[11px] text-muted mt-1 leading-normal">
              Internal only. Kept in order status history log.
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
              disabled={loading}
              className="btn btn-primary text-sm py-2 px-5 disabled:opacity-50"
            >
              {loading ? "Updating..." : "Update Status"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
