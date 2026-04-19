-- ============================================================================
-- Easy Brais — Simulación de una semana operativa (17–23 marzo 2026)
-- ============================================================================
-- Ejecutar DESPUÉS de accommodations.sql y todas las migraciones.
-- Idempotente: elimina datos de simulación antes de insertar.
-- ============================================================================

BEGIN;

-- ── Limpieza previa (solo datos de simulación) ────────────────────────────
DELETE FROM daily_route_stops WHERE booking_code LIKE 'EB-SIM%';
DELETE FROM daily_routes WHERE notes = 'seed_simulation';
DELETE FROM daily_cash_closures WHERE closure_date BETWEEN '2026-03-16' AND '2026-03-23';

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs') THEN
    DELETE FROM email_logs WHERE booking_id IN (SELECT id FROM bookings WHERE booking_code LIKE 'EB-SIM%');
  END IF;
END $$;

DELETE FROM booking_events WHERE booking_id IN (SELECT id FROM bookings WHERE booking_code LIKE 'EB-SIM%');
DELETE FROM booking_items WHERE booking_id IN (SELECT id FROM bookings WHERE booking_code LIKE 'EB-SIM%');
DELETE FROM bookings WHERE booking_code LIKE 'EB-SIM%';
DELETE FROM customers WHERE email LIKE '%@easybrai-sim.test';

-- ============================================================================
-- 1. CLIENTES (10 perfiles variados)
-- ============================================================================

INSERT INTO customers (id, full_name, email, phone, language, notes) VALUES
  ('a0000001-0000-0000-0000-000000000001', 'María García López',     'maria.garcia@easybrai-sim.test',    '+34 612 345 001', 'es', NULL),
  ('a0000001-0000-0000-0000-000000000002', 'John Smith',             'john.smith@easybrai-sim.test',       '+44 7700 900001', 'en', NULL),
  ('a0000001-0000-0000-0000-000000000003', 'Pierre Dubois',          'pierre.dubois@easybrai-sim.test',    '+33 6 12 34 56',  'fr', NULL),
  ('a0000001-0000-0000-0000-000000000004', 'Hans Müller',            'hans.muller@easybrai-sim.test',      '+49 170 1234567', 'de', NULL),
  ('a0000001-0000-0000-0000-000000000005', 'Ana Martins',            'ana.martins@easybrai-sim.test',      '+351 912 345 67', 'pt', 'Alérgica al polvo'),
  ('a0000001-0000-0000-0000-000000000006', 'Elena Rossi',            'elena.rossi@easybrai-sim.test',      '+39 345 678 90',  'it', NULL),
  ('a0000001-0000-0000-0000-000000000007', 'Carlos Fernández Ruiz',  'carlos.fernandez@easybrai-sim.test', '+34 698 765 432', 'es', 'Cliente recurrente'),
  ('a0000001-0000-0000-0000-000000000008', 'Sarah Johnson',          'sarah.johnson@easybrai-sim.test',    '+1 555 234 5678', 'en', NULL),
  ('a0000001-0000-0000-0000-000000000009', 'Takeshi Yamamoto',       'takeshi.yamamoto@easybrai-sim.test', '+81 90 1234 5678','en', 'Necesita factura'),
  ('a0000001-0000-0000-0000-000000000010', 'Isabel Sousa',           'isabel.sousa@easybrai-sim.test',     '+351 938 765 43', 'pt', NULL);

-- ============================================================================
-- 2. RESERVAS (21 reservas cubriendo toda la semana)
-- ============================================================================
-- Precios: 6€/mochila (≤9), 5€/mochila (≥10), +5€ por sobrepeso

-- ── LUNES 16 marzo — Reservas ya entregadas ──────────────────────────────

INSERT INTO bookings (id, booking_code, customer_id, booking_type, service_date, status, source_channel, language, notes_customer, notes_internal, subtotal_amount, discount_amount, extra_weight_amount, total_amount, payment_status, email_status) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'EB-SIM-001', 'a0000001-0000-0000-0000-000000000001', 'luggage_transfer', '2026-03-16', 'delivered',  'web', 'es', NULL, NULL, 12.00, 0, 0, 12.00, 'paid', 'sent'),
  ('b0000001-0000-0000-0000-000000000002', 'EB-SIM-002', 'a0000001-0000-0000-0000-000000000002', 'luggage_transfer', '2026-03-16', 'delivered',  'web', 'en', 'Please handle with care', NULL, 18.00, 0, 5.00, 23.00, 'paid', 'sent'),
  ('b0000001-0000-0000-0000-000000000003', 'EB-SIM-003', 'a0000001-0000-0000-0000-000000000003', 'luggage_transfer', '2026-03-16', 'delivered',  'web', 'fr', NULL, NULL, 6.00, 0, 0, 6.00, 'paid', 'sent');

