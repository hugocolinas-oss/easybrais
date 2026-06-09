-- 020: Persist incident reason directly on bookings for cross-view visibility

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS incident_reason text,
  ADD COLUMN IF NOT EXISTS incident_reported_at timestamptz;

COMMENT ON COLUMN bookings.incident_reason IS 'Latest incident reason recorded for the booking';
COMMENT ON COLUMN bookings.incident_reported_at IS 'Timestamp of the latest incident reported for the booking';

CREATE INDEX IF NOT EXISTS idx_bookings_incident_reported_at
  ON bookings (incident_reported_at)
  WHERE incident_reported_at IS NOT NULL;
