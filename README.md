# ImportNow

Premium furniture storefront for **ImportNow**, operated by **VALCOR GLOBAL LLP**. Customers pay **10% GST-inclusive advance**, group orders need **5 units**, and the booking window is **7 days** from the first successful payment.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · Supabase · Razorpay (PhonePe-ready abstraction) · Vercel

## Local setup

1. Copy `.env.example` to `.env.local` and fill in keys.
2. Install and run:

```bash
npm install
npm run dev
```

The storefront uses sample catalog data if Supabase is not configured yet.

## Supabase

In the Supabase SQL editor, run the files in `supabase/migrations/` in order:

1. `0001_schema.sql`
2. `0002_rls.sql`
3. `0003_functions.sql`
4. `0004_seed.sql`

`0002_rls.sql` also creates a public Storage bucket named `product-media` for product photos.

### First admin

1. In Supabase Auth, create a user (email + password). Do not enable public sign-up.
2. Grant admin access:

```sql
INSERT INTO public.admins (user_id, email, display_name)
SELECT id, email, 'ImportNow Admin'
FROM auth.users
WHERE email = 'your-admin-email@importnow.in'
ON CONFLICT (user_id) DO NOTHING;
```

3. Sign in at `/admin/login`.

Replace `/public/logo.svg` with the real ImportNow logo. Keep the same file name and roughly the same aspect ratio.

## Environment variables

See `.env.example`. Required for production:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID` / `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `CRON_SECRET`

Never expose `SUPABASE_SERVICE_ROLE_KEY` or Razorpay secrets to the browser.

## Razorpay

1. Create a Razorpay account (test, then live).
2. Webhook URL: `https://your-domain.com/api/payments/razorpay/webhook`
3. Enable `payment.captured`, `payment.authorized`, `payment.failed`, and `refund.processed`.
4. Campaign expiry and refunds also run on Vercel Cron: `GET /api/cron/campaigns` with `Authorization: Bearer CRON_SECRET`.

Booked units increase only after server-side payment verification.

## Vercel

1. Import the repo.
2. Add the same environment variables.
3. Deploy. Cron in `vercel.json` expires 7-day campaigns every 15 minutes and processes refunds.

## Logo

Drop the final logo at `public/logo.svg` (or update `src/components/layout/BrandMark.tsx` if you use PNG). No layout change is required.
