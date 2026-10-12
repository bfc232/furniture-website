import { LegalPage } from "@/components/layout/LegalPage";
import { SITE } from "@/lib/site";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy policy">
      <p>
        We collect the details you submit at checkout: name, mobile, WhatsApp number, email, and address. This is used to
        confirm bookings, process payments, arrange pickup or delivery, and contact you about your order.
      </p>
      <p>
        Payment card data is handled by the payment gateway. We store payment references, not full card numbers.
      </p>
      <p>
        Contact {SITE.email} for privacy questions. {SITE.brand} is operated by {SITE.legalName}.
      </p>
    </LegalPage>
  );
}
