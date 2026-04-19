-- ============================================================================
-- Easy Brais — Extend event_type enum for operations
-- ============================================================================

ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'item_status_changed';
ALTER TYPE event_type ADD VALUE IF NOT EXISTS 'incident_reported';
