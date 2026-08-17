-- Date ranges in which public luggage-transfer bookings are closed.
CREATE TABLE public.service_closures (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  starts_on   date NOT NULL,
  ends_on     date NOT NULL,
  reason      text,
  created_by  uuid REFERENCES public.user_profiles(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT service_closures_valid_range CHECK (starts_on <= ends_on),
  CONSTRAINT service_closures_reason_length CHECK (reason IS NULL OR char_length(reason) <= 200),
  CONSTRAINT service_closures_no_overlap EXCLUDE USING gist (
    daterange(starts_on, ends_on, '[]') WITH &&
  )
);

CREATE INDEX idx_service_closures_range
  ON public.service_closures (starts_on, ends_on);

COMMENT ON TABLE public.service_closures IS
  'Ranges during which customers cannot create public bookings. Existing and staff-created bookings are preserved.';

ALTER TABLE public.service_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "office_staff_read_service_closures"
  ON public.service_closures FOR SELECT TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'));

REVOKE ALL ON TABLE public.service_closures FROM anon, authenticated;
GRANT SELECT ON TABLE public.service_closures TO authenticated;
GRANT ALL ON TABLE public.service_closures TO service_role;
