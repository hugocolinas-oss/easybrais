-- ============================================================================
-- Easy Brais — User Profiles & Staff Roles
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. ENUM
-- --------------------------------------------------------------------------

CREATE TYPE staff_role AS ENUM ('operator', 'manager', 'admin');

-- --------------------------------------------------------------------------
-- 2. TABLE
-- --------------------------------------------------------------------------

CREATE TABLE user_profiles (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id  uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     text        NOT NULL DEFAULT '',
  role          staff_role  NOT NULL DEFAULT 'operator',
  active        boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE user_profiles IS 'Staff profiles linked to Supabase Auth users';

-- --------------------------------------------------------------------------
-- 3. INDEXES
-- --------------------------------------------------------------------------

CREATE INDEX idx_profiles_role   ON user_profiles (role);
CREATE INDEX idx_profiles_active ON user_profiles (active) WHERE active = true;

-- --------------------------------------------------------------------------
-- 4. TRIGGER: auto-create profile on auth.users insert
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (auth_user_id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
