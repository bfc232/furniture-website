"use client";

import { useEffect, useState } from "react";

export function Countdown({
  endsAt,
  serverNowMs,
}: {
  endsAt: string | null;
  /** Server timestamp when the page was rendered — aligns the countdown with booking deadlines. */
  serverNowMs?: number;
}) {
  const [nowMs, setNowMs] = useState<number | null>(serverNowMs ?? null);

  useEffect(() => {
    const clientStart = Date.now();
    const serverStart = serverNowMs ?? clientStart;

    const sync = () => {
      setNowMs(serverStart + (Date.now() - clientStart));
    };

    sync();
    const timer = setInterval(sync, 60_000);
    return () => clearInterval(timer);
  }, [endsAt, serverNowMs]);

  if (!endsAt) {
    return <p className="text-sm text-muted">Starts after the first paid booking.</p>;
  }
  if (nowMs === null) {
    return <p className="text-sm text-muted">Checking booking window…</p>;
  }

  const remaining = new Date(endsAt).getTime() - nowMs;
  if (remaining <= 0) return <p className="text-sm">Booking window has closed.</p>;

  const days = Math.floor(remaining / 86_400_000);
  const hours = Math.floor((remaining % 86_400_000) / 3_600_000);
  return (
    <p className="text-sm">
      Booking closes in <strong>{days}d {hours}h</strong>
    </p>
  );
}
