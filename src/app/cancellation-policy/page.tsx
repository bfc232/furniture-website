import { LegalPage } from "@/components/layout/LegalPage";

export const metadata = { title: "Cancellation policy" };

export default function CancellationPolicyPage() {
  return (
    <LegalPage title="Cancellation policy">
      <p>
        You may not cancel a confirmed booking through the website after the 5-unit threshold is reached and the supplier
        order proceeds.
      </p>
      <p>
        If a campaign expires without reaching 5 paid units, successful advances are refunded and no cancellation request is
        required.
      </p>
      <p>Unpaid or failed checkouts are not bookings and are not counted toward the unit total.</p>
    </LegalPage>
  );
}
