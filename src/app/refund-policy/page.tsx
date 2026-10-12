import { LegalPage } from "@/components/layout/LegalPage";

export const metadata = { title: "Refund policy" };

export default function RefundPolicyPage() {
  return (
    <LegalPage title="Refund policy">
      <p>An advance is collected to book a product. The percentage is set on that product. On selected products it is 10% of the GST-inclusive price.</p>
      <p>Each product needs a minimum of 5 total units booked. The booking window is 7 days from the first successful paid booking.</p>
      <p>If the minimum threshold is not reached, applicable successful advances for that campaign are refunded.</p>
      <p>
        Once the threshold is reached and supplier ordering proceeds, you cannot cancel through the website for a refund.
      </p>
      <p>The remaining balance is payable after arrival. Delivery charges are additional if you want delivery instead of warehouse pickup.</p>
    </LegalPage>
  );
}
