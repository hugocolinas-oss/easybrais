-- Model the Camino de la Costa and Camino Central as separate branches that
-- merge in Redondela. Stage codes remain external identifiers; direction and
-- pricing use the explicit metadata below.

CREATE TABLE route_stages (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 integer      NOT NULL UNIQUE,
  name                 text         NOT NULL,
  route_section        text         NOT NULL
                                    CHECK (route_section IN ('coastal', 'central', 'shared')),
  branch_sequence      integer      NOT NULL CHECK (branch_sequence > 0),
  price_to_redondela   numeric(10,2) CHECK (price_to_redondela >= 0),
  active               boolean      NOT NULL DEFAULT true,
  created_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at           timestamptz  NOT NULL DEFAULT now(),

  UNIQUE (route_section, branch_sequence)
);

COMMENT ON TABLE route_stages IS 'Ordered route stages, including branches that merge in Redondela';
COMMENT ON COLUMN route_stages.code IS 'Stable stage prefix used by accommodation external codes';
COMMENT ON COLUMN route_stages.branch_sequence IS 'Geographic order inside coastal, central or shared section';
COMMENT ON COLUMN route_stages.price_to_redondela IS 'Transport price per normal bag from this stage to Redondela';

CREATE TRIGGER set_updated_at BEFORE UPDATE ON route_stages
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

INSERT INTO route_stages (code, name, route_section, branch_sequence, price_to_redondela)
VALUES
  (1,  'A Guarda',          'coastal', 1, 24),
  (2,  'Oia',               'coastal', 2, 18),
  (3,  'Baiona / Nigrán',   'coastal', 3, 12),
  (4,  'Vigo',              'coastal', 4,  6),
  (19, 'Valença',           'central', 1, 12),
  (18, 'Tui',               'central', 2, 12),
  (17, 'O Porriño',         'central', 3,  6),
  (5,  'Redondela',         'shared',  1,  0),
  (6,  'Pontevedra',        'shared',  2, NULL),
  (7,  'Portela',           'shared',  3, NULL),
  (8,  'Caldas de Reis',    'shared',  4, NULL),
  (9,  'Valga',             'shared',  5, NULL),
  (10, 'Pontecesures',      'shared',  6, NULL),
  (11, 'Padrón',            'shared',  7, NULL),
  (12, 'Escravitude',       'shared',  8, NULL),
  (13, 'Santiago',          'shared',  9, NULL);

ALTER TABLE accommodations
  ADD COLUMN route_stage_id uuid REFERENCES route_stages(id) ON DELETE RESTRICT;

CREATE INDEX idx_accommodations_route_stage ON accommodations (route_stage_id);

-- O Porriño was imported with prefix 19. Move it to the agreed prefix 17.
UPDATE accommodations
SET external_code = '17.' || split_part(external_code, '.', 2),
    stage_name = 'O Porriño',
    town = 'O Porriño'
WHERE external_code ~ '^19\.\d+$'
  AND (
    lower(coalesce(stage_name, '')) IN ('porriño', 'o porriño')
    OR lower(coalesce(town, '')) IN ('porriño', 'o porriño')
  );

-- Normalize Tui while preserving its existing 18.xx identifiers.
UPDATE accommodations
SET stage_name = 'Tui', town = 'Tui'
WHERE external_code ~ '^18\.\d+$'
   OR lower(coalesce(stage_name, '')) = 'tui'
   OR lower(coalesce(town, '')) IN ('tui', 'tuy');

-- Assign stable codes and normalized names to the two known Valença records.
UPDATE accommodations
SET external_code = CASE name
      WHEN 'Alojamento da Vila' THEN '19.01'
      WHEN 'Fortaleza Faro' THEN '19.02'
      ELSE external_code
    END,
    stage_name = 'Valença',
    town = 'Valença'
WHERE name IN ('Alojamento da Vila', 'Fortaleza Faro')
   OR lower(coalesce(stage_name, '')) IN ('valenca', 'valença')
   OR lower(coalesce(town, '')) IN ('valenca', 'valença');

-- Link every valid stage code without changing legacy records outside the
-- supported route model.
UPDATE accommodations AS accommodation
SET route_stage_id = stage.id
FROM route_stages AS stage
WHERE accommodation.external_code ~ '^\d+'
  AND substring(accommodation.external_code from '^\d+')::integer = stage.code;

-- Publish only the three launch accommodations on the Camino Central.
UPDATE accommodations
SET active = false, visible_in_reservations = false
WHERE route_stage_id IN (
  SELECT id FROM route_stages WHERE route_section = 'central'
);

UPDATE accommodations
SET active = true,
    visible_in_reservations = true,
    last_verified_at = now()
WHERE name IN ('Alojamento da Vila', 'Raianos', 'Casiña Fina');

ALTER TABLE daily_route_stops
  ADD COLUMN route_section text NOT NULL DEFAULT 'shared'
    CHECK (route_section IN ('coastal', 'central', 'shared'));

UPDATE daily_route_stops AS stop
SET route_section = stage.route_section
FROM accommodations AS accommodation
JOIN route_stages AS stage ON stage.id = accommodation.route_stage_id
WHERE accommodation.id = stop.accommodation_id;

CREATE INDEX idx_route_stops_section_position
  ON daily_route_stops (route_id, route_section, position);

ALTER TABLE route_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_active_route_stages"
  ON route_stages FOR SELECT TO anon, authenticated
  USING (active = true);

GRANT SELECT ON TABLE route_stages TO anon, authenticated;
