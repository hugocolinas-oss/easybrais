-- 011: Add Stripe tracking fields to bookings
-- Non-destructive — all columns are nullable

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS stripe_session_id    text,
  ADD COLUMN IF NOT EXISTS stripe_payment_intent text;

COMMENT ON COLUMN bookings.stripe_session_id     IS 'Stripe Checkout Session ID for payment traceability';
COMMENT ON COLUMN bookings.stripe_payment_intent IS 'Stripe PaymentIntent ID after successful payment';

CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session
  ON bookings (stripe_session_id)
  WHERE stripe_session_id IS NOT NULL;

-- Add 'payment_expired' to event_type enum if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'payment_expired' AND enumtypid = 'event_type'::regtype) THEN
    ALTER TYPE event_type ADD VALUE 'payment_expired';
  END IF;
END $$;
