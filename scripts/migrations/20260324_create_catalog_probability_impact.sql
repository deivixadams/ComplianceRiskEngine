-- Step 3: probability and impact catalogs in schema catalogos

CREATE SCHEMA IF NOT EXISTS catalogos;

CREATE TABLE IF NOT EXISTS catalogos.corpus_catalog_probability (
  id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  base_value numeric(8,4) NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT chk_corpus_catalog_probability_base_value
    CHECK (base_value >= 1 AND base_value <= 5)
);

CREATE TABLE IF NOT EXISTS catalogos.corpus_catalog_impact (
  id smallint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  base_value numeric(8,4) NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  CONSTRAINT chk_corpus_catalog_impact_base_value
    CHECK (base_value >= 1 AND base_value <= 5)
);

CREATE INDEX IF NOT EXISTS idx_catalog_probability_active_sort
  ON catalogos.corpus_catalog_probability (is_active, sort_order);

CREATE INDEX IF NOT EXISTS idx_catalog_impact_active_sort
  ON catalogos.corpus_catalog_impact (is_active, sort_order);

INSERT INTO catalogos.corpus_catalog_probability (code, name, description, base_value, sort_order, is_active)
VALUES
  ('VL', 'Muy Baja', 'Probabilidad muy baja de materializacion del riesgo.', 1.0000, 10, true),
  ('L',  'Baja',     'Probabilidad baja de materializacion del riesgo.',      2.0000, 20, true),
  ('M',  'Media',    'Probabilidad media de materializacion del riesgo.',     3.0000, 30, true),
  ('H',  'Alta',     'Probabilidad alta de materializacion del riesgo.',      4.0000, 40, true),
  ('VH', 'Muy Alta', 'Probabilidad muy alta de materializacion del riesgo.',  5.0000, 50, true)
ON CONFLICT (code)
DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_value = EXCLUDED.base_value,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;

INSERT INTO catalogos.corpus_catalog_impact (code, name, description, base_value, sort_order, is_active)
VALUES
  ('VL', 'Muy Bajo', 'Impacto muy bajo sobre negocio, cumplimiento o reputacion.', 1.0000, 10, true),
  ('L',  'Bajo',     'Impacto bajo sobre negocio, cumplimiento o reputacion.',      2.0000, 20, true),
  ('M',  'Medio',    'Impacto medio sobre negocio, cumplimiento o reputacion.',     3.0000, 30, true),
  ('H',  'Alto',     'Impacto alto sobre negocio, cumplimiento o reputacion.',      4.0000, 40, true),
  ('VH', 'Muy Alto', 'Impacto muy alto sobre negocio, cumplimiento o reputacion.',  5.0000, 50, true)
ON CONFLICT (code)
DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_value = EXCLUDED.base_value,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
