-- Harden privileged helpers against search_path manipulation and accidental
-- exposure through Postgres' default EXECUTE grant to PUBLIC.
DROP FUNCTION IF EXISTS public.set_runtime_secret(text, text, text);

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS public.staff_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT profile.role
  FROM public.user_profiles AS profile
  WHERE profile.auth_user_id = (SELECT auth.uid())
    AND profile.active = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION private.current_user_role() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION private.current_user_role() TO authenticated, service_role;

-- Keep the existing policy API stable without exposing a SECURITY DEFINER
-- function in the Data API's public schema.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.staff_role
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT private.current_user_role();
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_profiles (auth_user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Drivers need operational actions, but never direct accommodation management.
DROP POLICY IF EXISTS "staff_write_accommodations" ON public.accommodations;
CREATE POLICY "staff_write_accommodations"
  ON public.accommodations FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "staff_update_accommodations" ON public.accommodations;
CREATE POLICY "staff_update_accommodations"
  ON public.accommodations FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));

-- These tables contain PII, prices, payment state and the audit trail. Direct
-- writes through the Data API made it possible to bypass field-level checks in
-- Server Actions. Mutations now go through trusted server code using service_role.
DROP POLICY IF EXISTS "staff_insert_customers" ON public.customers;
DROP POLICY IF EXISTS "staff_update_customers" ON public.customers;
DROP POLICY IF EXISTS "staff_insert_bookings" ON public.bookings;
DROP POLICY IF EXISTS "staff_update_bookings" ON public.bookings;
DROP POLICY IF EXISTS "staff_insert_booking_items" ON public.booking_items;
DROP POLICY IF EXISTS "staff_update_booking_items" ON public.booking_items;
DROP POLICY IF EXISTS "staff_insert_booking_events" ON public.booking_events;

-- A driver previously inherited full-row SELECT access to customer, booking and
-- item tables (including email and prices). Keep full reads for office staff and
-- expose only the operational projection required by drivers through RPCs below.
DROP POLICY IF EXISTS "staff_read_customers" ON public.customers;
CREATE POLICY "office_staff_read_customers"
  ON public.customers FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "staff_read_bookings" ON public.bookings;
CREATE POLICY "office_staff_read_bookings"
  ON public.bookings FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "staff_read_booking_items" ON public.booking_items;
CREATE POLICY "office_staff_read_booking_items"
  ON public.booking_items FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "staff_read_booking_events" ON public.booking_events;
CREATE POLICY "office_staff_read_booking_events"
  ON public.booking_events FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'));

-- RLS controls rows, not columns. Restrict anonymous accommodation reads so
-- internal notes and contact details cannot be requested directly from PostgREST.
REVOKE SELECT ON TABLE public.accommodations FROM anon;
GRANT SELECT (
  id,
  external_code,
  name,
  display_name,
  stage_name,
  town,
  route_name,
  address,
  lat,
  lng,
  active,
  visible_in_reservations,
  reservation_notes,
  sort_order,
  route_stage_id
) ON public.accommodations TO anon;

