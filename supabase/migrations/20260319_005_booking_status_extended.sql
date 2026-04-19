-- ============================================================================
-- Easy Brais — Extend booking_status enum for beta operations
-- ============================================================================

ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'in_pickup';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'in_transit';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'delivered';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'incident';
