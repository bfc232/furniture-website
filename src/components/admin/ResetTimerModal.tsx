"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ResetTimerModal({
  campaignId,
  productName,
  windowStartedAt,
  windowEndsAt,
  bookingWindowDays,
  isOpen,
  onClose,
}: {
  campaignId: string;
  productName: string;
  windowStartedAt: string | null;
  windowEndsAt: string | null;
  bookingWindowDays: number;
  isOpen: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [restartFromNow, setRestartFromNow] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason || reason.trim().length < 3) {
      setError("Please provide a legitimate reason for resetting the timer.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaignId}/reset-timer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: reason.trim(),
          restartFromNow,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to reset booking timer");
      }

      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl bg-[#f7f3ed] p-6 shadow-2xl border border-line animate-in fade-in zoom-in-95">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-serif text-2xl font-bold">Booking Window Control</h2>
            <p className="text-xs text-muted mt-0.5">{productName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink text-xl leading-none p-1"
          >
            ✕
          </button>
        </div>

        <div className="mt-4 rounded-xl bg-[#efe7dc] p-3 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted">Window Started:</span>
            <span className="font-mono">
              {windowStartedAt
                ? new Date(windowStartedAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Not started yet (starts on 1st booking)"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Current Deadline:</span>
            <span className="font-mono font-medium">
              {windowEndsAt
                ? new Date(windowEndsAt).toLocaleString("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })
                : "Awaiting 1st booking"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted">Window Duration:</span>
            <span>{bookingWindowDays} days</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="radio"
                name="timerOption"
                checked={restartFromNow}
                onChange={() => setRestartFromNow(true)}
                className="accent-accent"
              />
              <span>Restart {bookingWindowDays}-day window starting from now</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium mt-2">
              <input
                type="radio"
                name="timerOption"
                checked={!restartFromNow}
                onChange={() => setRestartFromNow(false)}
                className="accent-accent"
              />
              <span>Reset to idle (wait for next paid booking to start timer)</span>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1">
              Reason for Reset <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="e.g., Extended campaign for weekend showroom event, campaign relaunch..."
              className="field text-sm"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <p className="text-[11px] text-muted mt-1 leading-normal">
              Server-side timestamps are used. Internal audit logged.
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
              {loading ? "Resetting..." : "Confirm Reset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
