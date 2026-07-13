BEGIN;

CREATE TEMP TABLE central_accommodation_import (
  stage_code        integer NOT NULL,
  input_sequence    integer NOT NULL,
  name              text NOT NULL,
  address           text NOT NULL,
  town              text NOT NULL,
  maps_url          text NOT NULL,
  operational_note  text,
  aliases           text[] NOT NULL,
  PRIMARY KEY (stage_code, input_sequence)
) ON COMMIT DROP;

INSERT INTO central_accommodation_import
  (stage_code, input_sequence, name, address, town, maps_url, operational_note, aliases)
VALUES
  (19, 3, 'Hotel Lara', 'R. dos Bombeiros Voluntários, 4930-645 Valença, Portugal', 'Valença', 'https://maps.app.goo.gl/wzv5K3NmfxHM2AzGA', NULL, ARRAY['hotel lara']),
  (19, 4, 'Hotel Val Flores', 'Avenida dos Bombeiros Voluntários, 4930-593 Valença, Portugal', 'Valença', 'https://maps.app.goo.gl/9VKo9rW1B7vPrEmp9', NULL, ARRAY['hotel val flores']),

  (18, 1, 'Hotel Cruceiro do Monte', 'Camiño Cruceiro, 23, 36713 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/VYgF27fedmnePsz57', NULL, ARRAY['hotel cruceiro do monte']),
  (18, 2, 'Hostal A Troita', 'Estrada Baiona, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/hiAisrdnPg9LH8uN7', NULL, ARRAY['hostal a troita', 'a troita hostel']),
  (18, 3, 'Apartamentos El Nogal', 'Camiño Videira, 27, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/HP98C8LDyisSGPGa7', NULL, ARRAY['apartamentos el nogal']),
  (18, 4, 'Hotel Colón', 'R. Colón, 11, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/NonY8hqinuwsbYVdA', NULL, ARRAY['hotel colón']),
  (18, 5, 'Hostal Villa Blanca', 'Rúa Augusto González Besada, 5, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/bNzesueJyNRzDPxa9', NULL, ARRAY['hostal villa blanca']),
  (18, 6, 'Pensión Novo Cabalo Furado', 'R. Seijas, 3, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/TATihVHUNcxnp7pE9', NULL, ARRAY['pensión novo cabalo furado']),
  (18, 7, 'Hostel Jacobs', 'R. Bispo Lago, núm. 5, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/QSbBsYJicbB7vVPPA', NULL, ARRAY['hostel jacobs']),
  (18, 8, 'Hotel Torre do Xudeu', 'Rúa Tide, 3, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/vBYA4Tqrs5SizCzMA', NULL, ARRAY['hotel torre do xudeu']),
  (18, 9, 'Convento del Camino', 'Rúa Antero Rubin, nº 30, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/C8xXPCbLdZBjERis6', NULL, ARRAY['convento del camino']),
  (18, 10, 'Albergue Villa San Clemente', 'R. Canónigo Valiño, 23, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/NGU1aGztcPTZM73W9', NULL, ARRAY['albergue villa san clemente']),
  (18, 11, 'Hostal San Telmo', 'Av. da Concordia, 84, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/KS14nbb886qExCrp7', NULL, ARRAY['hostal san telmo']),
  (18, 12, 'Pensión La Corredera', 'P.º de Calvo Sotelo, 37, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/E1h7YocY3MA2JYLc6', NULL, ARRAY['pensión la corredera']),
  (18, 13, 'Parador Tui', 'Av. de Portugal, S/N, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/Zpn92UxSSKqHRFjQA', NULL, ARRAY['parador tui', 'parador de tui']),
  (18, 14, 'Albergue Buen Camino', 'Av. da Concordia, 10, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/B1Td1CvvCPusdUzm9', NULL, ARRAY['albergue buen camino']),
  (18, 15, 'Hostal Raianos', 'Travesía del Miño, 5, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/PjiKdRqyVihehyXK6', NULL, ARRAY['hostal raianos', 'raianos']),
  (18, 16, 'Albergue Pallanes', 'Rúa Palláns, 11, 36712 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/CC5VzoonFZsWEQGh8', NULL, ARRAY['albergue pallanes']),
  (18, 17, 'Hotel Amoriño', 'Rúa Arraial, 39, A, 36700 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/spw9yEdzhSnEipQN7', NULL, ARRAY['hotel amoriño']),
  (18, 18, 'Hotel Alfonso I', 'A Gándara, 211, 36720 Guillarei, Pontevedra', 'Tui', 'https://maps.app.goo.gl/XGdE7BqCXPEH5QBq8', NULL, ARRAY['hotel alfonso i']),
  (18, 19, 'Clarevar Guest House', 'Ribadelouro La Magdalena, 20, 36710, Pontevedra', 'Tui', 'https://maps.app.goo.gl/FKvPeoYFziToKzhbA', NULL, ARRAY['clarevar guest house']),
  (18, 20, 'Hostal Ponte das Febres', '36710 Tui, Magdalena 19, 36710, Pontevedra', 'Tui', 'https://maps.app.goo.gl/xfJYVXiNNm13L8xG7', NULL, ARRAY['hostal ponte das febres']),
  (18, 21, 'Casa Celia', 'Lugar Farrapa, 32, 36710 Tui, Pontevedra', 'Tui', 'https://maps.app.goo.gl/7PVBs2GV6r6ABz6Y7', NULL, ARRAY['casa celia']),

  (17, 1, 'Consigna Bar Paso a Nivel', 'R. Progreso, 1, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/gcgaCHR1b6nTtzFt7', 'La mayoría de los pisos dejan aquí el equipaje.', ARRAY['consigna bar paso a nivel', 'restaurante paso a nivel (consigna porriño)']),
  (17, 2, 'Alojamientos Central', 'Av. Buenos Aires, 2, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/AU9KpzuGbKyo2ybA8', NULL, ARRAY['alojamientos central']),
  (17, 3, 'Alojamientos Cando', 'Rúa Peña, 4, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/6317NxA5ZR46uaD69', NULL, ARRAY['alojamientos cando']),
  (17, 4, 'Albergue Senda Sur', 'Rúa da Foz, 3, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/t797gAXzgZKQzmd48', NULL, ARRAY['albergue senda sur']),
  (17, 5, 'Albergue Camino de Santiago Porriño', 'Rúa Servando Ramilo, 17, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/KgVNcMoP4AeUrV1HA', NULL, ARRAY['albergue camino de santiago porriño']),
  (17, 6, 'Hotel Parque Porriño', 'Praza do Cristo, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/wfnKjUTHpzRaKVKq9', NULL, ARRAY['hotel parque porriño']),
  (17, 7, 'Hotel Azul', 'Rúa Ramiranes, 38, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/V31Xq93q2SKK4eEw6', NULL, ARRAY['hotel azul']),
  (17, 8, 'Pensión Cando', 'Av. Galicia, 8, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/uTXAjLetGthDZJ2M9', NULL, ARRAY['pensión cando']),
  (17, 9, 'Albergue Fonte dos Aloques', 'Rúa Antonio Palacios, 23, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/1pNxuThza2Myhc6G8', NULL, ARRAY['albergue fonte dos aloques']),
  (17, 10, 'Casa Lolita', 'Rúa Antonio Palacios, 9, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/4FQvNELWJPP2eQA29', NULL, ARRAY['casa lolita']),
  (17, 11, 'Albergue Casucho da Peregrina', 'Rúa Antonio Palacios, 52, Bajo, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/MkFRVuueKtf5FAiy5', NULL, ARRAY['albergue casucho da peregrina']),
  (17, 12, 'Alojamientos Tarela', 'Esquina C/ Tarela, Rúa Pérez Leirós, 1, bajo 6, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/tBnfuoSZvrPaRck89', NULL, ARRAY['alojamientos tarela']),
  (17, 13, 'Rúa Doutor Varela 6, 3ºE', 'Rúa Doutor Paz Varela, 6, 3ºE, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/5Bq6bGHhKhrZrgkq7', NULL, ARRAY['rúa doutor varela 6, 3ºe']),
  (17, 14, 'Casa Josefa''s Vivienda de Uso Turístico', 'Rúa Aloques, 5, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/se3Rub7477jsw1fS7', NULL, ARRAY['casa josefa''s vivienda de uso turístico']),
  (17, 15, 'Hostal Bo Camiño', 'Av. Domingo Bueno, 43, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/975GDar2tRcPjrRU7', NULL, ARRAY['hostal bo camiño']),
  (17, 16, 'Apartamentos San Juan', 'Rúa Antonio Palacios, 101, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/T5U6xaeDjnmpBbTy5', NULL, ARRAY['apartamentos san juan']),
  (17, 17, 'Alojamientos Stone House', 'Rúa Pío XII, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/NcpJkG1ur2wa71Tu5', NULL, ARRAY['alojamientos stone house']),
  (17, 18, 'Apartamento Aloha-T', 'Rúa Pío XII, 4, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/Xhvs4PP8FTithYbn8', 'Dejar el equipaje en el rellano de la planta 0.', ARRAY['apartamento aloha-t']),
  (17, 19, 'Hostal Maracaibo', 'R. Manuel Rodríguez, 50, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/8xUXH9Q1r9N7wHFP8', NULL, ARRAY['hostal maracaibo']),
  (17, 20, 'Apartamentos Xogo da Ola', 'Leandro Diz, Rúa Xogo da Ola, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/BVKpGX6Q2SiFrqTGA', NULL, ARRAY['apatamentos xogo da ola', 'apartamentos xogo da ola']),
  (17, 21, 'Casiña de Hermi', 'Rúa Fernández Areal, 46, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/wK3pVFRsibMuzoQk9', NULL, ARRAY['casiña de hermi']),
  (17, 22, 'Apartamentos Salgueira Rooms', 'Rúa Fernández Areal, 56, 36400 O Porriño, Pontevedra', 'O Porriño', 'https://maps.app.goo.gl/YgrXMX1zHUYmr2nH8', NULL, ARRAY['apartamentos salgueira rooms']);

