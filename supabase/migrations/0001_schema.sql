-- ImportNow schema

create extension if not exists pgcrypto;

do $$ begin
  create type public.campaign_status as enum (
    'OPEN',
    'THRESHOLD_REACHED',
    'ORDER_PLACED',
    'IN_PRODUCTION',
    'IN_TRANSIT',
    'ARRIVED',
    'READY_FOR_PICKUP',
    'COMPLETED',
    'EXPIRED',
    'REFUND_PENDING',
    'REFUNDED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.booking_status as enum (
    'PENDING_PAYMENT',
    'PAID',
    'PAYMENT_FAILED',
    'CANCELLED',
    'REFUND_PENDING',
    'REFUNDED'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.payment_status as enum (
    'CREATED',
    'AUTHORIZED',
    'CAPTURED',
    'FAILED',
    'REFUNDED'
  );
exception when duplicate_object then null;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id),
  name text not null,
  slug text not null unique,
  sku text not null unique,
  short_description text,
  full_description text,
  base_price_paise bigint not null check (base_price_paise > 0),
  gst_percent numeric(5,2) not null default 18 check (gst_percent >= 0),
  material text,
  dimensions text,
  colour text,
  video_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  min_units integer not null default 5 check (min_units >= 1),
  booking_window_days integer not null default 7 check (booking_window_days >= 1),
  delivery_estimate text not null default '30–40 days',
  display_order integer not null default 0,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt_text text,
  is_primary boolean not null default false,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null default 'Colour',
  value text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.booking_campaigns (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  status public.campaign_status not null default 'OPEN',
  min_units integer not null default 5,
  booking_window_days integer not null default 7,
  paid_units integer not null default 0 check (paid_units >= 0),
  manual_adjustment_units integer not null default 0,
  qualifying_units integer generated always as (paid_units + manual_adjustment_units) stored,
  window_started_at timestamptz,
  window_ends_at timestamptz,
  threshold_reached_at timestamptz,
  is_current boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists booking_campaigns_one_current
  on public.booking_campaigns (product_id)
  where is_current;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  public_ref text not null unique,
  campaign_id uuid not null references public.booking_campaigns(id),
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity >= 1),
  variant_id uuid references public.product_variants(id),
  customer_name text not null,
  customer_mobile text not null,
  customer_whatsapp text not null,
  customer_email text not null,
  address_line text not null,
  city text not null,
  state text not null,
  pincode text not null,
  base_amount_paise bigint not null,
  gst_amount_paise bigint not null,
  total_amount_paise bigint not null,
  advance_amount_paise bigint not null,
  balance_amount_paise bigint not null,
  gst_percent numeric(5,2) not null,
  status public.booking_status not null default 'PENDING_PAYMENT',
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id),
  provider text not null default 'razorpay',
  provider_order_id text unique,
  provider_payment_id text unique,
  amount_paise bigint not null,
  currency text not null default 'INR',
  status public.payment_status not null default 'CREATED',
  idempotency_key text unique,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id),
  payment_id uuid not null references public.payments(id),
  provider text not null default 'razorpay',
  provider_refund_id text unique,
  amount_paise bigint not null,
  status text not null default 'PENDING',
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.unit_adjustments (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.booking_campaigns(id),
  admin_id uuid references public.admins(id),
  previous_count integer not null,
  new_count integer not null,
  difference integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.booking_campaigns(id),
  admin_id uuid references public.admins(id),
  from_status public.campaign_status,
  to_status public.campaign_status not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references public.admins(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists products_slug_idx on public.products (slug);
create index if not exists products_sku_idx on public.products (sku);
create index if not exists products_category_idx on public.products (category_id);
create index if not exists products_active_featured_idx on public.products (is_active, is_featured, display_order);
create index if not exists categories_slug_idx on public.categories (slug);
create index if not exists campaigns_status_idx on public.booking_campaigns (status);
create index if not exists campaigns_product_idx on public.booking_campaigns (product_id);
create index if not exists campaigns_window_ends_idx on public.booking_campaigns (window_ends_at);
create index if not exists bookings_campaign_idx on public.bookings (campaign_id);
create index if not exists bookings_product_idx on public.bookings (product_id);
create index if not exists bookings_created_idx on public.bookings (created_at desc);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_mobile_idx on public.bookings (customer_mobile);
create index if not exists bookings_email_idx on public.bookings (customer_email);
create index if not exists payments_booking_idx on public.payments (booking_id);
create index if not exists payments_provider_order_idx on public.payments (provider_order_id);
create index if not exists payments_provider_payment_idx on public.payments (provider_payment_id);

drop trigger if exists admins_updated_at on public.admins;
create trigger admins_updated_at before update on public.admins
for each row execute function public.set_updated_at();

drop trigger if exists categories_updated_at on public.categories;
create trigger categories_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists products_updated_at on public.products;
create trigger products_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists campaigns_updated_at on public.booking_campaigns;
create trigger campaigns_updated_at before update on public.booking_campaigns
for each row execute function public.set_updated_at();

drop trigger if exists bookings_updated_at on public.bookings;
create trigger bookings_updated_at before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists payments_updated_at on public.payments;
create trigger payments_updated_at before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists refunds_updated_at on public.refunds;
create trigger refunds_updated_at before update on public.refunds
for each row execute function public.set_updated_at();
