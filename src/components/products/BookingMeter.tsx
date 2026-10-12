export function BookingMeter({
  booked,
  min,
  confirmed = false,
  compact = false,
}: {
  booked: number;
  min: number;
  confirmed?: boolean;
  compact?: boolean;
}) {
  const safeMin = Math.max(min, 1);
  const filled = Math.max(0, Math.min(booked, safeMin));
  const needed = Math.max(0, safeMin - booked);
  const done = confirmed || booked >= safeMin;
  const percent = Math.min(100, Math.round((Math.max(booked, 0) / safeMin) * 100));
  const useSegments = safeMin <= 10;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <p className={compact ? "text-sm font-bold leading-5 text-emerald-950" : "font-serif text-2xl leading-tight text-emerald-950 sm:text-3xl"}>
          {done ? "Minimum reached" : `${booked} booked · ${needed} more needed`}
        </p>
        <p className={`shrink-0 font-bold text-emerald-800 ${compact ? "text-sm" : "text-base"}`}>{percent}%</p>
      </div>
      {useSegments ? (
        <div
          className={`flex gap-1.5 ${compact ? "mt-2" : "mt-3"}`}
          role="progressbar"
          aria-valuenow={filled}
          aria-valuemin={0}
          aria-valuemax={safeMin}
          aria-label={`${booked} of ${safeMin} units booked`}
        >
          {Array.from({ length: safeMin }, (_, index) => (
            <span
              key={index}
              className={`flex-1 rounded-full ${compact ? "h-3" : "h-4"} ${
                index < filled ? "bg-emerald-600" : "bg-white ring-1 ring-emerald-300"
              }`}
            />
          ))}
        </div>
      ) : (
        <div
          className={`overflow-hidden rounded-full bg-white ring-1 ring-emerald-200 ${compact ? "mt-2 h-3" : "mt-3 h-4"}`}
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${booked} of ${safeMin} units booked`}
        >
          <div className="h-full rounded-full bg-emerald-600" style={{ width: `${booked > 0 ? Math.max(percent, 6) : 0}%` }} />
        </div>
      )}
      <p className={`font-semibold text-emerald-900 ${compact ? "mt-1.5 text-xs" : "mt-2 text-sm"}`}>
        {booked} of {safeMin} units
        {done ? " · group order ready" : ""}
      </p>
    </div>
  );
}
