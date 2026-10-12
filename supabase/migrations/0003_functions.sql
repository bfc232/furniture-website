create or replace function public.confirm_paid_booking(
  p_provider_order_id text,
  p_provider_payment_id text,
  p_raw_payload jsonb default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment public.payments%rowtype;
  v_booking public.bookings%rowtype;
  v_campaign public.booking_campaigns%rowtype;
  v_qualifying integer;
  v_duplicate boolean := false;
begin
  if p_provider_payment_id is not null then
    select * into v_payment
    from public.payments
    where provider_payment_id = p_provider_payment_id
    for update;
  end if;

  if v_payment.id is null then
    select * into v_payment
    from public.payments
    where provider_order_id = p_provider_order_id
    for update;
  end if;

  if v_payment.id is null then
    raise exception 'Payment not found';
  end if;

  if v_payment.status = 'CAPTURED' then
    v_duplicate := true;
  else
    if v_payment.provider_payment_id is not null
       and v_payment.provider_payment_id <> p_provider_payment_id then
      raise exception 'Payment ID mismatch';
    end if;

    update public.payments
    set
      provider_payment_id = p_provider_payment_id,
      status = 'CAPTURED',
      raw_payload = coalesce(p_raw_payload, raw_payload),
      updated_at = now()
    where id = v_payment.id;
  end if;

  select * into v_booking
  from public.bookings
  where id = v_payment.booking_id
  for update;

  if v_booking.status <> 'PAID' then
    update public.bookings
    set status = 'PAID', paid_at = coalesce(paid_at, now()), updated_at = now()
    where id = v_booking.id;

    select * into v_campaign
    from public.booking_campaigns
    where id = v_booking.campaign_id
    for update;

    update public.booking_campaigns
    set
      paid_units = paid_units + v_booking.quantity,
      window_started_at = coalesce(window_started_at, now()),
      window_ends_at = coalesce(
        window_ends_at,
        now() + make_interval(days => booking_window_days)
      ),
      updated_at = now()
    where id = v_campaign.id
    returning * into v_campaign;

    v_qualifying := v_campaign.paid_units + v_campaign.manual_adjustment_units;

    if v_campaign.status = 'OPEN' and v_qualifying >= v_campaign.min_units then
      update public.booking_campaigns
      set
        status = 'THRESHOLD_REACHED',
        threshold_reached_at = now(),
        updated_at = now()
      where id = v_campaign.id;
    end if;
  else
    v_duplicate := true;
  end if;

  return jsonb_build_object(
    'ok', true,
    'duplicate', v_duplicate,
    'booking_id', v_booking.id,
    'public_ref', v_booking.public_ref
  );
end;
$$;

create or replace function public.expire_due_campaigns()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  r record;
begin
  for r in
    select id
    from public.booking_campaigns
    where status = 'OPEN'
      and is_current = true
      and window_ends_at is not null
      and window_ends_at < now()
      and (paid_units + manual_adjustment_units) < min_units
    for update skip locked
  loop
    update public.booking_campaigns
    set status = 'REFUND_PENDING', updated_at = now()
    where id = r.id;

    update public.bookings
    set status = 'REFUND_PENDING', updated_at = now()
    where campaign_id = r.id
      and status = 'PAID';

    insert into public.refunds (booking_id, payment_id, amount_paise, status)
    select b.id, p.id, b.advance_amount_paise, 'PENDING'
    from public.bookings b
    join public.payments p on p.booking_id = b.id and p.status = 'CAPTURED'
    where b.campaign_id = r.id
      and b.status = 'REFUND_PENDING'
    on conflict (booking_id) do nothing;

    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

create or replace function public.apply_unit_adjustment(
  p_campaign_id uuid,
  p_new_total integer,
  p_reason text,
  p_admin_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.booking_campaigns%rowtype;
  v_previous integer;
  v_new_manual integer;
  v_diff integer;
  v_qualifying integer;
begin
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'A reason is required';
  end if;
  if p_new_total < 0 then
    raise exception 'Unit count cannot be negative';
  end if;

  select * into v_campaign
  from public.booking_campaigns
  where id = p_campaign_id
  for update;

  if v_campaign.id is null then
    raise exception 'Campaign not found';
  end if;

  v_previous := v_campaign.paid_units + v_campaign.manual_adjustment_units;
  v_new_manual := p_new_total - v_campaign.paid_units;
  v_diff := p_new_total - v_previous;

  update public.booking_campaigns
  set
    manual_adjustment_units = v_new_manual,
    updated_at = now()
  where id = p_campaign_id
  returning * into v_campaign;

  insert into public.unit_adjustments (
    campaign_id, admin_id, previous_count, new_count, difference, reason
  ) values (
    p_campaign_id, p_admin_id, v_previous, p_new_total, v_diff, trim(p_reason)
  );

  insert into public.admin_audit_logs (admin_id, action, entity_type, entity_id, metadata)
  values (
    p_admin_id,
    'unit_adjustment',
    'booking_campaign',
    p_campaign_id,
    jsonb_build_object(
      'previous', v_previous,
      'new', p_new_total,
      'difference', v_diff,
      'reason', trim(p_reason)
    )
  );

  v_qualifying := v_campaign.paid_units + v_campaign.manual_adjustment_units;

  if v_campaign.status = 'OPEN' and v_qualifying >= v_campaign.min_units then
    update public.booking_campaigns
    set
      status = 'THRESHOLD_REACHED',
      threshold_reached_at = coalesce(threshold_reached_at, now()),
      updated_at = now()
    where id = p_campaign_id;
  end if;

  return jsonb_build_object(
    'ok', true,
    'paid_units', v_campaign.paid_units,
    'manual_adjustment_units', v_new_manual,
    'qualifying_units', v_qualifying
  );
end;
$$;

create or replace function public.reset_campaign_window(
  p_campaign_id uuid,
  p_reason text,
  p_admin_id uuid,
  p_restart_from_now boolean default true
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_campaign public.booking_campaigns%rowtype;
  v_start timestamptz;
  v_end timestamptz;
begin
  if p_reason is null or length(trim(p_reason)) < 3 then
    raise exception 'A reason is required';
  end if;

  select * into v_campaign
  from public.booking_campaigns
  where id = p_campaign_id
  for update;

  if v_campaign.id is null then
    raise exception 'Campaign not found';
  end if;

  if p_restart_from_now then
    v_start := now();
    v_end := now() + make_interval(days => v_campaign.booking_window_days);
  else
    v_start := null;
    v_end := null;
  end if;

  update public.booking_campaigns
  set
    status = case
      when status in ('EXPIRED', 'REFUND_PENDING', 'REFUNDED') then 'OPEN'::public.campaign_status
      when status = 'OPEN' then 'OPEN'::public.campaign_status
      else status
    end,
    window_started_at = v_start,
    window_ends_at = v_end,
    updated_at = now()
  where id = p_campaign_id
  returning * into v_campaign;

  insert into public.admin_audit_logs (admin_id, action, entity_type, entity_id, metadata)
  values (
    p_admin_id,
    'campaign_timer_reset',
    'booking_campaign',
    p_campaign_id,
    jsonb_build_object(
      'reason', trim(p_reason),
      'window_started_at', v_start,
      'window_ends_at', v_end
    )
  );

  return jsonb_build_object(
    'ok', true,
    'window_started_at', v_campaign.window_started_at,
    'window_ends_at', v_campaign.window_ends_at,
    'status', v_campaign.status
  );
end;
$$;

create or replace function public.ensure_product_campaign()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.booking_campaigns (
    product_id, status, min_units, booking_window_days, is_current
  )
  values (new.id, 'OPEN', new.min_units, new.booking_window_days, true);
  return new;
end;
$$;

drop trigger if exists products_ensure_campaign on public.products;
create trigger products_ensure_campaign
after insert on public.products
for each row execute function public.ensure_product_campaign();

revoke all on function public.confirm_paid_booking(text, text, jsonb) from public, anon, authenticated;
revoke all on function public.expire_due_campaigns() from public, anon, authenticated;
revoke all on function public.apply_unit_adjustment(uuid, integer, text, uuid) from public, anon, authenticated;
revoke all on function public.reset_campaign_window(uuid, text, uuid, boolean) from public, anon, authenticated;

grant execute on function public.confirm_paid_booking(text, text, jsonb) to service_role;
grant execute on function public.expire_due_campaigns() to service_role;
grant execute on function public.apply_unit_adjustment(uuid, integer, text, uuid) to service_role;
grant execute on function public.reset_campaign_window(uuid, text, uuid, boolean) to service_role;
