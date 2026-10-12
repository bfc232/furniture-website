"use client";

import { useState } from "react";
import Link from "next/link";
import { formatInrFromPaise } from "@/lib/pricing";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import type { Booking, Product } from "@/types";

type EnrichedBooking = Booking & {
  product?: Product | null;
};

export function BookingListManager({
  bookings,
}: {
  bookings: EnrichedBooking[];
}) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = bookings.filter((b) => {
    const matchesSearch =
      !search ||
      b.public_ref.toLowerCase().includes(search.toLowerCase()) ||
      b.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      b.customer_mobile.includes(search) ||
      b.customer_email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "PAID"
        ? b.status === "PAID"
        : filterStatus === "PENDING"
        ? b.status === "PENDING_PAYMENT"
        : filterStatus === "REFUND_PENDING"
        ? b.status === "REFUND_PENDING"
        : filterStatus === "REFUNDED"
        ? b.status === "REFUNDED"
        : true;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-bold">Customer Bookings</h1>
          <p className="text-xs text-muted mt-0.5">
            Advance payments, remaining balances, and customer details
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
        <input
          type="text"
          placeholder="Search by name, ref, mobile, or email..."
          className="field text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="field text-sm"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">All Booking Statuses ({bookings.length})</option>
          <option value="PAID">Confirmed / Paid Advance</option>
          <option value="PENDING">Pending Payment</option>
          <option value="REFUND_PENDING">Refund Pending</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {/* Bookings Mobile-First Cards */}
      <div className="space-y-3 pt-2">
        {filtered.length === 0 ? (
          <div className="card p-8 text-center">
            <p className="font-serif text-lg text-muted">No bookings match your filter</p>
          </div>
        ) : (
          filtered.map((booking) => {
            const isPaid = booking.status === "PAID";
            const isRefunding =
              booking.status === "REFUND_PENDING" || booking.status === "REFUNDED";

            const waMessage = `Hi ${booking.customer_name}, regarding your ImportNow booking ${booking.public_ref} for ${booking.quantity} unit(s)...`;
            const waUrl = buildWhatsAppUrl(waMessage);

            return (
              <div key={booking.id} className="card p-4 space-y-3">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b border-line/60 pb-2.5">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-ink">
                        {booking.public_ref}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          isPaid
                            ? "bg-emerald-100 text-emerald-800"
                            : isRefunding
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </div>
                    <p className="font-semibold text-sm mt-1">{booking.customer_name}</p>
                    <p className="text-xs text-muted">
                      {booking.customer_mobile} • {booking.customer_email}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-muted">
                      {new Date(booking.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                    <p className="font-serif text-lg font-bold mt-0.5">
                      {formatInrFromPaise(booking.advance_amount_paise)}
                      <span className="text-xs font-normal text-muted"> paid</span>
                    </p>
                    <p className="text-[11px] text-muted">
                      Balance: {formatInrFromPaise(booking.balance_amount_paise)}
                    </p>
                  </div>
                </div>

                {/* Item & Financial Details */}
                <div className="rounded-xl bg-[#edf3f9] p-3 text-xs space-y-1.5">
                  <div className="flex justify-between font-medium">
                    <span>
                      {booking.product?.name ?? "Furniture"} ({booking.quantity} unit{booking.quantity > 1 ? "s" : ""})
                    </span>
                    <span>Total Order: {formatInrFromPaise(booking.total_amount_paise)}</span>
                  </div>
                  <div className="flex justify-between text-muted text-[11px]">
                    <span>
                      Base: {formatInrFromPaise(booking.base_amount_paise)} + GST ({booking.gst_percent}%):{" "}
                      {formatInrFromPaise(booking.gst_amount_paise)}
                    </span>
                    <span>City: {booking.city}, {booking.state}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-1">
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-emerald-800 hover:underline inline-flex items-center gap-1"
                  >
                    <span>💬 WhatsApp Customer</span>
                  </a>

                  <Link
                    href={`/admin/bookings/${booking.id}`}
                    className="btn btn-ghost text-xs py-1.5 px-3"
                  >
                    View Full Details →
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
