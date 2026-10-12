import { requireAdmin } from "@/lib/auth/admin";
import { SITE } from "@/lib/site";
import { hasSupabaseConfig } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await requireAdmin();

  const supabaseConfigured = hasSupabaseConfig();
  const razorpayConfigured = Boolean(
    process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET
  );
  const phonepeConfigured = Boolean(
    process.env.PHONEPE_MERCHANT_ID && process.env.PHONEPE_SALT_KEY
  );

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-serif text-3xl font-bold">Admin Settings & Info</h1>
        <p className="text-xs text-muted mt-0.5">
          Company legal registration, system configuration, and admin management
        </p>
      </div>

      {/* Logged in Admin Profile */}
      <div className="card p-5 space-y-3">
        <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
          Current Admin Session
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-muted block">Signed In As:</span>
            <span className="font-semibold text-sm">{session.admin.email}</span>
          </div>
          <div>
            <span className="text-muted block">Display Name:</span>
            <span className="font-semibold text-sm">
              {session.admin.display_name || "Administrator"}
            </span>
          </div>
          <div>
            <span className="text-muted block">Admin ID:</span>
            <span className="font-mono text-muted">{session.admin.id}</span>
          </div>
        </div>
      </div>

      {/* Company Legal Information */}
      <div className="card p-5 space-y-3">
        <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
          Company & Legal Information
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-muted block">Customer-Facing Brand:</span>
            <span className="font-semibold text-sm">{SITE.brand}</span>
          </div>
          <div>
            <span className="text-muted block">Legal Entity Name:</span>
            <span className="font-semibold text-sm">{SITE.legalName}</span>
          </div>
          <div>
            <span className="text-muted block">GSTIN:</span>
            <span className="font-mono text-sm font-bold">{SITE.gstin}</span>
          </div>
          <div>
            <span className="text-muted block">Official Email:</span>
            <span className="font-semibold text-sm">{SITE.email}</span>
          </div>
          <div>
            <span className="text-muted block">Official WhatsApp:</span>
            <span className="font-semibold text-sm">{SITE.whatsappDisplay}</span>
          </div>
          <div>
            <span className="text-muted block">Warehouse & Pickup Location:</span>
            <span className="text-sm">
              {SITE.pickupLines.join(", ")}
            </span>
          </div>
        </div>
      </div>

      {/* Integration Status */}
      <div className="card p-5 space-y-3">
        <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
          System Integrations Status
        </h2>
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-xl bg-[#edf3f9]">
            <div>
              <p className="font-semibold text-sm">Supabase PostgreSQL & Auth</p>
              <p className="text-muted text-[11px]">Database, Row Level Security, RPC stored procedures</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 font-bold ${
                supabaseConfigured
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {supabaseConfigured ? "Connected" : "Keys Pending in .env"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#edf3f9]">
            <div>
              <p className="font-semibold text-sm">Razorpay Payment Gateway</p>
              <p className="text-muted text-[11px]">Advance orders, signature verification, webhooks</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 font-bold ${
                razorpayConfigured
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {razorpayConfigured ? "Configured" : "Credentials Pending"}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-[#edf3f9]">
            <div>
              <p className="font-semibold text-sm">PhonePe Gateway Abstraction</p>
              <p className="text-muted text-[11px]">Clean provider interface ready for switchover</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-0.5 font-bold ${
                phonepeConfigured
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-ink/10 text-muted"
              }`}
            >
              {phonepeConfigured ? "Configured" : "Standby (Optional)"}
            </span>
          </div>
        </div>
      </div>

      {/* Adding Additional Admins Instructions */}
      <div className="card p-5 space-y-3">
        <h2 className="font-serif text-lg font-bold border-b border-line/60 pb-2">
          Adding Authorized Admin Users
        </h2>
        <p className="text-xs text-muted leading-relaxed">
          Admin access requires both a registered user in Supabase Authentication and a corresponding record in the{" "}
          <code className="font-mono bg-line/60 px-1 py-0.5 rounded">public.admins</code> table.
        </p>
        <div className="rounded-xl bg-ink p-4 text-xs font-mono text-[#f5f7fb] overflow-x-auto space-y-1">
          <p className="text-muted">-- Run in Supabase SQL Editor to grant admin access:</p>
          <p>INSERT INTO public.admins (user_id, email, display_name)</p>
          <p>SELECT id, email, &apos;Admin Name&apos;</p>
          <p>FROM auth.users</p>
          <p>WHERE email = &apos;your-admin-email@importnow.in&apos;</p>
          <p>ON CONFLICT (user_id) DO NOTHING;</p>
        </div>
      </div>
    </div>
  );
}
