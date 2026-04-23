-- ============================================================================
-- Allow operators to create and update accommodations
-- ============================================================================

DROP POLICY IF EXISTS "manager_write_accommodations" ON accommodations;
CREATE POLICY "staff_write_accommodations"
  ON accommodations FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "manager_update_accommodations" ON accommodations;
CREATE POLICY "staff_update_accommodations"
  ON accommodations FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));
