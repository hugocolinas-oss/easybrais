-- =============================================================================
-- PEGAR EN: Supabase Dashboard → SQL Editor → Run
-- Corrige: ERROR 42P01 relation "email_logs" does not exist
-- =============================================================================
-- Requiere que exista public.bookings (FK booking_id).

DO $$
BEGIN
  CREATE TYPE public.email_send_status AS ENUM ('pending', 'sent', 'failed');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.email_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            uuid REFERENCES public.bookings (id) ON DELETE SET NULL,
  recipient             text NOT NULL,
  template_key          text NOT NULL,
  template              text,
  subject               text,
  provider              text,
  status                public.email_send_status NOT NULL DEFAULT 'pending',
  external_message_id   text,
  error_message         text,
  sent_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.email_logs IS 'Audit log of transactional emails sent';

ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS subject text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS template text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS sent_at timestamptz;

UPDATE public.email_logs
SET
  template = COALESCE(template, template_key),
  provider = COALESCE(provider, 'brevo_smtp')
WHERE template IS NULL OR provider IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_logs_booking ON public.email_logs (booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs (status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON public.email_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON public.email_logs (recipient);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON public.email_logs (template);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON public.email_logs (sent_at);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_manage_email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "staff_read_email_logs" ON public.email_logs;
DROP POLICY IF EXISTS "staff_insert_email_logs" ON public.email_logs;

CREATE POLICY "staff_read_email_logs"
  ON public.email_logs
  FOR SELECT
  TO authenticated
  USING (public.current_user_role() IN ('operator', 'manager', 'admin'));

CREATE POLICY "staff_insert_email_logs"
  ON public.email_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.current_user_role() IN ('operator', 'manager', 'admin'));