-- ── MARTES 17 marzo — Mix entregadas y en tránsito ──────────────────────

INSERT INTO bookings (id, booking_code, customer_id, booking_type, service_date, status, source_channel, language, notes_customer, notes_internal, subtotal_amount, discount_amount, extra_weight_amount, total_amount, payment_status, email_status) VALUES
  ('b0000001-0000-0000-0000-000000000004', 'EB-SIM-004', 'a0000001-0000-0000-0000-000000000004', 'luggage_transfer', '2026-03-17', 'delivered',  'web', 'de', NULL, NULL, 24.00, 0, 10.00, 34.00, 'paid', 'sent'),
  ('b0000001-0000-0000-0000-000000000005', 'EB-SIM-005', 'a0000001-0000-0000-0000-000000000005', 'luggage_transfer', '2026-03-17', 'delivered',  'web', 'pt', 'Bolsas frágiles', NULL, 30.00, 0, 0, 30.00, 'paid', 'sent'),
  ('b0000001-0000-0000-0000-000000000006', 'EB-SIM-006', 'a0000001-0000-0000-0000-000000000006', 'luggage_transfer', '2026-03-17', 'cancelled',  'web', 'it', 'Cancelar por favor', NULL, 12.00, 0, 0, 12.00, 'pending', 'sent');

-- ── MIÉRCOLES 18 marzo — Confirmadas y en recogida ────────────────────

INSERT INTO bookings (id, booking_code, customer_id, booking_type, service_date, status, source_channel, language, notes_customer, notes_internal, subtotal_amount, discount_amount, extra_weight_amount, total_amount, payment_status, email_status) VALUES
  ('b0000001-0000-0000-0000-000000000007', 'EB-SIM-007', 'a0000001-0000-0000-0000-000000000007', 'luggage_transfer', '2026-03-18', 'in_transit', 'web', 'es', NULL, NULL, 36.00, 0, 5.00, 41.00, 'pending', 'sent'),
  ('b0000001-0000-0000-0000-000000000008', 'EB-SIM-008', 'a0000001-0000-0000-0000-000000000008', 'luggage_transfer', '2026-03-18', 'in_pickup',  'web', 'en', 'Two red bags', NULL, 18.00, 0, 0, 18.00, 'pending', 'sent'),
  ('b0000001-0000-0000-0000-000000000009', 'EB-SIM-009', 'a0000001-0000-0000-0000-000000000001', 'luggage_transfer', '2026-03-18', 'incident',   'web', 'es', NULL, NULL, 12.00, 0, 0, 12.00, 'pending', 'sent');

-- ── JUEVES 19 marzo (HOY) — Mix completo de estados ──────────────────

INSERT INTO bookings (id, booking_code, customer_id, booking_type, service_date, status, source_channel, language, notes_customer, notes_internal, subtotal_amount, discount_amount, extra_weight_amount, total_amount, payment_status, email_status) VALUES
  ('b0000001-0000-0000-0000-000000000010', 'EB-SIM-010', 'a0000001-0000-0000-0000-000000000009', 'luggage_transfer', '2026-03-19', 'confirmed',              'web', 'en', 'Arriving early morning', NULL, 42.00, 0, 15.00, 57.00, 'pending', 'sent'),
  ('b0000001-0000-0000-0000-000000000011', 'EB-SIM-011', 'a0000001-0000-0000-0000-000000000010', 'luggage_transfer', '2026-03-19', 'confirmed',              'web', 'pt', NULL, NULL, 24.00, 0, 0, 24.00, 'pending', 'sent'),
  ('b0000001-0000-0000-0000-000000000012', 'EB-SIM-012', 'a0000001-0000-0000-0000-000000000003', 'luggage_transfer', '2026-03-19', 'pending',                'web', 'fr', 'Groupe de 3 personnes', NULL, 54.00, 4.00, 10.00, 60.00, 'pending', 'sent'),
  ('b0000001-0000-0000-0000-000000000013', 'EB-SIM-013', 'a0000001-0000-0000-0000-000000000007', 'luggage_transfer', '2026-03-19', 'in_pickup',              'web', 'es', 'Recoger antes de las 9', NULL, 18.00, 0, 5.00, 23.00, 'pending', 'sent'),
  ('b0000001-0000-0000-0000-000000000014', 'EB-SIM-014', 'a0000001-0000-0000-0000-000000000004', 'luggage_transfer', '2026-03-19', 'in_transit',             'web', 'de', NULL, NULL, 30.00, 0, 0, 30.00, 'pending', 'sent');