CREATE TEMP TABLE central_import_matches (
  stage_code       integer NOT NULL,
  input_sequence   integer NOT NULL,
  accommodation_id uuid NOT NULL UNIQUE,
  PRIMARY KEY (stage_code, input_sequence)
) ON COMMIT DROP;

INSERT INTO central_import_matches (stage_code, input_sequence, accommodation_id)
SELECT imported.stage_code, imported.input_sequence, candidate.id
FROM central_accommodation_import AS imported
CROSS JOIN LATERAL (
  SELECT accommodation.id
  FROM accommodations AS accommodation
  LEFT JOIN route_stages AS stage ON stage.id = accommodation.route_stage_id
  WHERE (stage.route_section = 'central' OR stage.id IS NULL)
    AND (
      lower(trim(accommodation.address)) = lower(trim(imported.address))
      OR lower(trim(accommodation.name)) = ANY(imported.aliases)
      OR lower(trim(coalesce(accommodation.display_name, ''))) = ANY(imported.aliases)
    )
  ORDER BY
    (lower(trim(accommodation.address)) = lower(trim(imported.address))) DESC,
    accommodation.created_at
  LIMIT 1
) AS candidate;

INSERT INTO accommodations (
  name,
  display_name,
  stage_name,
  town,
  route_name,
  address,
  active,
  visible_in_reservations,
  sort_order,
  route_stage_id,
  internal_notes
)
SELECT
  imported.name,
  imported.name,
  imported.town,
  imported.town,
  'Camino Central',
  imported.address,
  true,
  true,
  imported.input_sequence,
  stage.id,
  concat_ws(E'\n', 'Google Maps: ' || imported.maps_url, imported.operational_note)
