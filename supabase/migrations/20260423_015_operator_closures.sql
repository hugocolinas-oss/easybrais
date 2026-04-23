-- Allow operator role to read, insert, update and delete daily_cash_closures

DROP POLICY IF EXISTS "manager_read_closures" ON daily_cash_closures;
CREATE POLICY "staff_read_closures"
  ON daily_cash_closures FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "manager_insert_closures" ON daily_cash_closures;
CREATE POLICY "staff_insert_closures"
  ON daily_cash_closures FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "manager_update_closures" ON daily_cash_closures;
CREATE POLICY "staff_update_closures"
  ON daily_cash_closures FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "staff_delete_closures" ON daily_cash_closures;
CREATE POLICY "staff_delete_closures"
  ON daily_cash_closures FOR DELETE TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'));
