import { LegalPage } from "@/components/layout/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = { title: "Terms and conditions" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms and conditions">
      <p>
        By booking on this website you agree to the group-order model: the advance percentage shown on the product, a
        5-unit minimum, a 7-day booking window, and the remaining balance after arrival in Hyderabad.
      </p>
      <p>
        Displayed prices are furniture prices plus GST. Delivery is extra. Pickup is available in Hyderabad.
      </p>
      <p>
        {SITE.brand} is a customer-facing brand operated by {SITE.legalName}, GSTIN {SITE.gstin}. These terms do not create
        extra legal claims beyond the booking model described on this site.
      </p>
    </LegalPage>
  );
}