FROM central_accommodation_import AS imported
JOIN route_stages AS stage ON stage.code = imported.stage_code
LEFT JOIN central_import_matches AS matched
  ON matched.stage_code = imported.stage_code
 AND matched.input_sequence = imported.input_sequence
WHERE matched.accommodation_id IS NULL;

INSERT INTO central_import_matches (stage_code, input_sequence, accommodation_id)
SELECT imported.stage_code, imported.input_sequence, accommodation.id
FROM central_accommodation_import AS imported
JOIN accommodations AS accommodation
  ON lower(trim(accommodation.address)) = lower(trim(imported.address))
LEFT JOIN central_import_matches AS matched
  ON matched.stage_code = imported.stage_code
 AND matched.input_sequence = imported.input_sequence
WHERE matched.accommodation_id IS NULL;

DO $$
BEGIN
  IF (SELECT count(*) FROM central_import_matches) <> (SELECT count(*) FROM central_accommodation_import) THEN
    RAISE EXCEPTION 'Central accommodation import did not resolve every spreadsheet row';
  END IF;
END;
$$;

CREATE TEMP TABLE central_existing_codes ON COMMIT DROP AS
SELECT accommodation.id, accommodation.external_code AS old_external_code, stage.code AS stage_code
FROM accommodations AS accommodation
JOIN route_stages AS stage ON stage.id = accommodation.route_stage_id
WHERE stage.route_section = 'central';

