DROP POLICY IF EXISTS "staff_write_accommodations" ON accommodations;
CREATE POLICY "staff_write_accommodations"
  ON accommodations FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('chofer', 'operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "staff_update_accommodations" ON accommodations;
CREATE POLICY "staff_update_accommodations"
  ON accommodations FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('chofer', 'operator', 'manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('chofer', 'operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "staff_manage_daily_routes" ON daily_routes;
CREATE POLICY "staff_manage_daily_routes" ON daily_routes
  FOR ALL TO authenticated
  USING  (public.current_user_role() IN ('chofer', 'operator', 'manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('chofer', 'operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "staff_manage_route_stops" ON daily_route_stops;
CREATE POLICY "staff_manage_route_stops" ON daily_route_stops
  FOR ALL TO authenticated
  USING  (public.current_user_role() IN ('chofer', 'operator', 'manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('chofer', 'operator', 'manager', 'admin'));;
