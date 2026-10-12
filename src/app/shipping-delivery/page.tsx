import { LegalPage } from "@/components/layout/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = { title: "Shipping & delivery" };

export default function ShippingPage() {
  return (
    <LegalPage title="Shipping & delivery">
      <p>
        Warehouse pickup is available at {SITE.pickupLines.join(", ")}.
      </p>
      <p>
        Pan-India delivery can be arranged at an additional delivery or shipping cost. Delivery charges are not included
        in the displayed furniture price.
      </p>
      <p>
        Estimated arrival in Hyderabad is 30–40 days after a product reaches its minimum order quantity. Transit times
        can vary with production and shipping.
      </p>
    </LegalPage>
  );
}