UPDATE accommodations AS accommodation
SET external_code = NULL
FROM central_existing_codes AS existing
WHERE existing.id = accommodation.id;

UPDATE accommodations AS accommodation
SET
  external_code = imported.stage_code || '.' || lpad(imported.input_sequence::text, 2, '0'),
  name = imported.name,
  display_name = imported.name,
  stage_name = imported.town,
  town = imported.town,
  route_name = 'Camino Central',
  address = imported.address,
  active = true,
  visible_in_reservations = true,
  sort_order = imported.input_sequence,
  route_stage_id = stage.id,
  internal_notes = CASE
    WHEN coalesce(accommodation.internal_notes, '') LIKE '%' || imported.maps_url || '%'
      THEN concat_ws(E'\n', nullif(accommodation.internal_notes, ''), imported.operational_note)
    ELSE concat_ws(
      E'\n',
      nullif(accommodation.internal_notes, ''),
      'Google Maps: ' || imported.maps_url,
      imported.operational_note
    )
  END
FROM central_import_matches AS matched
JOIN central_accommodation_import AS imported
  ON imported.stage_code = matched.stage_code
 AND imported.input_sequence = matched.input_sequence
JOIN route_stages AS stage ON stage.code = imported.stage_code
WHERE accommodation.id = matched.accommodation_id;

-- Keep the two established Valença launch points ahead of the spreadsheet.
UPDATE accommodations AS accommodation
SET
  external_code = existing.old_external_code,
  sort_order = split_part(existing.old_external_code, '.', 2)::integer
FROM central_existing_codes AS existing
WHERE accommodation.id = existing.id
  AND existing.stage_code = 19
  AND existing.old_external_code IN ('19.01', '19.02')
  AND NOT EXISTS (
    SELECT 1 FROM central_import_matches AS matched
    WHERE matched.accommodation_id = accommodation.id
  );

WITH stage_limits AS (
  SELECT stage_code, max(input_sequence) AS max_sequence
  FROM central_accommodation_import
  GROUP BY stage_code
), remaining AS (
  SELECT
    accommodation.id,
    existing.stage_code,
    limits.max_sequence + row_number() OVER (
      PARTITION BY existing.stage_code
      ORDER BY
        CASE
          WHEN existing.old_external_code ~ '^\d+\.\d+$'
            THEN split_part(existing.old_external_code, '.', 2)::integer
          ELSE 9999
        END,
        accommodation.name
    ) AS new_sequence
  FROM central_existing_codes AS existing
  JOIN accommodations AS accommodation ON accommodation.id = existing.id
  JOIN stage_limits AS limits ON limits.stage_code = existing.stage_code
  WHERE NOT EXISTS (
    SELECT 1 FROM central_import_matches AS matched
    WHERE matched.accommodation_id = accommodation.id
  )
    AND NOT (
      existing.stage_code = 19
      AND existing.old_external_code IN ('19.01', '19.02')
    )
)
UPDATE accommodations AS accommodation
SET
  external_code = remaining.stage_code || '.' || lpad(remaining.new_sequence::text, 2, '0'),
  sort_order = remaining.new_sequence
FROM remaining
WHERE accommodation.id = remaining.id;

UPDATE accommodations AS accommodation
SET
  stage_name = stage.name,
  town = stage.name,
  route_name = 'Camino Central'
FROM route_stages AS stage
WHERE accommodation.route_stage_id = stage.id
  AND stage.route_section = 'central';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM central_accommodation_import AS imported
    LEFT JOIN accommodations AS accommodation
      ON accommodation.external_code = imported.stage_code || '.' || lpad(imported.input_sequence::text, 2, '0')
    WHERE accommodation.id IS NULL
       OR accommodation.route_stage_id IS NULL
       OR accommodation.active IS NOT true
       OR accommodation.visible_in_reservations IS NOT true
  ) THEN
    RAISE EXCEPTION 'Central accommodation import failed its final integrity check';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM accommodations AS accommodation
    JOIN route_stages AS stage ON stage.id = accommodation.route_stage_id
    WHERE stage.route_section = 'central'
      AND accommodation.external_code IS NULL
  ) THEN
    RAISE EXCEPTION 'A central accommodation was left without an external code';
  END IF;
END;
$$;

COMMIT;
