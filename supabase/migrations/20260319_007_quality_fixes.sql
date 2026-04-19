-- ============================================================================
-- Easy Brais — Sprint 3: Quality / Schema Fixes
-- ============================================================================

-- --------------------------------------------------------------------------
-- M7: email_logs.status — migrate from text to enum
-- --------------------------------------------------------------------------

DO $$ BEGIN
  CREATE TYPE email_send_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE email_logs
  ALTER COLUMN status SET DEFAULT 'pending',
  ALTER COLUMN status TYPE email_send_status USING status::email_send_status;

-- --------------------------------------------------------------------------
-- M8: user_profiles.updated_at — add column + auto-update trigger
-- --------------------------------------------------------------------------

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER set_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- --------------------------------------------------------------------------
-- M9: customers — require at least email OR phone
-- --------------------------------------------------------------------------

ALTER TABLE customers
  DROP CONSTRAINT IF EXISTS customers_contact_required;

ALTER TABLE customers
  ADD CONSTRAINT customers_contact_required
    CHECK (email IS NOT NULL OR phone IS NOT NULL);
