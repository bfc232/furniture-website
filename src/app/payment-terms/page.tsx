import { LegalPage } from "@/components/layout/LegalPage";

export const metadata = { title: "Payment terms" };

export default function PaymentTermsPage() {
  return (
    <LegalPage title="Payment terms">
      <p>Furniture prices are shown as a base price plus GST.</p>
      <p>
        You pay the advance percentage shown on the product. That percentage is taken from the GST-inclusive total. On
        selected products it is 10%. The remaining balance is payable after the furniture reaches Hyderabad.
      </p>
      <p>Payments are processed through a payment gateway. A booking is confirmed only after successful payment verification.</p>
    </LegalPage>
  );
}
