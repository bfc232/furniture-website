import Link from "next/link";

export const metadata = {
  title: "How it works",
  description: "Book furniture with the advance shown on the product. ImportNow orders from the supplier when 5 units are booked.",
};

const steps = [
  {
    title: "Choose your furniture.",
    copy: "Open a product, read the material and dimensions when they are listed, and choose a quantity. There is no maximum quantity.",
  },
  {
    title: "Pay the advance shown on the product.",
    copy: "GST is 18% unless a product states otherwise. The advance is a percentage of the total including GST. On selected pieces that is 10%. You do not need an account.",
  },
  {
    title: "We place the supplier order when at least 5 units are booked.",
    copy: "Only paid bookings, plus adjustments recorded by ImportNow, count toward the five units. The booking window is seven days.",
  },
  {
    title: "The furniture is expected in Hyderabad in 30–40 days after the threshold is reached.",
    copy: "That is an estimate after the minimum quantity is met, not a promised delivery date. Pickup is in Tarnaka. Shipping beyond the warehouse is charged separately.",
  },
];

export default function HowItWorksPage() {
  return (
    <article className="container-page max-w-3xl py-10 lg:py-14">
      <p className="eyebrow">Group booking</p>
      <h1 className="mt-2 font-serif text-4xl md:text-5xl">How it works</h1>
      <p className="mt-5 text-lg leading-8 text-[#3f3a36]">
        Orders from several customers are combined so ImportNow can buy from manufacturers in China. You pay the advance
        shown on the product to reserve your quantity. On selected pieces that is 10%. The rest is due after the furniture
        reaches Hyderabad.
      </p>
      <ol className="mt-10 space-y-8">
        {steps.map((step, index) => (
          <li key={step.title} className="grid gap-2 border-t border-line pt-6 sm:grid-cols-[4rem_1fr]">
            <p className="font-serif text-3xl text-accent">0{index + 1}</p>
            <div>
              <h2 className="font-serif text-2xl">{step.title}</h2>
              <p className="mt-2 text-base leading-7 text-[#3f3a36]">{step.copy}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-10 text-base leading-7">
        If the 5-unit threshold is not reached within the seven-day window, successful advances for that campaign are
        refunded. After the threshold is reached, a booking cannot be cancelled for a refund on the website.
      </p>
      <Link href="/products" className="btn btn-primary mt-8">
        Explore furniture
      </Link>
    </article>
  );
}
