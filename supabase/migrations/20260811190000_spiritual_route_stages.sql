-- Variante Espiritual: branch from Pontevedra and rejoin the shared Camino at Padrón.

ALTER TABLE route_stages
  DROP CONSTRAINT route_stages_route_section_check;

ALTER TABLE route_stages
  ADD CONSTRAINT route_stages_route_section_check
  CHECK (route_section IN ('coastal', 'central', 'spiritual', 'shared'));

ALTER TABLE daily_route_stops
  DROP CONSTRAINT daily_route_stops_route_section_check;

ALTER TABLE daily_route_stops
  ADD CONSTRAINT daily_route_stops_route_section_check
  CHECK (route_section IN ('coastal', 'central', 'spiritual', 'shared'));

INSERT INTO route_stages (code, name, route_section, branch_sequence, price_to_redondela)
VALUES
  (20, 'Combarro',   'spiritual', 1, NULL),
  (21, 'Armenteira', 'spiritual', 2, NULL),
  (22, 'Ribadumia',  'spiritual', 3, NULL),
  (23, 'Vilanova',   'spiritual', 4, NULL)
ON CONFLICT (code) DO UPDATE
SET name = EXCLUDED.name,
    route_section = EXCLUDED.route_section,
    branch_sequence = EXCLUDED.branch_sequence,
    price_to_redondela = EXCLUDED.price_to_redondela,
    active = true;

COMMENT ON COLUMN route_stages.branch_sequence IS
  'Geographic order inside the coastal, central, spiritual or shared route section';
