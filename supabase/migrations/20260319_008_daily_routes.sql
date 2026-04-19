-- ============================================================================
-- Easy Brais — Daily Routes & Route Stops
-- ============================================================================

-- --------------------------------------------------------------------------
-- 1. TABLES
-- --------------------------------------------------------------------------

CREATE TABLE daily_routes (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_date    date           NOT NULL UNIQUE,
  status        text           NOT NULL DEFAULT 'draft'
                               CHECK (status IN ('draft', 'active', 'completed')),
  notes         text,
  total_stops   integer        NOT NULL DEFAULT 0,
  total_bags    integer        NOT NULL DEFAULT 0,
  created_by    uuid           REFERENCES auth.users(id),
  created_at    timestamptz    NOT NULL DEFAULT now(),
  updated_at    timestamptz    NOT NULL DEFAULT now()
);

COMMENT ON TABLE daily_routes IS 'One route per day — ordered list of pickup/dropoff stops';

CREATE TABLE daily_route_stops (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id            uuid           NOT NULL REFERENCES daily_routes(id) ON DELETE CASCADE,
  position            integer        NOT NULL,
  stop_type           text           NOT NULL CHECK (stop_type IN ('pickup', 'dropoff')),
  accommodation_id    uuid           REFERENCES accommodations(id),
  accommodation_name  text           NOT NULL DEFAULT '',
  accommodation_town  text,
  booking_item_id     uuid           REFERENCES booking_items(id),
  booking_code        text           NOT NULL DEFAULT '',
  customer_name       text           NOT NULL DEFAULT '',
  bags_count          integer        NOT NULL DEFAULT 0,
  completed           boolean        NOT NULL DEFAULT false,
  completed_at        timestamptz,
  notes               text,
  created_at          timestamptz    NOT NULL DEFAULT now(),

  UNIQUE(route_id, position)
);

COMMENT ON TABLE daily_route_stops IS 'Individual stops within a daily route, manually orderable';

-- --------------------------------------------------------------------------
-- 2. INDEXES
-- --------------------------------------------------------------------------

CREATE INDEX idx_routes_date       ON daily_routes (route_date);
CREATE INDEX idx_routes_status     ON daily_routes (status);
CREATE INDEX idx_stops_route       ON daily_route_stops (route_id);
CREATE INDEX idx_stops_position    ON daily_route_stops (route_id, position);
CREATE INDEX idx_stops_booking_item ON daily_route_stops (booking_item_id)
  WHERE booking_item_id IS NOT NULL;

-- --------------------------------------------------------------------------
-- 3. TRIGGERS
-- --------------------------------------------------------------------------

CREATE TRIGGER set_updated_at BEFORE UPDATE ON daily_routes
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- --------------------------------------------------------------------------
-- 4. RLS
-- --------------------------------------------------------------------------

ALTER TABLE daily_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_route_stops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_manage_daily_routes" ON daily_routes;
CREATE POLICY "staff_manage_daily_routes" ON daily_routes
  FOR ALL TO authenticated
  USING  (public.current_user_role() IN ('operator', 'manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));

DROP POLICY IF EXISTS "staff_manage_route_stops" ON daily_route_stops;
CREATE POLICY "staff_manage_route_stops" ON daily_route_stops
  FOR ALL TO authenticated
  USING  (public.current_user_role() IN ('operator', 'manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));