-- ── VIERNES 20 marzo — Reservas futuras pendientes ──────────────────

INSERT INTO bookings (id, booking_code, customer_id, booking_type, service_date, status, source_channel, language, notes_customer, notes_internal, subtotal_amount, discount_amount, extra_weight_amount, total_amount, payment_status, email_status) VALUES
  ('b0000001-0000-0000-0000-000000000015', 'EB-SIM-015', 'a0000001-0000-0000-0000-000000000008', 'luggage_transfer', '2026-03-20', 'confirmed', 'web', 'en', NULL, NULL, 36.00, 0, 0, 36.00, 'pending', 'sent'),
  ('b0000001-0000-0000-0000-000000000016', 'EB-SIM-016', 'a0000001-0000-0000-0000-000000000005', 'luggage_transfer', '2026-03-20', 'pending',   'web', 'pt', 'Chegar cedo', NULL, 12.00, 0, 5.00, 17.00, 'pending', 'sent'),
  ('b0000001-0000-0000-0000-000000000017', 'EB-SIM-017', 'a0000001-0000-0000-0000-000000000006', 'luggage_transfer', '2026-03-20', 'pending',   'web', 'it', NULL, NULL, 24.00, 0, 0, 24.00, 'pending', 'sent');

-- ── SÁBADO 21 marzo — Fin de semana ─────────────────────────────────

INSERT INTO bookings (id, booking_code, customer_id, booking_type, service_date, status, source_channel, language, notes_customer, notes_internal, subtotal_amount, discount_amount, extra_weight_amount, total_amount, payment_status, email_status) VALUES
  ('b0000001-0000-0000-0000-000000000018', 'EB-SIM-018', 'a0000001-0000-0000-0000-000000000002', 'luggage_transfer', '2026-03-21', 'pending', 'web', 'en', 'Weekend booking', NULL, 18.00, 0, 0, 18.00, 'pending', 'sent'),
  ('b0000001-0000-0000-0000-000000000019', 'EB-SIM-019', 'a0000001-0000-0000-0000-000000000001', 'luggage_transfer', '2026-03-21', 'pending', 'web', 'es', NULL, NULL, 6.00, 0, 0, 6.00, 'pending', 'sent');

-- ── DOMINGO 22 marzo ────────────────────────────────────────────────

INSERT INTO bookings (id, booking_code, customer_id, booking_type, service_date, status, source_channel, language, notes_customer, notes_internal, subtotal_amount, discount_amount, extra_weight_amount, total_amount, payment_status, email_status) VALUES
  ('b0000001-0000-0000-0000-000000000020', 'EB-SIM-020', 'a0000001-0000-0000-0000-000000000009', 'luggage_transfer', '2026-03-22', 'pending', 'web', 'en', NULL, NULL, 30.00, 0, 5.00, 35.00, 'pending', 'sent');

-- ── MULTIETAPA: Cliente hace 3 etapas (19, 20, 21 marzo) ──────────

INSERT INTO bookings (id, booking_code, customer_id, booking_type, service_date, status, source_channel, language, notes_customer, notes_internal, subtotal_amount, discount_amount, extra_weight_amount, total_amount, payment_status, email_status) VALUES
  ('b0000001-0000-0000-0000-000000000021', 'EB-SIM-021', 'a0000001-0000-0000-0000-000000000010', 'luggage_transfer', '2026-03-19', 'confirmed', 'web', 'pt', 'Caminho completo 3 etapas', NULL, 18.00, 0, 0, 18.00, 'pending', 'sent');


-- ============================================================================
-- 3. BOOKING ITEMS (tramos con alojamientos reales del Camino Portugués)
-- ============================================================================