CREATE OR REPLACE FUNCTION public.get_operational_items(target_date date)
RETURNS TABLE (
  id uuid,
  service_date date,
  bags_count integer,
  overweight_bags_count integer,
  operational_status text,
  pickup_name text,
  dropoff_name text,
  booking_id uuid,
  booking_code text,
  booking_status text,
  source_channel text,
  payment_status text,
  payment_method text,
  incident_reason text,
  customer_name text,
  customer_phone text,
  notes_customer text,
  notes_internal text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    item.id,
    item.service_date,
    item.bags_count,
    item.overweight_bags_count,
    item.operational_status::text,
    pickup.name,
    dropoff.name,
    booking.id,
    booking.booking_code,
    booking.status::text,
    booking.source_channel::text,
    booking.payment_status::text,
    booking.payment_method,
    booking.incident_reason,
    customer.full_name,
    customer.phone,
    booking.notes_customer,
    booking.notes_internal
  FROM public.booking_items AS item
  JOIN public.bookings AS booking ON booking.id = item.booking_id
  JOIN public.customers AS customer ON customer.id = booking.customer_id
  LEFT JOIN public.accommodations AS pickup ON pickup.id = item.pickup_accommodation_id
  LEFT JOIN public.accommodations AS dropoff ON dropoff.id = item.dropoff_accommodation_id
  WHERE item.service_date = target_date
    AND booking.status::text NOT IN ('cancelled', 'pending_payment', 'payment_expired')
    AND public.current_user_role() IN ('chofer', 'operator', 'manager', 'admin')
  ORDER BY item.operational_status;
$$;

REVOKE ALL ON FUNCTION public.get_operational_items(date) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_operational_items(date) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_route_item_details(item_ids uuid[])
RETURNS TABLE (
  item_id uuid,
  booking_id uuid,
  booking_status text,
  source_channel text,
  payment_status text,
  payment_method text,
  incident_reason text,
  customer_phone text,
  booking_total numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    item.id,
    booking.id,
    booking.status::text,
    booking.source_channel::text,
    booking.payment_status::text,
    booking.payment_method,
    booking.incident_reason,
    customer.phone,
    CASE
      WHEN public.current_user_role() IN ('operator', 'manager', 'admin')
        THEN booking.total_amount
      ELSE NULL
    END
  FROM public.booking_items AS item
  JOIN public.bookings AS booking ON booking.id = item.booking_id
  JOIN public.customers AS customer ON customer.id = booking.customer_id
  WHERE item_ids IS NOT NULL
    AND cardinality(item_ids) BETWEEN 1 AND 500
    AND item.id = ANY(item_ids)
    AND public.current_user_role() IN ('chofer', 'operator', 'manager', 'admin');
$$;

REVOKE ALL ON FUNCTION public.get_route_item_details(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_route_item_details(uuid[]) TO authenticated, service_role;

-- Durable, atomic throttling for unauthenticated booking creation. Only the
-- service role can call the function or access its hashed fingerprints.
CREATE TABLE public.booking_rate_limits (
  fingerprint       text PRIMARY KEY
                    CHECK (fingerprint ~ '^(ip|email):[0-9a-f]{64}$'),
  window_started_at timestamptz NOT NULL DEFAULT now(),
  attempts          integer NOT NULL DEFAULT 1 CHECK (attempts > 0)
);

ALTER TABLE public.booking_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.booking_rate_limits FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.consume_booking_rate_limit(
  rate_key text,
  max_attempts integer DEFAULT 10,
  window_seconds integer DEFAULT 900
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  allowed boolean;
BEGIN
  IF rate_key IS NULL OR rate_key !~ '^(ip|email):[0-9a-f]{64}$' THEN
    RAISE EXCEPTION 'Invalid rate-limit key';
  END IF;
  IF max_attempts < 1 OR max_attempts > 100 OR window_seconds < 60 OR window_seconds > 86400 THEN
    RAISE EXCEPTION 'Invalid rate-limit configuration';
  END IF;

  INSERT INTO public.booking_rate_limits AS limits (
    fingerprint,
    window_started_at,
    attempts
  )
  VALUES (rate_key, clock_timestamp(), 1)
  ON CONFLICT (fingerprint) DO UPDATE
  SET
    window_started_at = CASE
      WHEN limits.window_started_at <= clock_timestamp() - make_interval(secs => window_seconds)
        THEN clock_timestamp()
      ELSE limits.window_started_at
    END,
    attempts = CASE
      WHEN limits.window_started_at <= clock_timestamp() - make_interval(secs => window_seconds)
        THEN 1
      ELSE limits.attempts + 1
    END
  RETURNING attempts <= max_attempts INTO allowed;

  RETURN allowed;
END;
$$;

REVOKE ALL ON FUNCTION public.consume_booking_rate_limit(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_booking_rate_limit(text, integer, integer)
  TO service_role;
