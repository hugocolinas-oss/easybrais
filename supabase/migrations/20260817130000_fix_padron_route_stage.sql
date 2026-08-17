-- Repair the visible Padrón accommodation that was imported without a route
-- stage. Without stage 11, routes arriving from the Variante Espiritual are
-- rejected as unsupported mileage.

WITH padron_stage AS (
  SELECT id
  FROM public.route_stages
  WHERE code = 11
  LIMIT 1
),
next_code AS (
  SELECT coalesce(
    max((regexp_match(external_code, '^11[.]([0-9]+)$'))[1]::integer),
    0
  ) + 1 AS value
  FROM public.accommodations
  WHERE external_code ~ '^11[.][0-9]+$'
)
UPDATE public.accommodations AS accommodation
SET
  route_stage_id = padron_stage.id,
  external_code = '11.' || lpad(next_code.value::text, 2, '0'),
  stage_name = 'Padrón',
  town = 'Padrón',
  updated_at = now()
FROM padron_stage, next_code
WHERE accommodation.id = 'e9b3f386-ecb3-4b9b-ad54-b6f8f6a7928f'
  AND accommodation.route_stage_id IS NULL;
