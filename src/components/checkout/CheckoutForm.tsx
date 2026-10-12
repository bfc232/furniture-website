"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { QuantityStepper } from "@/components/products/QuantityStepper";
import { calculatePricing, formatInrFromPaise, resolveAdvancePercent } from "@/lib/pricing";
import { SITE } from "@/lib/site";
import { generalWhatsAppUrl } from "@/lib/whatsapp";
import { checkoutSchema, fieldErrorsFromZod } from "@/lib/validation";
import type { Product } from "@/types";

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
  }
}

type RazorpayCheckoutOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  notes: Record<string, string>;
  theme: { color: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};

type FieldName =
  | "customerName"
  | "customerMobile"
  | "customerWhatsapp"
  | "customerEmail"
  | "addressLine"
  | "city"
  | "state"
  | "pincode";

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load payment checkout."));
    document.body.appendChild(script);
  });
}

export function CheckoutForm({
  product,
  initialQty,
  initialVariantId,
}: {
  product: Product;
  initialQty: number;
  initialVariantId?: string;
}) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(Math.max(1, initialQty));
  const [variantId, setVariantId] = useState(initialVariantId ?? product.variants?.[0]?.id ?? "");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const [phase, setPhase] = useState<"form" | "config" | "failed">("form");
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  function rotateIdempotencyKey() {
    setIdempotencyKey(crypto.randomUUID());
  }

  function handleQuantityChange(next: number) {
    setQuantity(next);
    rotateIdempotencyKey();
  }

  function handleVariantChange(next: string) {
    setVariantId(next);
    rotateIdempotencyKey();
  }

  const [form, setForm] = useState({
    customerName: "",
    customerMobile: "",
    customerWhatsapp: "",
    customerEmail: "",
    addressLine: "",
    city: "Hyderabad",
    state: "Telangana",
    pincode: "",
  });

  const advance = resolveAdvancePercent(product.advance_percent);
  const pricing = useMemo(
    () => calculatePricing(product.base_price_paise, quantity, Number(product.gst_percent), advance),
    [advance, product.base_price_paise, product.gst_percent, quantity],
  );

  function update(name: FieldName, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
    setPhase("form");
    setFieldErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPhase("form");

    const parsed = checkoutSchema.safeParse({
      productId: product.id,
      quantity,
      variantId: variantId || null,
      ...form,
      idempotencyKey,
    });
    if (!parsed.success) {
      setFieldErrors(fieldErrorsFromZod(parsed.error));
      setError("Please check the highlighted fields.");
      return;
    }
    setFieldErrors({});
    setPending(true);
    try {
      const response = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.fieldErrors && typeof data.fieldErrors === "object") {
          setFieldErrors(data.fieldErrors);
        }
        if (response.status === 503 || String(data.error ?? "").toLowerCase().includes("not configured")) {
          setPhase("config");
          setError(data.error ?? "Payments are not configured yet.");
          setPending(false);
          return;
        }
        throw new Error(data.error ?? "Unable to start checkout.");
      }
      await loadRazorpay();
      if (!window.Razorpay || !data.razorpayKeyId) {
        setPhase("config");
        setError("Payments are not configured yet. Please contact ImportNow on WhatsApp.");
        setPending(false);
        return;
      }
      const checkout = new window.Razorpay({
        key: data.razorpayKeyId,
        amount: data.amountPaise,
        currency: data.currency ?? "INR",
        name: SITE.brand,
        description: `${product.name} · ${advance}% booking`,
        order_id: data.orderId,
        prefill: {
          name: form.customerName,
          email: form.customerEmail,
          contact: form.customerMobile,
        },
        notes: { booking_id: data.bookingId },
        theme: { color: "#f4511e" },
        handler: async (payment) => {
          const verify = await fetch("/api/checkout/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payment),
          });
          const result = await verify.json();
          if (!verify.ok || !result.bookingId) {
            setPhase("failed");
            setError("Payment was not confirmed. Your booking has not been marked paid.");
            setPending(false);
            router.push(`/booking/${data.bookingId}?pending=1`);
            return;
          }
          router.push(`/booking/${result.bookingId}`);
        },
        modal: {
          ondismiss: () => {
            setPending(false);
            setPhase("failed");
            setIdempotencyKey(crypto.randomUUID());
            setError("Payment was not completed. Your booking has not been confirmed.");
          },
        },
      });
      checkout.open();
    } catch (err) {
      setPhase("failed");
      setError(err instanceof Error ? err.message : "Unable to start checkout.");
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]" noValidate>
      <div className="space-y-8">
        <section>
          <h2 className="font-serif text-3xl">Your details</h2>
          <p className="mt-2 text-sm leading-6 text-muted">No account is required. We use these details for the booking and pickup.</p>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="customerName" autoComplete="name" value={form.customerName} error={fieldErrors.customerName} onChange={update} />
            <Field label="Mobile" name="customerMobile" autoComplete="tel" inputMode="tel" value={form.customerMobile} error={fieldErrors.customerMobile} onChange={update} />
            <Field label="WhatsApp" name="customerWhatsapp" inputMode="tel" value={form.customerWhatsapp} error={fieldErrors.customerWhatsapp} onChange={update} />
            <Field label="Email" name="customerEmail" type="email" autoComplete="email" value={form.customerEmail} error={fieldErrors.customerEmail} onChange={update} />
            <div className="sm:col-span-2">
              <Field label="Address" name="addressLine" autoComplete="street-address" value={form.addressLine} error={fieldErrors.addressLine} onChange={update} multiline />
            </div>
            <Field label="City" name="city" autoComplete="address-level2" value={form.city} error={fieldErrors.city} onChange={update} />
            <Field label="State" name="state" autoComplete="address-level1" value={form.state} error={fieldErrors.state} onChange={update} />
            <Field label="Pincode" name="pincode" autoComplete="postal-code" inputMode="numeric" value={form.pincode} error={fieldErrors.pincode} onChange={update} />
          </div>
        </section>

        <section className="border border-line bg-card p-5 text-sm leading-6">
          <h2 className="font-serif text-2xl">Before you pay</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[#334155]">
            <li>You are paying the {advance}% advance only. The remaining {100 - advance}% is still due after the furniture reaches Hyderabad.</li>
            <li>The booking window is {product.booking_window_days} days. We place the supplier order when {product.min_units} units are booked.</li>
            <li>If the threshold is not reached before the window closes, successful advances for this campaign are refunded.</li>
            <li>After the threshold is reached, this booking cannot be cancelled for a refund on the website.</li>
            <li>Expected arrival in Hyderabad is {product.delivery_estimate} after the threshold. That is an estimate, not a guaranteed date. Shipping is extra.</li>
          </ul>
        </section>
      </div>

      <aside className="border border-line bg-ivory p-5 lg:sticky lg:top-28">
        <h2 className="font-serif text-3xl">Booking summary</h2>
        <p className="mt-2 text-base">{product.name}</p>
        <p className="text-sm text-muted">SKU {product.sku}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">Quantity</span>
          <QuantityStepper value={quantity} onChange={handleQuantityChange} />
        </div>
        {product.variants && product.variants.length > 0 ? (
          <label className="mt-4 block">
            <span className="label">Option</span>
            <select className="field" value={variantId} onChange={(event) => handleVariantChange(event.target.value)}>
              {product.variants.map((variant) => (
                <option key={variant.id} value={variant.id}>
                  {variant.name}: {variant.value}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <dl className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
          <SummaryRow label="Base price" value={formatInrFromPaise(pricing.basePaise)} />
          <SummaryRow label={`GST ${pricing.gstPercent}%`} value={formatInrFromPaise(pricing.gstPaise)} />
          <SummaryRow label="GST-inclusive total" value={formatInrFromPaise(pricing.totalPaise)} />
          <SummaryRow label={`Pay today (${pricing.advancePercent}%)`} value={formatInrFromPaise(pricing.advancePaise)} strong />
          <SummaryRow label={`Balance due later (${100 - pricing.advancePercent}%)`} value={formatInrFromPaise(pricing.balancePaise)} />
        </dl>

        {phase === "config" ? (
          <div className="mt-4 border border-accent bg-white p-4 text-sm leading-6">
            <p className="font-semibold">Payments are not configured</p>
            <p className="mt-1">{error}</p>
            <a href={generalWhatsAppUrl()} className="btn btn-ghost mt-3 w-full">
              Contact on WhatsApp
            </a>
          </div>
        ) : null}

        {phase === "failed" && error ? (
          <p className="mt-4 rounded-lg border border-[#dc2626] bg-white px-4 py-3 text-sm text-[#dc2626]" role="alert">
            {error}
          </p>
        ) : null}
        {phase === "form" && error ? (
          <p className="mt-4 text-sm text-[#dc2626]" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="btn btn-primary mt-5 w-full" disabled={pending || phase === "config"}>
          {pending ? "Opening payment…" : phase === "failed" ? `Retry ${formatInrFromPaise(pricing.advancePaise)}` : `Pay ${formatInrFromPaise(pricing.advancePaise)}`}
        </button>
        <p className="mt-3 text-xs leading-5 text-muted">
          Operated by {SITE.legalName}. A booking is confirmed only after the payment is verified on the server.
        </p>
      </aside>
    </form>
  );
}

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${strong ? "text-base font-semibold" : ""}`}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  error,
  onChange,
  type = "text",
  autoComplete,
  inputMode,
  multiline = false,
}: {
  label: string;
  name: FieldName;
  value: string;
  error?: string;
  onChange: (name: FieldName, value: string) => void;
  type?: string;
  autoComplete?: string;
  inputMode?: "tel" | "numeric" | "email" | "text";
  multiline?: boolean;
}) {
  const id = `checkout-${name}`;
  return (
    <div>
      <label className="label" htmlFor={id}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={id}
          className="field min-h-28"
          autoComplete={autoComplete}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(name, event.target.value)}
        />
      ) : (
        <input
          id={id}
          className="field"
          type={type}
          inputMode={inputMode}
          autoComplete={autoComplete}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          onChange={(event) => onChange(name, event.target.value)}
        />
      )}
      {error ? (
        <p id={`${id}-error`} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
