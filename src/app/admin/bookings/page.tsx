import { requireAdmin } from "@/lib/auth/admin";
import { BookingListManager } from "@/components/admin/BookingListManager";
import { createServiceSupabase, hasSupabaseConfig } from "@/lib/supabase/admin";
import type { Booking, Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function AdminBookingsPage() {
  await requireAdmin();

  let bookings: (Booking & { product?: Product | null })[] = [];

  if (hasSupabaseConfig()) {
    try {
      const supabase = createServiceSupabase();
      const { data } = await supabase
        .from("bookings")
        .select(`
          *,
          products (*)
        `)
        .order("created_at", { ascending: false });

      if (data) {
        bookings = data.map((row) => ({
          ...row,
          product: (Array.isArray(row.products) ? row.products[0] : row.products) as Product | null,
        }));
      }
    } catch {
      bookings = [];
    }
  }

  return <BookingListManager bookings={bookings} />;
}
