"use client";

export function QuantityStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (qty: number) => void;
}) {
  function setQty(next: number) {
    if (!Number.isFinite(next)) return;
    onChange(Math.max(1, Math.floor(next)));
  }

  return (
    <div className="inline-flex items-center border border-line bg-white">
      <button
        type="button"
        className="h-12 w-12 text-xl"
        aria-label="Decrease quantity"
        onClick={() => setQty(value - 1)}
      >
        −
      </button>
      <input
        className="h-12 w-14 border-x border-line bg-white text-center text-base"
        inputMode="numeric"
        value={value}
        aria-label="Quantity"
        onChange={(event) => setQty(Number(event.target.value.replace(/\D/g, "")) || 1)}
      />
      <button
        type="button"
        className="h-12 w-12 text-xl"
        aria-label="Increase quantity"
        onClick={() => setQty(value + 1)}
      >
        +
      </button>
    </div>
  );
}
