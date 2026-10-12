export const DEFAULT_GST_PERCENT = 18;
export const ADVANCE_PERCENT = 10;
export const MIN_ADVANCE_PERCENT = 1;
export const MAX_ADVANCE_PERCENT = 90;
export const DEFAULT_MIN_UNITS = 5;
export const DEFAULT_BOOKING_WINDOW_DAYS = 7;
export const DEFAULT_DELIVERY_ESTIMATE = "30–40 days";

export type PricingBreakdown = {
  quantity: number;
  gstPercent: number;
  advancePercent: number;
  unitBasePaise: number;
  basePaise: number;
  gstPaise: number;
  totalPaise: number;
  advancePaise: number;
  balancePaise: number;
};

function roundPaise(value: number): number {
  return Math.round(value);
}

export function rupeesToPaise(rupees: number): number {
  return roundPaise(rupees * 100);
}

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

/** Uses the product's advance when it is a whole number from 1 to 90. Otherwise the default is 10. */
export function resolveAdvancePercent(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return ADVANCE_PERCENT;
  const whole = Math.round(parsed);
  if (whole < MIN_ADVANCE_PERCENT || whole > MAX_ADVANCE_PERCENT) return ADVANCE_PERCENT;
  return whole;
}

export function parseAdvancePercent(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < MIN_ADVANCE_PERCENT || parsed > MAX_ADVANCE_PERCENT) {
    throw new Error(
      `Advance must be a whole number from ${MIN_ADVANCE_PERCENT} to ${MAX_ADVANCE_PERCENT}.`,
    );
  }
  return parsed;
}

export function advanceSharePercent(advancePaise: number, totalPaise: number): number {
  if (!Number.isFinite(totalPaise) || totalPaise <= 0) return ADVANCE_PERCENT;
  return resolveAdvancePercent(Math.round((advancePaise / totalPaise) * 100));
}

export function calculatePricing(
  unitBasePaise: number,
  quantity: number,
  gstPercent: number = DEFAULT_GST_PERCENT,
  advancePercent: number = ADVANCE_PERCENT,
): PricingBreakdown {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new Error("Quantity must be a whole number of at least 1");
  }
  if (!Number.isFinite(unitBasePaise) || unitBasePaise <= 0) {
    throw new Error("Invalid product price");
  }
  if (!Number.isFinite(gstPercent) || gstPercent < 0) {
    throw new Error("Invalid GST percentage");
  }

  const resolvedAdvance = resolveAdvancePercent(advancePercent);
  const basePaise = roundPaise(unitBasePaise * quantity);
  const gstPaise = roundPaise(basePaise * (gstPercent / 100));
  const totalPaise = basePaise + gstPaise;
  const advancePaise = roundPaise(totalPaise * (resolvedAdvance / 100));
  const balancePaise = totalPaise - advancePaise;

  return {
    quantity,
    gstPercent,
    advancePercent: resolvedAdvance,
    unitBasePaise,
    basePaise,
    gstPaise,
    totalPaise,
    advancePaise,
    balancePaise,
  };
}

export function formatInrFromPaise(paise: number): string {
  const rupees = paiseToRupees(paise);
  const hasPaise = Math.round(paise) % 100 !== 0;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: hasPaise ? 2 : 0,
  }).format(rupees);
}

export function formatInrFromRupees(rupees: number): string {
  return formatInrFromPaise(rupeesToPaise(rupees));
}
