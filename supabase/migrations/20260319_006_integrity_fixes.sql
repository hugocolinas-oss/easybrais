-- ============================================================================
-- Easy Brais — Sprint 2: Data Integrity Fixes
-- ============================================================================

-- --------------------------------------------------------------------------
-- A1: handle_new_user trigger — ON CONFLICT DO NOTHING
-- Prevents failure when a profile row already exists for the auth user.
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (auth_user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- --------------------------------------------------------------------------
-- A4: email_logs — Revoke DELETE, allow only SELECT and INSERT for staff
-- Audit logs must never be deleted to preserve traceability.
-- --------------------------------------------------------------------------

DROP POLICY IF EXISTS "staff_manage_email_logs" ON email_logs;

CREATE POLICY "staff_read_email_logs"
  ON email_logs
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'));

CREATE POLICY "staff_insert_email_logs"
  ON email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));
