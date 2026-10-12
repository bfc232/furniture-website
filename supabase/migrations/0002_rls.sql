alter table public.admins enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.booking_campaigns enable row level security;
alter table public.bookings enable row level security;
alter table public.payments enable row level security;
alter table public.refunds enable row level security;
alter table public.unit_adjustments enable row level security;
alter table public.order_status_history enable row level security;
alter table public.admin_audit_logs enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admins a
    where a.user_id = auth.uid()
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated, anon;

drop policy if exists "admins_self_select" on public.admins;
create policy "admins_self_select" on public.admins
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists "categories_public_read" on public.categories;
create policy "categories_public_read" on public.categories
  for select using (is_active = true or public.is_admin());

drop policy if exists "categories_admin_write" on public.categories;
create policy "categories_admin_write" on public.categories
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "products_public_read" on public.products;
create policy "products_public_read" on public.products
  for select using (is_active = true or public.is_admin());

drop policy if exists "products_admin_write" on public.products;
create policy "products_admin_write" on public.products
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "images_public_read" on public.product_images;
create policy "images_public_read" on public.product_images
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.is_active = true or public.is_admin())
    )
  );

drop policy if exists "images_admin_write" on public.product_images;
create policy "images_admin_write" on public.product_images
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "variants_public_read" on public.product_variants;
create policy "variants_public_read" on public.product_variants
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_id and (p.is_active = true or public.is_admin())
    )
  );

drop policy if exists "variants_admin_write" on public.product_variants;
create policy "variants_admin_write" on public.product_variants
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "campaigns_public_read" on public.booking_campaigns;
create policy "campaigns_public_read" on public.booking_campaigns
  for select using (
    is_current = true
    and exists (
      select 1 from public.products p
      where p.id = product_id and (p.is_active = true or public.is_admin())
    )
  );

drop policy if exists "campaigns_admin_all" on public.booking_campaigns;
create policy "campaigns_admin_all" on public.booking_campaigns
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "bookings_admin_read" on public.bookings;
create policy "bookings_admin_read" on public.bookings
  for select to authenticated
  using (public.is_admin());

drop policy if exists "payments_admin_read" on public.payments;
create policy "payments_admin_read" on public.payments
  for select to authenticated
  using (public.is_admin());

drop policy if exists "refunds_admin_read" on public.refunds;
create policy "refunds_admin_read" on public.refunds
  for select to authenticated
  using (public.is_admin());

drop policy if exists "adjustments_admin_read" on public.unit_adjustments;
create policy "adjustments_admin_read" on public.unit_adjustments
  for select to authenticated
  using (public.is_admin());

drop policy if exists "history_admin_read" on public.order_status_history;
create policy "history_admin_read" on public.order_status_history
  for select to authenticated
  using (public.is_admin());

drop policy if exists "audit_admin_read" on public.admin_audit_logs;
create policy "audit_admin_read" on public.admin_audit_logs
  for select to authenticated
  using (public.is_admin());

insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id) do nothing;

drop policy if exists "product_media_public_read" on storage.objects;
create policy "product_media_public_read" on storage.objects
  for select using (bucket_id = 'product-media');

drop policy if exists "product_media_admin_write" on storage.objects;
create policy "product_media_admin_write" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-media' and public.is_admin())
  with check (bucket_id = 'product-media' and public.is_admin());
