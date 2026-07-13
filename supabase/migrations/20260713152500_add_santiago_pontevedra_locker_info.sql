-- Keep locker guidance in accommodation data so the public form can derive it
-- without maintaining a second list of locations.

UPDATE accommodations
SET reservation_notes = 'Consigna 3 € / mochila. El importe se paga al recoger el equipaje.'
WHERE external_code = '6.26';

UPDATE accommodations
SET reservation_notes = 'Consigna 2,50 € / mochila. El importe se paga al recoger el equipaje.'
WHERE external_code = '13.02';

UPDATE accommodations
SET reservation_notes = 'Consigna 3 € / mochila. El importe se paga al recoger el equipaje.'
WHERE external_code IN ('13.11', '13.39');

UPDATE accommodations
SET reservation_notes = 'Consigna 5 € / mochila. El importe se paga al recoger el equipaje.'
WHERE external_code = '13.31';
