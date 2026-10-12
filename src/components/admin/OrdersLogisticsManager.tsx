"use client";

import { useState } from "react";
import { OrderStatusModal } from "@/components/admin/OrderStatusModal";
import { campaignLabel, qualifyingUnits } from "@/lib/campaign";
import type { BookingCampaign, CampaignStatus, Product } from "@/types";

type CampaignWithProduct = BookingCampaign & {
  product?: Product | null;
  history?: {
    id: string;
    from_status: CampaignStatus | null;
    to_status: CampaignStatus;
    note: string | null;
    created_at: string;
  }[];
};

export function OrdersLogisticsManager({
  campaigns,
}: {
  campaigns: CampaignWithProduct[];
}) {
  const [targetCampaign, setTargetCampaign] = useState<CampaignWithProduct | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-bold">Logistics & Factory Orders</h1>
        <p className="text-xs text-muted mt-0.5">
          Progress campaigns from Threshold Reached → Chinese Factory Order → Transit → Hyderabad Pickup
        </p>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4 pt-2">
        {campaigns.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="font-serif text-lg text-muted">
              No campaigns have reached the 5-unit threshold yet.
            </p>
            <p className="text-xs text-muted mt-1">
              Once 5 customer units are booked, campaigns appear here automatically for factory ordering.
            </p>
          </div>
        ) : (
          campaigns.map((camp) => {
            const booked = qualifyingUnits(camp);
            const prod = camp.product;

            return (
              <div key={camp.id} className="card p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-line/60 pb-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-muted">
                      SKU: {prod?.sku ?? "N/A"}
                    </span>
                    <h2 className="font-serif text-xl font-bold mt-0.5">
                      {prod?.name ?? "Product Campaign"}
                    </h2>
                    <p className="text-xs text-muted">
                      {booked} qualifying units booked (Min {camp.min_units} units required)
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-accent/15 text-accent px-3 py-1 text-xs font-bold">
                      {campaignLabel(camp.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setTargetCampaign(camp)}
                      className="btn btn-primary text-xs py-2 px-3"
                    >
                      Update Milestone
                    </button>
                  </div>
                </div>

                {/* Milestone Progress Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 text-center text-xs">
                  {[
                    { label: "1. Threshold", s: "THRESHOLD_REACHED" },
                    { label: "2. PO Placed", s: "ORDER_PLACED" },
                    { label: "3. Production", s: "IN_PRODUCTION" },
                    { label: "4. In Transit", s: "IN_TRANSIT" },
                    { label: "5. Arrived Hyd", s: "ARRIVED" },
                    { label: "6. Pickup Ready", s: "READY_FOR_PICKUP" },
                  ].map((step, idx) => {
                    const statusSequence: CampaignStatus[] = [
                      "THRESHOLD_REACHED",
                      "ORDER_PLACED",
                      "IN_PRODUCTION",
                      "IN_TRANSIT",
                      "ARRIVED",
                      "READY_FOR_PICKUP",
                      "COMPLETED",
                    ];
                    const currentIndex = statusSequence.indexOf(camp.status);
                    const stepIndex = statusSequence.indexOf(step.s as CampaignStatus);
                    const isPassed = currentIndex >= stepIndex;
                    const isCurrent = camp.status === step.s;

                    return (
                      <div
                        key={step.s}
                        className={`rounded-xl p-2.5 border transition-colors ${
                          isCurrent
                            ? "border-accent bg-[#efe7dc] font-bold text-accent"
                            : isPassed
                            ? "border-line bg-card text-ink"
                            : "border-line/40 bg-card/40 text-muted opacity-60"
                        }`}
                      >
                        <span className="block text-[11px] leading-tight">
                          {isPassed ? "✓ " : `${idx + 1}. `}
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Logistics Info */}
                <div className="rounded-xl bg-[#efe7dc] p-3 text-xs space-y-1 text-muted">
                  <div className="flex justify-between">
                    <span>Threshold Reached At:</span>
                    <span className="font-mono text-ink">
                      {camp.threshold_reached_at
                        ? new Date(camp.threshold_reached_at).toLocaleDateString("en-IN", {
                            dateStyle: "medium",
                          })
                        : "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Estimated Arrival in Hyderabad:</span>
                    <span className="text-ink font-medium">
                      {prod?.delivery_estimate ?? "30–40 days after threshold"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pickup Location:</span>
                    <span className="text-ink">
                      C Block 106, Saraswathi Apts, Tarnaka, Hyderabad - 500017
                    </span>
                  </div>
                </div>

                {/* Internal Notes History */}
                {camp.history && camp.history.length > 0 ? (
                  <div className="space-y-1.5 border-t border-line/60 pt-2 text-xs">
                    <p className="font-semibold text-muted text-[11px] uppercase tracking-wider">
                      Internal Admin Status History:
                    </p>
                    <div className="space-y-1">
                      {camp.history.map((h) => (
                        <div key={h.id} className="text-xs bg-card p-2 rounded-lg border border-line/40">
                          <div className="flex justify-between text-muted text-[10px]">
                            <span>
                              Changed to <strong>{campaignLabel(h.to_status)}</strong>
                            </span>
                            <span>{new Date(h.created_at).toLocaleDateString("en-IN")}</span>
                          </div>
                          {h.note ? <p className="text-ink mt-0.5">{h.note}</p> : null}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {/* Order Status Modal */}
      {targetCampaign ? (
        <OrderStatusModal
          campaignId={targetCampaign.id}
          productName={targetCampaign.product?.name ?? "Campaign"}
          currentStatus={targetCampaign.status}
          isOpen={true}
          onClose={() => setTargetCampaign(null)}
        />
      ) : null}
    </div>
  );
}
