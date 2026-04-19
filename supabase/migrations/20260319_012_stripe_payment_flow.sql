-- ============================================================================
-- 012: Stripe payment flow — estados y campos para pagos online robustos
-- Compatible con esquema actual. No rompe datos existentes.
--
-- IMPORTANTE: ejecutar en DOS pasos separados en Supabase SQL Editor.
-- Primero el Bloque A, después el Bloque B.
-- ============================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- BLOQUE A — ejecutar primero
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Nuevos valores en booking_status
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'pending_payment';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'payment_expired';

-- 2. Campos adicionales en bookings
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method      text,
  ADD COLUMN IF NOT EXISTS payment_expires_at   timestamptz,
  ADD COLUMN IF NOT EXISTS paid_at              timestamptz;

COMMENT ON COLUMN bookings.payment_method    IS 'Método de pago: online_stripe, cash, transfer. NULL si no determinado';
COMMENT ON COLUMN bookings.payment_expires_at IS 'Momento en que expira la ventana de pago (Stripe session expires_at)';
COMMENT ON COLUMN bookings.paid_at           IS 'Timestamp en que el pago fue confirmado por webhook';
