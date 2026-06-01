-- Diagnóstico correos (ejecutar en Supabase → SQL Editor)
-- Requiere que existan las tablas email_logs, bookings, booking_events.

-- 1) Fallos explícitos en email_logs
SELECT id, created_at, booking_id, recipient, COALESCE(template, template_key) AS template,
       status, error_message, sent_at
FROM email_logs
WHERE status = 'failed'
ORDER BY created_at DESC
LIMIT 50;

-- 2) Últimos envíos (cualquier estado)
SELECT id, created_at, booking_id, recipient, COALESCE(template, template_key) AS template,
       status, error_message
FROM email_logs
ORDER BY created_at DESC
LIMIT 30;

-- 3) Reservas con email en mal estado
SELECT id, booking_code, email_status, status, payment_status, updated_at
FROM bookings
WHERE email_status IN ('failed', 'not_sent')
ORDER BY updated_at DESC
LIMIT 50;

-- 4) Eventos email_sent con fallo en payload
SELECT id, booking_id, created_at, payload_json
FROM booking_events
WHERE event_type = 'email_sent'
  AND (
    (payload_json->>'sent') = 'false'
    OR (
      (payload_json->>'error') IS NOT NULL
      AND length(trim(payload_json->>'error')) > 0
    )
  )
ORDER BY created_at DESC
LIMIT 50;
