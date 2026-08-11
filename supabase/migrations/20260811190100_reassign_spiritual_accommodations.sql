-- Reclassify accommodations that were previously grouped under Pontevedra
-- using a locality suffix for the Variante Espiritual.

WITH spiritual_matches AS (
  SELECT
    accommodation.id,
    stage.id AS route_stage_id,
    stage.code AS stage_code,
    stage.name AS stage_name
  FROM public.accommodations AS accommodation
  JOIN public.route_stages AS stage
    ON stage.code = CASE
      WHEN lower(trim(coalesce(accommodation.town, ''))) ~ '\*combarro$' THEN 20
      WHEN lower(trim(coalesce(accommodation.town, ''))) ~ '\*armenteira$' THEN 21
      WHEN lower(trim(coalesce(accommodation.town, ''))) ~ '\*ribadumia$' THEN 22
      WHEN lower(trim(coalesce(accommodation.town, ''))) ~ '\*vilanova$' THEN 23
      ELSE NULL
    END
  WHERE accommodation.external_code ~ '^6\.[0-9]+(?:\.[0-9]+)?$'
)
UPDATE public.accommodations AS accommodation
SET
  external_code = spiritual.stage_code::text
    || substring(accommodation.external_code FROM '(\..*)$'),
  stage_name = spiritual.stage_name,
  town = spiritual.stage_name,
  route_stage_id = spiritual.route_stage_id,
  updated_at = now()
FROM spiritual_matches AS spiritual
WHERE accommodation.id = spiritual.id;
