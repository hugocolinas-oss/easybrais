-- ============================================================================
-- Easy Brais — Row Level Security Policies (Beta)
-- ============================================================================
-- Idempotent: safe to re-run. Each policy is dropped before re-creation.
-- ============================================================================

-- Helper function
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS staff_role
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT role FROM public.user_profiles
  WHERE auth_user_id = auth.uid() AND active = true
  LIMIT 1;
$$;

-- ==========================================================================
-- 1. ENABLE RLS
-- ==========================================================================

ALTER TABLE customers             ENABLE ROW LEVEL SECURITY;
ALTER TABLE accommodations        ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_cash_closures   ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles         ENABLE ROW LEVEL SECURITY;

-- ==========================================================================
-- 2. ACCOMMODATIONS
-- ==========================================================================

DROP POLICY IF EXISTS "anon_read_active_accommodations" ON accommodations;
CREATE POLICY "anon_read_active_accommodations"
  ON accommodations FOR SELECT TO anon USING (active = true);

DROP POLICY IF EXISTS "staff_read_accommodations" ON accommodations;
CREATE POLICY "staff_read_accommodations"
  ON accommodations FOR SELECT TO authenticated
  USING (public.current_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "manager_write_accommodations" ON accommodations;
CREATE POLICY "manager_write_accommodations"
  ON accommodations FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('manager', 'admin'));

DROP POLICY IF EXISTS "manager_update_accommodations" ON accommodations;
CREATE POLICY "manager_update_accommodations"
  ON accommodations FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('manager', 'admin'));

-- ==========================================================================
-- 3. CUSTOMERS
-- ==========================================================================

DROP POLICY IF EXISTS "staff_read_customers" ON customers;
CREATE POLICY "staff_read_customers"
  ON customers FOR SELECT TO authenticated
  USING (public.current_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "staff_insert_customers" ON customers;
CREATE POLICY "staff_insert_customers"
  ON customers FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "staff_update_customers" ON customers;
CREATE POLICY "staff_update_customers"
  ON customers FOR UPDATE TO authenticated
  USING (public.current_user_role() IS NOT NULL)
  WITH CHECK (public.current_user_role() IS NOT NULL);

-- ==========================================================================
-- 4. BOOKINGS
-- ==========================================================================

DROP POLICY IF EXISTS "staff_read_bookings" ON bookings;
CREATE POLICY "staff_read_bookings"
  ON bookings FOR SELECT TO authenticated
  USING (public.current_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "staff_insert_bookings" ON bookings;
CREATE POLICY "staff_insert_bookings"
  ON bookings FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "staff_update_bookings" ON bookings;
CREATE POLICY "staff_update_bookings"
  ON bookings FOR UPDATE TO authenticated
  USING (public.current_user_role() IS NOT NULL)
  WITH CHECK (public.current_user_role() IS NOT NULL);

-- ==========================================================================
-- 5. BOOKING_ITEMS
-- ==========================================================================

DROP POLICY IF EXISTS "staff_read_booking_items" ON booking_items;
CREATE POLICY "staff_read_booking_items"
  ON booking_items FOR SELECT TO authenticated
  USING (public.current_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "staff_insert_booking_items" ON booking_items;
CREATE POLICY "staff_insert_booking_items"
  ON booking_items FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "staff_update_booking_items" ON booking_items;
CREATE POLICY "staff_update_booking_items"
  ON booking_items FOR UPDATE TO authenticated
  USING (public.current_user_role() IS NOT NULL)
  WITH CHECK (public.current_user_role() IS NOT NULL);

-- ==========================================================================
-- 6. BOOKING_EVENTS (immutable audit trail)
-- ==========================================================================

DROP POLICY IF EXISTS "staff_read_booking_events" ON booking_events;
CREATE POLICY "staff_read_booking_events"
  ON booking_events FOR SELECT TO authenticated
  USING (public.current_user_role() IS NOT NULL);

DROP POLICY IF EXISTS "staff_insert_booking_events" ON booking_events;
CREATE POLICY "staff_insert_booking_events"
  ON booking_events FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IS NOT NULL);

-- ==========================================================================
-- 7. DAILY_CASH_CLOSURES
-- ==========================================================================

DROP POLICY IF EXISTS "manager_read_closures" ON daily_cash_closures;
CREATE POLICY "manager_read_closures"
  ON daily_cash_closures FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('manager', 'admin'));

DROP POLICY IF EXISTS "manager_insert_closures" ON daily_cash_closures;
CREATE POLICY "manager_insert_closures"
  ON daily_cash_closures FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('manager', 'admin'));

DROP POLICY IF EXISTS "manager_update_closures" ON daily_cash_closures;
CREATE POLICY "manager_update_closures"
  ON daily_cash_closures FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('manager', 'admin'));

-- ==========================================================================
-- 8. USER_PROFILES
-- ==========================================================================

DROP POLICY IF EXISTS "user_read_own_profile" ON user_profiles;
CREATE POLICY "user_read_own_profile"
  ON user_profiles FOR SELECT TO authenticated
  USING (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "admin_read_all_profiles" ON user_profiles;
CREATE POLICY "admin_read_all_profiles"
  ON user_profiles FOR SELECT TO authenticated
  USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_update_profiles" ON user_profiles;
CREATE POLICY "admin_update_profiles"
  ON user_profiles FOR UPDATE TO authenticated
  USING (public.current_user_role() = 'admin')
  WITH CHECK (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "admin_insert_profiles" ON user_profiles;
CREATE POLICY "admin_insert_profiles"
  ON user_profiles FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() = 'admin');