INSERT INTO booking_items (id, booking_id, service_date, pickup_accommodation_id, dropoff_accommodation_id, bags_count, overweight_bags_count, unit_price, line_total, operational_status) VALUES

  -- SIM-001: A Guarda → Oia (2 mochilas, lunes entregado)
  ('c0000001-0000-0000-0000-000000000001', 'b0000001-0000-0000-0000-000000000001', '2026-03-16',
   (SELECT id FROM accommodations WHERE external_code='1.01'), (SELECT id FROM accommodations WHERE external_code='2.01'),
   2, 0, 6.00, 12.00, 'delivered'),

  -- SIM-002: Oia → Baiona (3 mochilas + 1 sobrepeso, lunes entregado)
  ('c0000001-0000-0000-0000-000000000002', 'b0000001-0000-0000-0000-000000000002', '2026-03-16',
   (SELECT id FROM accommodations WHERE external_code='2.08'), (SELECT id FROM accommodations WHERE external_code='3.01'),
   3, 1, 6.00, 18.00, 'delivered'),

  -- SIM-003: Baiona → Vigo (1 mochila, lunes entregado)
  ('c0000001-0000-0000-0000-000000000003', 'b0000001-0000-0000-0000-000000000003', '2026-03-16',
   (SELECT id FROM accommodations WHERE external_code='3.08'), (SELECT id FROM accommodations WHERE external_code='4.09'),
   1, 0, 6.00, 6.00, 'delivered'),

  -- SIM-004: Vigo → Redondela (4 mochilas + 2 sobrepeso, martes entregado)
  ('c0000001-0000-0000-0000-000000000004', 'b0000001-0000-0000-0000-000000000004', '2026-03-17',
   (SELECT id FROM accommodations WHERE external_code='4.14'), (SELECT id FROM accommodations WHERE external_code='5.01'),
   4, 2, 6.00, 24.00, 'delivered'),

  -- SIM-005: Redondela → Pontevedra (5 mochilas, martes entregado)
  ('c0000001-0000-0000-0000-000000000005', 'b0000001-0000-0000-0000-000000000005', '2026-03-17',
   (SELECT id FROM accommodations WHERE external_code='5.04'), (SELECT id FROM accommodations WHERE external_code='6.01'),
   5, 0, 6.00, 30.00, 'delivered'),

  -- SIM-006: A Guarda → Oia (2 mochilas, martes cancelado)
  ('c0000001-0000-0000-0000-000000000006', 'b0000001-0000-0000-0000-000000000006', '2026-03-17',
   (SELECT id FROM accommodations WHERE external_code='1.03'), (SELECT id FROM accommodations WHERE external_code='2.05'),
   2, 0, 6.00, 12.00, 'pending'),

  -- SIM-007: Pontevedra → Caldas (6 mochilas + 1 sobrepeso, miércoles en tránsito)
  ('c0000001-0000-0000-0000-000000000007', 'b0000001-0000-0000-0000-000000000007', '2026-03-18',
   (SELECT id FROM accommodations WHERE external_code='6.10'), (SELECT id FROM accommodations WHERE external_code='8.01'),
   6, 1, 6.00, 36.00, 'in_transit'),

  -- SIM-008: Caldas → Padrón (3 mochilas, miércoles en recogida)
  ('c0000001-0000-0000-0000-000000000008', 'b0000001-0000-0000-0000-000000000008', '2026-03-18',
   (SELECT id FROM accommodations WHERE external_code='8.06'), (SELECT id FROM accommodations WHERE external_code='11.04'),
   3, 0, 6.00, 18.00, 'picked_up'),

  -- SIM-009: Baiona → Vigo (2 mochilas, miércoles incidencia)
  ('c0000001-0000-0000-0000-000000000009', 'b0000001-0000-0000-0000-000000000009', '2026-03-18',
   (SELECT id FROM accommodations WHERE external_code='3.02'), (SELECT id FROM accommodations WHERE external_code='4.12'),
   2, 0, 6.00, 12.00, 'failed'),

  -- SIM-010: Padrón → Santiago (7 mochilas + 3 sobrepeso, jueves confirmado)
  ('c0000001-0000-0000-0000-000000000010', 'b0000001-0000-0000-0000-000000000010', '2026-03-19',
   (SELECT id FROM accommodations WHERE external_code='11.09'), (SELECT id FROM accommodations WHERE external_code='13.32'),
   7, 3, 6.00, 42.00, 'pending'),

  -- SIM-011: Redondela → Pontevedra (4 mochilas, jueves confirmado)
  ('c0000001-0000-0000-0000-000000000011', 'b0000001-0000-0000-0000-000000000011', '2026-03-19',
   (SELECT id FROM accommodations WHERE external_code='5.09'), (SELECT id FROM accommodations WHERE external_code='6.14'),
   4, 0, 6.00, 24.00, 'pending'),

  -- SIM-012: Pontevedra → Caldas (9 mochilas + 2 sobrepeso, jueves pendiente) — grupo grande
  ('c0000001-0000-0000-0000-000000000012', 'b0000001-0000-0000-0000-000000000012', '2026-03-19',
   (SELECT id FROM accommodations WHERE external_code='6.23'), (SELECT id FROM accommodations WHERE external_code='8.10'),
   9, 2, 6.00, 54.00, 'pending'),

  -- SIM-013: Oia → Baiona (3 mochilas + 1 sobrepeso, jueves en recogida)
  ('c0000001-0000-0000-0000-000000000013', 'b0000001-0000-0000-0000-000000000013', '2026-03-19',
   (SELECT id FROM accommodations WHERE external_code='2.13'), (SELECT id FROM accommodations WHERE external_code='3.06'),
   3, 1, 6.00, 18.00, 'picked_up'),

  -- SIM-014: Baiona → Vigo (5 mochilas, jueves en tránsito)
  ('c0000001-0000-0000-0000-000000000014', 'b0000001-0000-0000-0000-000000000014', '2026-03-19',
   (SELECT id FROM accommodations WHERE external_code='3.13'), (SELECT id FROM accommodations WHERE external_code='4.21'),
   5, 0, 6.00, 30.00, 'in_transit'),

  -- SIM-015: Caldas → Padrón (6 mochilas, viernes confirmado)
  ('c0000001-0000-0000-0000-000000000015', 'b0000001-0000-0000-0000-000000000015', '2026-03-20',
   (SELECT id FROM accommodations WHERE external_code='8.15'), (SELECT id FROM accommodations WHERE external_code='11.19'),
   6, 0, 6.00, 36.00, 'pending'),

  -- SIM-016: A Guarda → Oia (2 mochilas + 1 sobrepeso, viernes pendiente)
  ('c0000001-0000-0000-0000-000000000016', 'b0000001-0000-0000-0000-000000000016', '2026-03-20',
   (SELECT id FROM accommodations WHERE external_code='1.09'), (SELECT id FROM accommodations WHERE external_code='2.23'),
   2, 1, 6.00, 12.00, 'pending'),

  -- SIM-017: Vigo → Redondela (4 mochilas, viernes pendiente)
  ('c0000001-0000-0000-0000-000000000017', 'b0000001-0000-0000-0000-000000000017', '2026-03-20',
   (SELECT id FROM accommodations WHERE external_code='4.28'), (SELECT id FROM accommodations WHERE external_code='5.14'),
   4, 0, 6.00, 24.00, 'pending'),

  -- SIM-018: Padrón → Santiago (3 mochilas, sábado pendiente)
  ('c0000001-0000-0000-0000-000000000018', 'b0000001-0000-0000-0000-000000000018', '2026-03-21',
   (SELECT id FROM accommodations WHERE external_code='11.11'), (SELECT id FROM accommodations WHERE external_code='13.05'),
   3, 0, 6.00, 18.00, 'pending'),

  -- SIM-019: Vigo → Redondela (1 mochila, sábado pendiente)
  ('c0000001-0000-0000-0000-000000000019', 'b0000001-0000-0000-0000-000000000019', '2026-03-21',
   (SELECT id FROM accommodations WHERE external_code='4.01'), (SELECT id FROM accommodations WHERE external_code='5.03'),
   1, 0, 6.00, 6.00, 'pending'),

  -- SIM-020: Redondela → Pontevedra (5 mochilas + 1 sobrepeso, domingo pendiente)
  ('c0000001-0000-0000-0000-000000000020', 'b0000001-0000-0000-0000-000000000020', '2026-03-22',
   (SELECT id FROM accommodations WHERE external_code='5.21'), (SELECT id FROM accommodations WHERE external_code='6.04'),
   5, 1, 6.00, 30.00, 'pending'),

  -- SIM-021: Multietapa — 3 tramos (19, 20, 21 marzo)
  ('c0000001-0000-0000-0000-000000000021', 'b0000001-0000-0000-0000-000000000021', '2026-03-19',
   (SELECT id FROM accommodations WHERE external_code='6.02'), (SELECT id FROM accommodations WHERE external_code='8.03'),
   3, 0, 6.00, 18.00, 'pending'),

  ('c0000001-0000-0000-0000-000000000022', 'b0000001-0000-0000-0000-000000000021', '2026-03-20',
   (SELECT id FROM accommodations WHERE external_code='8.03'), (SELECT id FROM accommodations WHERE external_code='11.03'),
   3, 0, 6.00, 18.00, 'pending'),

  ('c0000001-0000-0000-0000-000000000023', 'b0000001-0000-0000-0000-000000000021', '2026-03-21',
   (SELECT id FROM accommodations WHERE external_code='11.03'), (SELECT id FROM accommodations WHERE external_code='13.01'),
   3, 0, 6.00, 18.00, 'pending');


