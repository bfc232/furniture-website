import Link from "next/link";
import { formatInrFromPaise } from "@/lib/pricing";
import { createServiceSupabase, hasSupabaseConfig } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/auth/admin";
import { MOCK_PRODUCTS } from "@/lib/mock-data";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  await requireAdmin();

  let activeProductsCount = 0;
  let openCampaignsCount = 0;
  let closeToThresholdCount = 0;
  let expiringSoonCount = 0;
  let thresholdReachedCount = 0;
  let totalBookingsCount = 0;
  let totalAdvancePaise = 0;
  let balancePendingPaise = 0;
  let pendingRefundsCount = 0;
  let ordersInProgressCount = 0;

  if (hasSupabaseConfig()) {
    try {
      const supabase = createServiceSupabase();

      // Products count
      const { count: prodCount } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);
      activeProductsCount = prodCount ?? 0;

      // Campaigns
      const { data: campaigns } = await supabase
        .from("booking_campaigns")
        .select("status, min_units, paid_units, manual_adjustment_units, window_ends_at")
        .eq("is_current", true);

      if (campaigns) {
        const now = Date.now();
        const twoDaysFromNow = now + 48 * 60 * 60 * 1000;

        for (const c of campaigns) {
          const qual = (c.paid_units || 0) + (c.manual_adjustment_units || 0);
          if (c.status === "OPEN") {
            openCampaignsCount++;
            if (qual >= 3 && qual < c.min_units) {
              closeToThresholdCount++;
            }
            if (c.window_ends_at) {
              const ends = new Date(c.window_ends_at).getTime();
              if (ends > now && ends < twoDaysFromNow) {
                expiringSoonCount++;
              }
            }
          } else if (
            [
              "THRESHOLD_REACHED",
              "ORDER_PLACED",
              "IN_PRODUCTION",
              "IN_TRANSIT",
              "ARRIVED",
              "READY_FOR_PICKUP",
              "COMPLETED",
            ].includes(c.status)
          ) {
            thresholdReachedCount++;
            if (
              ["ORDER_PLACED", "IN_PRODUCTION", "IN_TRANSIT", "ARRIVED"].includes(
                c.status
              )
            ) {
              ordersInProgressCount++;
            }
          }
        }
      }

      // Bookings totals
      const { data: bookings } = await supabase
        .from("bookings")
        .select("advance_amount_paise, balance_amount_paise, status");

      if (bookings) {
        for (const b of bookings) {
          if (b.status === "PAID") {
            totalBookingsCount++;
            totalAdvancePaise += Number(b.advance_amount_paise || 0);
            balancePendingPaise += Number(b.balance_amount_paise || 0);
          }
        }
      }

      // Pending refunds
      const { count: refCount } = await supabase
        .from("refunds")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDING");
      pendingRefundsCount = refCount ?? 0;
    } catch {
      // Fallback below
    }
  } else {
    // Demo metrics from mock data
    activeProductsCount = MOCK_PRODUCTS.length;
    openCampaignsCount = 6;
    closeToThresholdCount = 3;
    expiringSoonCount = 2;
    thresholdReachedCount = 2;
    totalBookingsCount = 8;
    totalAdvancePaise = 2840000; // ~₹28,400
    balancePendingPaise = 25560000; // ~₹2,55,600
    pendingRefundsCount = 0;
    ordersInProgressCount = 1;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-sm text-muted mt-1">
            Overview of ImportNow furniture group booking campaigns and logistics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/products/new" className="btn btn-primary text-sm py-2.5 px-4">
            + New Product
          </Link>
          <Link href="/admin/categories" className="btn btn-ghost text-sm py-2.5 px-4">
            Categories
          </Link>
        </div>
      </div>

      {/* Financial Metrics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5 border-l-4 border-l-accent">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">
            Advance collected
          </p>
          <p className="font-serif text-2xl font-bold mt-2 text-ink">
            {formatInrFromPaise(totalAdvancePaise)}
          </p>
          <p className="text-xs text-muted mt-1">
            From {totalBookingsCount} confirmed bookings
          </p>
        </div>

        <div className="card p-5 border-l-4 border-l-amber-600">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">
            Balance Pending (90%)
          </p>
          <p className="font-serif text-2xl font-bold mt-2 text-ink">
            {formatInrFromPaise(balancePendingPaise)}
          </p>
          <p className="text-xs text-muted mt-1">
            Payable upon arrival in Hyderabad
          </p>
        </div>

        <div className="card p-5 border-l-4 border-l-rose-500">
          <p className="text-xs uppercase tracking-wider text-muted font-semibold">
            Pending Refunds
          </p>
          <p className="font-serif text-2xl font-bold mt-2 text-ink">
            {pendingRefundsCount}
          </p>
          <p className="text-xs text-muted mt-1">
            {pendingRefundsCount === 0
              ? "All campaigns on schedule"
              : "Refunds awaiting gateway processing"}
          </p>
        </div>
      </div>

      {/* Campaign Operations Grid */}
      <h2 className="font-serif text-xl font-bold mt-8">Campaign Health & Pipeline</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/admin/products" className="card p-4 hover:border-accent transition-colors">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">
            Active Products
          </p>
          <p className="font-serif text-3xl font-bold mt-2">{activeProductsCount}</p>
          <p className="text-xs text-accent mt-2 font-medium">Browse inventory →</p>
        </Link>

        <Link href="/admin/products" className="card p-4 hover:border-accent transition-colors">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">
            Open Campaigns
          </p>
          <p className="font-serif text-3xl font-bold mt-2 text-emerald-800">{openCampaignsCount}</p>
          <p className="text-xs text-muted mt-2">Within 7-day window</p>
        </Link>

        <Link href="/admin/products" className="card p-4 hover:border-accent transition-colors">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">
            Near Threshold
          </p>
          <p className="font-serif text-3xl font-bold mt-2 text-amber-700">{closeToThresholdCount}</p>
          <p className="text-xs text-muted mt-2">3+ units booked</p>
        </Link>

        <Link href="/admin/products" className="card p-4 hover:border-accent transition-colors">
          <p className="text-xs text-muted uppercase tracking-wider font-semibold">
            Expiring Soon
          </p>
          <p className="font-serif text-3xl font-bold mt-2 text-rose-700">{expiringSoonCount}</p>
          <p className="text-xs text-muted mt-2">&lt; 48 hours left</p>
        </Link>
      </div>

      {/* Logistics & Fulfillment */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mt-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold">Thresholds Reached</h3>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
              {thresholdReachedCount} Qualified
            </span>
          </div>
          <p className="text-xs text-muted mt-2 leading-relaxed">
            Products that met the minimum 5-unit requirement and qualify for Chinese manufacturer ordering.
          </p>
          <Link href="/admin/orders" className="btn btn-ghost text-xs py-2 px-3 mt-4 w-full">
            Manage Factory Orders →
          </Link>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-serif text-lg font-bold">Orders In Progress</h3>
            <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800">
              {ordersInProgressCount} In Pipeline
            </span>
          </div>
          <p className="text-xs text-muted mt-2 leading-relaxed">
            Campaigns currently ordered with China factories or in maritime transit to Hyderabad Tarnaka warehouse.
          </p>
          <Link href="/admin/orders" className="btn btn-ghost text-xs py-2 px-3 mt-4 w-full">
            Track Shipments & Logistics →
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <h2 className="font-serif text-xl font-bold mt-8">Quick Management</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Link href="/admin/products" className="card p-4 hover:bg-[#edf3f9]/50 transition-colors">
          <h4 className="font-semibold text-sm">Product Management</h4>
          <p className="text-xs text-muted mt-1">
            Add, edit, duplicate furniture products. Manage manual unit adjustments and timer resets.
          </p>
        </Link>

        <Link href="/admin/bookings" className="card p-4 hover:bg-[#edf3f9]/50 transition-colors">
          <h4 className="font-semibold text-sm">Customer Bookings</h4>
          <p className="text-xs text-muted mt-1">
            Review individual customer advance payments, customer contact details, balance dues, and refund status.
          </p>
        </Link>

        <Link href="/admin/categories" className="card p-4 hover:bg-[#edf3f9]/50 transition-colors">
          <h4 className="font-semibold text-sm">Category Expansion</h4>
          <p className="text-xs text-muted mt-1">
            Create and edit categories without touching code (e.g. TV Units, Coffee Tables, Recliners).
          </p>
        </Link>
      </div>
    </div>
  );
}
