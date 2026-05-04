-- ============================================================================
-- Easy Brais — Reservation email flow
-- ============================================================================

ALTER TABLE email_logs
  ADD COLUMN IF NOT EXISTS subject text,
  ADD COLUMN IF NOT EXISTS template text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz;

UPDATE email_logs
SET
  template = COALESCE(template, template_key),
  provider = COALESCE(provider, 'brevo_smtp')
WHERE template IS NULL OR provider IS NULL;

CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs (template);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs (sent_at);