-- ============================================================================
-- 4. BOOKING EVENTS (trazabilidad completa)
-- ============================================================================

-- Evento "created" para todas las reservas
INSERT INTO booking_events (booking_id, event_type, actor_type, payload_json, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":2}', '2026-03-15 10:23:00+00'),
  ('b0000001-0000-0000-0000-000000000002', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":3}', '2026-03-15 14:45:00+00'),
  ('b0000001-0000-0000-0000-000000000003', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":1}', '2026-03-15 16:10:00+00'),
  ('b0000001-0000-0000-0000-000000000004', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":4}', '2026-03-16 08:30:00+00'),
  ('b0000001-0000-0000-0000-000000000005', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":5}', '2026-03-16 09:15:00+00'),
  ('b0000001-0000-0000-0000-000000000006', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":2}', '2026-03-16 11:00:00+00'),
  ('b0000001-0000-0000-0000-000000000007', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":6}', '2026-03-17 07:45:00+00'),
  ('b0000001-0000-0000-0000-000000000008', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":3}', '2026-03-17 08:20:00+00'),
  ('b0000001-0000-0000-0000-000000000009', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":2}', '2026-03-17 09:00:00+00'),
  ('b0000001-0000-0000-0000-000000000010', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":7}', '2026-03-18 06:30:00+00'),
  ('b0000001-0000-0000-0000-000000000011', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":4}', '2026-03-18 07:15:00+00'),
  ('b0000001-0000-0000-0000-000000000012', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":9}', '2026-03-18 10:30:00+00'),
  ('b0000001-0000-0000-0000-000000000013', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":3}', '2026-03-18 12:00:00+00'),
  ('b0000001-0000-0000-0000-000000000014', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":5}', '2026-03-18 14:30:00+00'),
  ('b0000001-0000-0000-0000-000000000015', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":6}', '2026-03-19 08:00:00+00'),
  ('b0000001-0000-0000-0000-000000000016', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":2}', '2026-03-19 09:30:00+00'),
  ('b0000001-0000-0000-0000-000000000017', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":4}', '2026-03-19 11:00:00+00'),
  ('b0000001-0000-0000-0000-000000000018', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":3}', '2026-03-19 15:00:00+00'),
  ('b0000001-0000-0000-0000-000000000019', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":1}', '2026-03-19 16:30:00+00'),
  ('b0000001-0000-0000-0000-000000000020', 'created', 'customer', '{"source":"web_form","legs_count":1,"total_bags":5}', '2026-03-19 18:00:00+00'),
  ('b0000001-0000-0000-0000-000000000021', 'created', 'customer', '{"source":"web_form","legs_count":3,"total_bags":9}', '2026-03-18 20:00:00+00');

-- Eventos de confirmación de email
INSERT INTO booking_events (booking_id, event_type, actor_type, payload_json, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'email_sent', 'system', '{"template":"booking_confirmation","sent":true}', '2026-03-15 10:23:30+00'),
  ('b0000001-0000-0000-0000-000000000002', 'email_sent', 'system', '{"template":"booking_confirmation","sent":true}', '2026-03-15 14:45:25+00'),
  ('b0000001-0000-0000-0000-000000000003', 'email_sent', 'system', '{"template":"booking_confirmation","sent":true}', '2026-03-15 16:10:20+00'),
  ('b0000001-0000-0000-0000-000000000004', 'email_sent', 'system', '{"template":"booking_confirmation","sent":true}', '2026-03-16 08:30:28+00'),
  ('b0000001-0000-0000-0000-000000000005', 'email_sent', 'system', '{"template":"booking_confirmation","sent":true}', '2026-03-16 09:15:22+00'),
  ('b0000001-0000-0000-0000-000000000010', 'email_sent', 'system', '{"template":"booking_confirmation","sent":true}', '2026-03-18 06:30:35+00'),
  ('b0000001-0000-0000-0000-000000000021', 'email_sent', 'system', '{"template":"booking_confirmation","sent":true}', '2026-03-18 20:00:30+00');

-- Cambios de estado: confirmación por staff
INSERT INTO booking_events (booking_id, event_type, actor_type, payload_json, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-15 11:00:00+00'),
  ('b0000001-0000-0000-0000-000000000002', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-15 15:00:00+00'),
  ('b0000001-0000-0000-0000-000000000003', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-15 16:30:00+00'),
  ('b0000001-0000-0000-0000-000000000004', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-16 09:00:00+00'),
  ('b0000001-0000-0000-0000-000000000005', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-16 10:00:00+00'),
  ('b0000001-0000-0000-0000-000000000007', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-17 08:00:00+00'),
  ('b0000001-0000-0000-0000-000000000008', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-17 08:30:00+00'),
  ('b0000001-0000-0000-0000-000000000009', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-17 09:30:00+00'),
  ('b0000001-0000-0000-0000-000000000010', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-18 07:00:00+00'),
  ('b0000001-0000-0000-0000-000000000011', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-18 07:30:00+00'),
  ('b0000001-0000-0000-0000-000000000015', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-19 08:30:00+00'),
  ('b0000001-0000-0000-0000-000000000021', 'status_changed', 'staff', '{"from":"pending","to":"confirmed"}',  '2026-03-18 21:00:00+00');

-- Progreso operativo de entregas pasadas
INSERT INTO booking_events (booking_id, event_type, actor_type, payload_json, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000001', 'status_changed', 'system', '{"from":"confirmed","to":"in_pickup"}',   '2026-03-16 08:00:00+00'),
  ('b0000001-0000-0000-0000-000000000001', 'status_changed', 'system', '{"from":"in_pickup","to":"in_transit"}',   '2026-03-16 08:30:00+00'),
  ('b0000001-0000-0000-0000-000000000001', 'status_changed', 'system', '{"from":"in_transit","to":"delivered"}',   '2026-03-16 14:00:00+00'),

  ('b0000001-0000-0000-0000-000000000002', 'status_changed', 'system', '{"from":"confirmed","to":"in_pickup"}',   '2026-03-16 07:45:00+00'),
  ('b0000001-0000-0000-0000-000000000002', 'status_changed', 'system', '{"from":"in_pickup","to":"in_transit"}',   '2026-03-16 08:15:00+00'),
  ('b0000001-0000-0000-0000-000000000002', 'status_changed', 'system', '{"from":"in_transit","to":"delivered"}',   '2026-03-16 13:30:00+00'),

  ('b0000001-0000-0000-0000-000000000003', 'status_changed', 'system', '{"from":"confirmed","to":"in_pickup"}',   '2026-03-16 09:00:00+00'),
  ('b0000001-0000-0000-0000-000000000003', 'status_changed', 'system', '{"from":"in_pickup","to":"in_transit"}',   '2026-03-16 09:30:00+00'),
  ('b0000001-0000-0000-0000-000000000003', 'status_changed', 'system', '{"from":"in_transit","to":"delivered"}',   '2026-03-16 15:00:00+00'),

  ('b0000001-0000-0000-0000-000000000004', 'status_changed', 'system', '{"from":"confirmed","to":"in_pickup"}',   '2026-03-17 07:30:00+00'),
  ('b0000001-0000-0000-0000-000000000004', 'status_changed', 'system', '{"from":"in_pickup","to":"in_transit"}',   '2026-03-17 08:00:00+00'),
  ('b0000001-0000-0000-0000-000000000004', 'status_changed', 'system', '{"from":"in_transit","to":"delivered"}',   '2026-03-17 14:30:00+00'),

  ('b0000001-0000-0000-0000-000000000005', 'status_changed', 'system', '{"from":"confirmed","to":"in_pickup"}',   '2026-03-17 08:15:00+00'),
  ('b0000001-0000-0000-0000-000000000005', 'status_changed', 'system', '{"from":"in_pickup","to":"in_transit"}',   '2026-03-17 08:45:00+00'),
  ('b0000001-0000-0000-0000-000000000005', 'status_changed', 'system', '{"from":"in_transit","to":"delivered"}',   '2026-03-17 15:00:00+00');

-- Cancelación
INSERT INTO booking_events (booking_id, event_type, actor_type, payload_json, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000006', 'status_changed', 'staff', '{"from":"pending","to":"cancelled","reason":"Solicitud del cliente"}', '2026-03-16 12:00:00+00');

-- Progreso miércoles
INSERT INTO booking_events (booking_id, event_type, actor_type, payload_json, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000007', 'status_changed', 'system', '{"from":"confirmed","to":"in_pickup"}',   '2026-03-18 07:30:00+00'),
  ('b0000001-0000-0000-0000-000000000007', 'status_changed', 'system', '{"from":"in_pickup","to":"in_transit"}',   '2026-03-18 08:15:00+00'),
  ('b0000001-0000-0000-0000-000000000008', 'status_changed', 'system', '{"from":"confirmed","to":"in_pickup"}',   '2026-03-18 08:00:00+00');

-- Incidencia
INSERT INTO booking_events (booking_id, event_type, actor_type, payload_json, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000009', 'status_changed', 'system', '{"from":"confirmed","to":"in_pickup"}',   '2026-03-18 07:00:00+00'),
  ('b0000001-0000-0000-0000-000000000009', 'incident_reported', 'staff', '{"message":"Mochila dañada en el transporte. Cliente notificado."}', '2026-03-18 10:30:00+00');

-- Progreso jueves (hoy)
INSERT INTO booking_events (booking_id, event_type, actor_type, payload_json, created_at) VALUES
  ('b0000001-0000-0000-0000-000000000013', 'status_changed', 'system', '{"from":"confirmed","to":"in_pickup"}',   '2026-03-19 07:30:00+00'),
  ('b0000001-0000-0000-0000-000000000014', 'status_changed', 'system', '{"from":"confirmed","to":"in_pickup"}',   '2026-03-19 07:00:00+00'),
  ('b0000001-0000-0000-0000-000000000014', 'status_changed', 'system', '{"from":"in_pickup","to":"in_transit"}',   '2026-03-19 07:45:00+00');


-- ============================================================================
-- 5. EMAIL LOGS (trazabilidad de envíos — solo si la tabla existe)
-- ============================================================================

DO $$ BEGIN
IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'email_logs') THEN
  INSERT INTO email_logs (booking_id, recipient, template_key, status, error_message) VALUES
    ('b0000001-0000-0000-0000-000000000001', 'maria.garcia@easybrai-sim.test',    'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000002', 'john.smith@easybrai-sim.test',       'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000003', 'pierre.dubois@easybrai-sim.test',    'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000004', 'hans.muller@easybrai-sim.test',      'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000005', 'ana.martins@easybrai-sim.test',      'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000006', 'elena.rossi@easybrai-sim.test',      'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000007', 'carlos.fernandez@easybrai-sim.test', 'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000008', 'sarah.johnson@easybrai-sim.test',    'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000009', 'maria.garcia@easybrai-sim.test',     'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000010', 'takeshi.yamamoto@easybrai-sim.test', 'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000011', 'isabel.sousa@easybrai-sim.test',     'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000012', 'pierre.dubois@easybrai-sim.test',    'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000013', 'carlos.fernandez@easybrai-sim.test', 'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000014', 'hans.muller@easybrai-sim.test',      'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000015', 'sarah.johnson@easybrai-sim.test',    'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000016', 'ana.martins@easybrai-sim.test',      'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000017', 'elena.rossi@easybrai-sim.test',      'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000018', 'john.smith@easybrai-sim.test',       'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000019', 'maria.garcia@easybrai-sim.test',     'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000020', 'takeshi.yamamoto@easybrai-sim.test', 'booking_confirmation', 'sent', NULL),
    ('b0000001-0000-0000-0000-000000000021', 'isabel.sousa@easybrai-sim.test',     'booking_confirmation', 'sent', NULL);
END IF;
END $$;


-- ============================================================================
-- 6. CIERRES CONTABLES (lunes y martes ya cerrados)
-- ============================================================================

INSERT INTO daily_cash_closures (closure_date, total_bookings, total_bags, gross_amount, discounts_amount, extras_amount, net_amount, pending_collection_amount, cancellations_count) VALUES
  ('2026-03-16', 3, 6, 36.00, 0, 5.00, 41.00, 0, 0),
  ('2026-03-17', 2, 9, 54.00, 0, 10.00, 64.00, 0, 1);

COMMIT;

-- ============================================================================
-- Resumen de la simulación:
-- ============================================================================
-- 10 clientes internacionales (ES, EN, FR, DE, PT, IT)
-- 21 reservas del 16 al 22 de marzo 2026
-- 23 tramos (booking_items) incluyendo 1 reserva multietapa de 3 tramos
-- Estados cubiertos: pending, confirmed, in_pickup, in_transit, delivered, cancelled, incident
-- 60+ booking_events con trazabilidad completa
-- 21 email_logs
-- 2 cierres contables (lun-mar)
-- Alojamientos reales del Camino Portugués (A Guarda → Santiago)
-- ============================================================================
