-- ============================================================================
-- Easy Brais — Initial Schema Migration
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. ENUMS
-- --------------------------------------------------------------------------

CREATE TYPE booking_type AS ENUM (
  'luggage_transfer',
  'custom'
);

CREATE TYPE booking_status AS ENUM (
  'draft',
  'pending',
  'confirmed',
  'in_progress',
  'completed',
  'cancelled'
);

CREATE TYPE payment_status AS ENUM (
  'pending',
  'paid',
  'partial',
  'refunded'
);

CREATE TYPE email_status AS ENUM (
  'not_sent',
  'sent',
  'failed'
);

CREATE TYPE source_channel AS ENUM (
  'web',
  'phone',
  'email',
  'walk_in',
  'partner',
  'other'
);

CREATE TYPE operational_status AS ENUM (
  'pending',
  'picked_up',
  'in_transit',
  'delivered',
  'failed'
);

CREATE TYPE event_type AS ENUM (
  'created',
  'updated',
  'status_changed',
  'payment_received',
  'email_sent',
  'note_added',
  'cancelled'
);

CREATE TYPE actor_type AS ENUM (
  'system',
  'staff',
  'customer'
);

-- --------------------------------------------------------------------------
-- 2. TABLES
-- --------------------------------------------------------------------------

-- customers -----------------------------------------------------------------

