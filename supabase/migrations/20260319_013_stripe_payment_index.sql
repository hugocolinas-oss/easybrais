-- ============================================================================
-- 013: Índice parcial para reservas pendientes de pago
-- Requiere que migración 012 ya esté committeada (enum pending_payment)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_bookings_pending_payment
  ON bookings (payment_expires_at)
  WHERE status = 'pending_payment' AND payment_status = 'pending';
