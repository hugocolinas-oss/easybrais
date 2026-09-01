-- Create a booking header, its line items and its audit event in one transaction.
-- The function is deliberately callable only with the server-side service role.
create or replace function public.create_booking_atomic(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  new_booking_id uuid;
  inserted_items integer;
  expected_items integer;
begin
  if payload is null or jsonb_typeof(payload -> 'items') <> 'array' then
    raise exception 'Booking items must be a JSON array';
  end if;

  expected_items := jsonb_array_length(payload -> 'items');
  if expected_items < 1 or expected_items > 10 then
    raise exception 'A booking must contain between 1 and 10 items';
  end if;

  insert into public.bookings (
    booking_code,
    customer_id,
    booking_type,
    service_date,
    status,
    source_channel,
    language,
    notes_customer,
    notes_internal,
    subtotal_amount,
    discount_amount,
    extra_weight_amount,
    total_amount,
    payment_method
  ) values (
    payload ->> 'booking_code',
    (payload ->> 'customer_id')::uuid,
    (payload ->> 'booking_type')::public.booking_type,
    (payload ->> 'service_date')::date,
    (payload ->> 'status')::public.booking_status,
    (payload ->> 'source_channel')::public.source_channel,
    payload ->> 'language',
    nullif(payload ->> 'notes_customer', ''),
    payload ->> 'notes_internal',
    (payload ->> 'subtotal_amount')::numeric,
    (payload ->> 'discount_amount')::numeric,
    (payload ->> 'extra_weight_amount')::numeric,
    (payload ->> 'total_amount')::numeric,
    payload ->> 'payment_method'
  )
  returning id into new_booking_id;

  insert into public.booking_items (
    booking_id,
    service_date,
    pickup_accommodation_id,
    dropoff_accommodation_id,
    bags_count,
    overweight_bags_count,
    unit_price,
    line_total,
    operational_status
  )
  select
    new_booking_id,
    item.service_date,
    item.pickup_accommodation_id,
    item.dropoff_accommodation_id,
    item.bags_count,
    item.overweight_bags_count,
    item.unit_price,
    item.line_total,
    'pending'::public.operational_status
  from jsonb_to_recordset(payload -> 'items') as item(
    service_date date,
    pickup_accommodation_id uuid,
    dropoff_accommodation_id uuid,
    bags_count integer,
    overweight_bags_count integer,
    unit_price numeric,
    line_total numeric
  );

  get diagnostics inserted_items = row_count;
  if inserted_items <> expected_items then
    raise exception 'Not all booking items were inserted';
  end if;

  insert into public.booking_events (
    booking_id,
    event_type,
    actor_type,
    payload_json
  ) values (
    new_booking_id,
    'created'::public.event_type,
    'customer'::public.actor_type,
    coalesce(payload -> 'event_payload', '{}'::jsonb)
  );

  return new_booking_id;
end;
$function$;

revoke all on function public.create_booking_atomic(jsonb) from public;
revoke all on function public.create_booking_atomic(jsonb) from anon;
revoke all on function public.create_booking_atomic(jsonb) from authenticated;
grant execute on function public.create_booking_atomic(jsonb) to service_role;
