-- Fix: assign external_code to ALL accommodations missing them, based on their stage_name.
-- Looks up the code prefix from existing accommodations in the same stage.

DO $$
DECLARE
  stage record;
  prefix integer;
  max_sub integer;
  r record;
  counter integer;
  fixed integer := 0;
BEGIN
  FOR stage IN
    SELECT DISTINCT stage_name FROM accommodations
    WHERE stage_name IS NOT NULL
    ORDER BY stage_name
  LOOP
    -- Find the numeric prefix for this stage from existing coded accommodations
    SELECT MIN(
      CASE
        WHEN external_code ~ '^\d+\.\d+$'
        THEN CAST(split_part(external_code, '.', 1) AS integer)
        ELSE NULL
      END
    ) INTO prefix
    FROM accommodations
    WHERE stage_name = stage.stage_name
      AND external_code IS NOT NULL
      AND external_code != '';

    IF prefix IS NULL THEN
      CONTINUE;
    END IF;

    -- Find max sub-number for this prefix
    SELECT COALESCE(MAX(
      CASE
        WHEN external_code ~ ('^' || prefix || '\.\d+$')
        THEN CAST(split_part(external_code, '.', 2) AS integer)
        ELSE 0
      END
    ), 0) INTO max_sub
    FROM accommodations
    WHERE external_code LIKE (prefix || '.%');

    counter := max_sub;

    FOR r IN
      SELECT id FROM accommodations
      WHERE stage_name = stage.stage_name
        AND (external_code IS NULL OR external_code = '')
      ORDER BY name
    LOOP
      counter := counter + 1;
      UPDATE accommodations
        SET external_code = prefix || '.' || counter
      WHERE id = r.id;
      fixed := fixed + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Fixed % accommodations with missing external_code', fixed;
END $$;
