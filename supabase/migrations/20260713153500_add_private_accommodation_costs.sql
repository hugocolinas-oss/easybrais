CREATE TABLE accommodation_internal_costs (
  accommodation_id uuid PRIMARY KEY REFERENCES accommodations(id) ON DELETE CASCADE,
  extra_cost       numeric(10, 2) NOT NULL DEFAULT 0 CHECK (extra_cost >= 0),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE accommodation_internal_costs IS 'Private operational costs per accommodation; never exposed in public booking data';
COMMENT ON COLUMN accommodation_internal_costs.extra_cost IS 'Private travel surcharge in EUR, not added to customer pricing';

INSERT INTO accommodation_internal_costs (accommodation_id)
SELECT id FROM accommodations
ON CONFLICT (accommodation_id) DO NOTHING;

CREATE OR REPLACE FUNCTION create_accommodation_internal_cost()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO accommodation_internal_costs (accommodation_id)
  VALUES (NEW.id)
  ON CONFLICT (accommodation_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_accommodation_internal_cost() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER create_internal_cost_after_accommodation
  AFTER INSERT ON accommodations
  FOR EACH ROW EXECUTE FUNCTION create_accommodation_internal_cost();

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON accommodation_internal_costs
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

ALTER TABLE accommodation_internal_costs ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON accommodation_internal_costs FROM anon;

CREATE POLICY "staff_read_accommodation_internal_costs"
  ON accommodation_internal_costs FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'));

CREATE POLICY "staff_insert_accommodation_internal_costs"
  ON accommodation_internal_costs FOR INSERT TO authenticated
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));

CREATE POLICY "staff_update_accommodation_internal_costs"
  ON accommodation_internal_costs FOR UPDATE TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'))
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));

GRANT SELECT, INSERT, UPDATE ON accommodation_internal_costs TO authenticated;
