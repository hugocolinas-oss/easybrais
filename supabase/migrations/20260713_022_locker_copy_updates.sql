-- Normalize locker-facing copy so public reservation helpers can derive
-- the consigna list directly from accommodations data.

UPDATE accommodations
SET
  name = 'Dulces Pecados (consigna)',
  display_name = 'Dulces Pecados (consigna)',
  reservation_notes = 'Consigna gratis consumiendo algo en el local.'
WHERE external_code = '5.08.4';

UPDATE accommodations
SET
  name = 'Parking Garaje Plaza',
  display_name = 'Parking Garaje Plaza',
  reservation_notes = 'Consigna 3€ / mochila. El importe se paga al recoger el equipaje.'
WHERE external_code = '6.25.1';
