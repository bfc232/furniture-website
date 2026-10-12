import { notFound } from "next/navigation";
import Link from "next/link";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { canAcceptBooking } from "@/lib/campaign";
import { getProductBySlug } from "@/lib/catalog";
import { resolveAdvancePercent } from "@/lib/pricing";

export const metadata = {
  title: "Checkout",
  description: "Pay the advance shown on the product to book furniture. No account required.",
};

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ qty?: string; variant?: string }>;
}) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const bookable = canAcceptBooking(product);
  const qty = Number(query.qty ?? "1");
  const advance = resolveAdvancePercent(product.advance_percent);

  return (
    <div className="container-page py-8 lg:py-12">
      <p className="eyebrow">Checkout</p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">Book with {advance}%</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-[#3f3a36]">
        No account needed. This payment is the advance only. The balance is collected after the furniture reaches
        Hyderabad.
      </p>
      {!bookable.ok ? (
        <div className="mt-8 max-w-xl border border-line bg-card p-5">
          <p>{bookable.reason}</p>
          <Link href={`/product/${product.slug}`} className="btn btn-ghost mt-4">
            Back to product
          </Link>
        </div>
      ) : (
        <div className="mt-8">
          <CheckoutForm
            product={product}
            initialQty={Number.isFinite(qty) && qty >= 1 ? Math.floor(qty) : 1}
            initialVariantId={query.variant}
          />
        </div>
      )}
    </div>
  );
}
