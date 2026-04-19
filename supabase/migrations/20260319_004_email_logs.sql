-- ============================================================================
-- Easy Brais — Email Logs table
-- ============================================================================

CREATE TABLE email_logs (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id            uuid        REFERENCES bookings(id) ON DELETE SET NULL,
  recipient             text        NOT NULL,
  template_key          text        NOT NULL,
  status                text        NOT NULL DEFAULT 'pending',
  external_message_id   text,
  error_message         text,
  created_at            timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE email_logs IS 'Audit log of transactional emails sent';

-- Indexes
CREATE INDEX idx_email_logs_booking    ON email_logs (booking_id) WHERE booking_id IS NOT NULL;
CREATE INDEX idx_email_logs_status     ON email_logs (status);
CREATE INDEX idx_email_logs_created    ON email_logs (created_at);
CREATE INDEX idx_email_logs_recipient  ON email_logs (recipient);

-- RLS: only service_role and authenticated staff can read logs
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_manage_email_logs"
  ON email_logs
  FOR ALL
  TO authenticated
  USING (current_user_role() IN ('operator', 'manager', 'admin'))
  WITH CHECK (current_user_role() IN ('operator', 'manager', 'admin'));