CREATE TABLE customers (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text        NOT NULL,
  email         text,
  phone         text,
  language      text        NOT NULL DEFAULT 'es',
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE customers IS 'End customers who make bookings';

-- accommodations ------------------------------------------------------------

CREATE TABLE accommodations (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_code   text        UNIQUE,
  name            text        NOT NULL,
  stage_name      text,
  town            text,
  route_name      text,
  address         text,
  lat             double precision,
  lng             double precision,
  contact_phone   text,
  contact_email   text,
  active          boolean     NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE accommodations IS 'Pickup/dropoff points along the route';

-- bookings ------------------------------------------------------------------

CREATE TABLE bookings (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_code          text             NOT NULL UNIQUE,
  customer_id           uuid             NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  booking_type          booking_type     NOT NULL DEFAULT 'luggage_transfer',
  service_date          date             NOT NULL,
  status                booking_status   NOT NULL DEFAULT 'pending',
  source_channel        source_channel   NOT NULL DEFAULT 'web',
  language              text             NOT NULL DEFAULT 'es',
  notes_customer        text,
  notes_internal        text,
  subtotal_amount       numeric(10,2)    NOT NULL DEFAULT 0,
  extra_weight_amount   numeric(10,2)    NOT NULL DEFAULT 0,
  discount_amount       numeric(10,2)    NOT NULL DEFAULT 0,
  total_amount          numeric(10,2)    NOT NULL DEFAULT 0,
  payment_status        payment_status   NOT NULL DEFAULT 'pending',
  email_status          email_status     NOT NULL DEFAULT 'not_sent',
  created_at            timestamptz      NOT NULL DEFAULT now(),
  updated_at            timestamptz      NOT NULL DEFAULT now(),

  CONSTRAINT bookings_total_amount_non_negative CHECK (total_amount >= 0),
  CONSTRAINT bookings_subtotal_non_negative     CHECK (subtotal_amount >= 0),
  CONSTRAINT bookings_discount_non_negative     CHECK (discount_amount >= 0),
  CONSTRAINT bookings_extra_weight_non_negative CHECK (extra_weight_amount >= 0)
);

COMMENT ON TABLE bookings IS 'Main booking header — one per customer order';

-- booking_items -------------------------------------------------------------

CREATE TABLE booking_items (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id                uuid               NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  service_date              date               NOT NULL,
  pickup_accommodation_id   uuid               REFERENCES accommodations(id) ON DELETE RESTRICT,
  dropoff_accommodation_id  uuid               REFERENCES accommodations(id) ON DELETE RESTRICT,
  bags_count                integer            NOT NULL DEFAULT 1,
  overweight_bags_count     integer            NOT NULL DEFAULT 0,
  unit_price                numeric(10,2)      NOT NULL DEFAULT 0,
  line_total                numeric(10,2)      NOT NULL DEFAULT 0,
  operational_status        operational_status NOT NULL DEFAULT 'pending',
  created_at                timestamptz        NOT NULL DEFAULT now(),

  CONSTRAINT items_bags_positive          CHECK (bags_count > 0),
  CONSTRAINT items_overweight_non_negative CHECK (overweight_bags_count >= 0),
  CONSTRAINT items_unit_price_non_negative CHECK (unit_price >= 0),
  CONSTRAINT items_line_total_non_negative CHECK (line_total >= 0)
);

COMMENT ON TABLE booking_items IS 'Individual line items within a booking (one per leg/day)';

-- booking_events ------------------------------------------------------------

CREATE TABLE booking_events (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id    uuid        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  event_type    event_type  NOT NULL,
  actor_type    actor_type  NOT NULL DEFAULT 'system',
  actor_id      text,
  payload_json  jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE booking_events IS 'Immutable audit log of changes per booking';

-- daily_cash_closures -------------------------------------------------------

CREATE TABLE daily_cash_closures (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  closure_date                date           NOT NULL UNIQUE,
  total_bookings              integer        NOT NULL DEFAULT 0,
  total_bags                  integer        NOT NULL DEFAULT 0,
  gross_amount                numeric(10,2)  NOT NULL DEFAULT 0,
  discounts_amount            numeric(10,2)  NOT NULL DEFAULT 0,
  extras_amount               numeric(10,2)  NOT NULL DEFAULT 0,
  net_amount                  numeric(10,2)  NOT NULL DEFAULT 0,
  pending_collection_amount   numeric(10,2)  NOT NULL DEFAULT 0,
  cancellations_count         integer        NOT NULL DEFAULT 0,
  generated_at                timestamptz    NOT NULL DEFAULT now()
);

COMMENT ON TABLE daily_cash_closures IS 'End-of-day financial snapshot';

-- --------------------------------------------------------------------------
-- 3. INDEXES
-- --------------------------------------------------------------------------

-- customers
CREATE INDEX idx_customers_email       ON customers (email)       WHERE email IS NOT NULL;
CREATE INDEX idx_customers_phone       ON customers (phone)       WHERE phone IS NOT NULL;

-- accommodations
CREATE INDEX idx_accommodations_active     ON accommodations (active)     WHERE active = true;
CREATE INDEX idx_accommodations_town       ON accommodations (town)       WHERE town IS NOT NULL;
CREATE INDEX idx_accommodations_route      ON accommodations (route_name) WHERE route_name IS NOT NULL;

-- bookings
CREATE INDEX idx_bookings_customer         ON bookings (customer_id);
CREATE INDEX idx_bookings_service_date     ON bookings (service_date);
CREATE INDEX idx_bookings_status           ON bookings (status);
CREATE INDEX idx_bookings_payment_status   ON bookings (payment_status);
CREATE INDEX idx_bookings_date_status      ON bookings (service_date, status);

-- booking_items
CREATE INDEX idx_items_booking             ON booking_items (booking_id);
CREATE INDEX idx_items_service_date        ON booking_items (service_date);
CREATE INDEX idx_items_pickup              ON booking_items (pickup_accommodation_id)  WHERE pickup_accommodation_id  IS NOT NULL;
CREATE INDEX idx_items_dropoff             ON booking_items (dropoff_accommodation_id) WHERE dropoff_accommodation_id IS NOT NULL;
CREATE INDEX idx_items_operational_status  ON booking_items (operational_status);

-- booking_events
CREATE INDEX idx_events_booking            ON booking_events (booking_id);
CREATE INDEX idx_events_type               ON booking_events (event_type);
CREATE INDEX idx_events_created            ON booking_events (created_at);

-- daily_cash_closures
CREATE INDEX idx_closures_date             ON daily_cash_closures (closure_date);

-- --------------------------------------------------------------------------
-- 4. TRIGGER: auto-update updated_at
-- --------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON accommodations
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
