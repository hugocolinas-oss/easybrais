-- 010: Extend accommodations for admin management
-- Adds display_name, visibility control, internal/reservation notes,
-- sort_order and last_verified_at. Non-destructive — all columns have defaults
-- or are nullable so existing rows remain valid.

-- =========================================================================
-- 1. NEW COLUMNS
-- =========================================================================

ALTER TABLE accommodations
  ADD COLUMN IF NOT EXISTS display_name              text,
  ADD COLUMN IF NOT EXISTS visible_in_reservations   boolean     NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS internal_notes            text,
  ADD COLUMN IF NOT EXISTS reservation_notes         text,
  ADD COLUMN IF NOT EXISTS sort_order                integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_verified_at          timestamptz;

-- Back-fill display_name from name for every existing row where it is NULL
UPDATE accommodations SET display_name = name WHERE display_name IS NULL;

COMMENT ON COLUMN accommodations.display_name            IS 'Name shown to end-users (falls back to name if NULL)';
COMMENT ON COLUMN accommodations.visible_in_reservations IS 'Whether this accommodation appears in the public booking form';
COMMENT ON COLUMN accommodations.internal_notes          IS 'Private notes visible only to staff in the admin panel';
COMMENT ON COLUMN accommodations.reservation_notes       IS 'Notes shown to customers alongside the accommodation';
COMMENT ON COLUMN accommodations.sort_order              IS 'Manual ordering weight — lower values appear first';
COMMENT ON COLUMN accommodations.last_verified_at        IS 'Last date an admin verified this accommodation is still valid';

-- =========================================================================
-- 2. INDEXES (idempotent — skip if they already exist)
-- =========================================================================

-- visible_in_reservations is used to filter the public form
CREATE INDEX IF NOT EXISTS idx_accommodations_visible
  ON accommodations (visible_in_reservations)
  WHERE visible_in_reservations = true;

-- sort_order for ordered listing in admin
CREATE INDEX IF NOT EXISTS idx_accommodations_sort
  ON accommodations (sort_order, name);

-- =========================================================================
-- 3. UPDATE RLS — anon users should only see active + visible accommodations
-- =========================================================================

DROP POLICY IF EXISTS "anon_read_active_accommodations" ON accommodations;
CREATE POLICY "anon_read_active_accommodations"
  ON accommodations FOR SELECT TO anon
  USING (active = true AND visible_in_reservations = true);
