-- Per-product advance. Existing products stay at 10% until an admin changes them.
alter table public.products
  add column if not exists advance_percent numeric(5,2) not null default 10
  check (advance_percent >= 1 and advance_percent <= 90);

-- Sample variation so the catalog is not locked to 10% on every product.
update public.products set advance_percent = 15 where sku in ('SF001', 'CT001');
update public.products set advance_percent = 20 where sku = 'GC001';
