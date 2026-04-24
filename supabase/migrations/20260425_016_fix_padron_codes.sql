-- Fix: assign external_code to Padrón accommodations that are missing them.
-- Uses stage prefix 11 (Padrón) and auto-increments the sub-number.

DO $$
DECLARE
  max_sub integer;
  r record;
  counter integer;
BEGIN
  -- Find current max sub-number for code prefix 11
  SELECT COALESCE(
    MAX(
      CASE
        WHEN external_code ~ '^11\.\d+$'
        THEN CAST(split_part(external_code, '.', 2) AS integer)
        ELSE 0
      END
    ), 0
  ) INTO max_sub
  FROM accommodations
  WHERE external_code LIKE '11.%';

  counter := max_sub;

  FOR r IN
    SELECT id FROM accommodations
    WHERE stage_name = 'Padrón'
      AND (external_code IS NULL OR external_code = '')
    ORDER BY name
  LOOP
    counter := counter + 1;
    UPDATE accommodations
      SET external_code = '11.' || counter
    WHERE id = r.id;
  END LOOP;

  RAISE NOTICE 'Assigned codes 11.% to % Padrón accommodations (starting from 11.%)', counter - max_sub, max_sub + 1;
END $$;
