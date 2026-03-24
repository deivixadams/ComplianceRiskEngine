BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM graph._reino r
    WHERE r.id = '706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid
  ) THEN
    RAISE EXCEPTION 'No existe reino_id 706e297e-4e1d-45bc-a294-0a404eeddf46 en graph._reino';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM catalogos.corpus_catalog_control_type WHERE lower(code) = 'preventivo') THEN
    RAISE EXCEPTION 'Falta catalogos.corpus_catalog_control_type: Preventivo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM catalogos.corpus_catalog_control_type WHERE lower(code) = 'detectivo') THEN
    RAISE EXCEPTION 'Falta catalogos.corpus_catalog_control_type: Detectivo';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM catalogos.corpus_catalog_control_type WHERE lower(code) = 'correctivo') THEN
    RAISE EXCEPTION 'Falta catalogos.corpus_catalog_control_type: Correctivo';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM catalogos.corpus_catalog_control_automation WHERE lower(code) = 'manual') THEN
    RAISE EXCEPTION 'Falta catalogos.corpus_catalog_control_automation: manual';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM catalogos.corpus_catalog_control_automation WHERE lower(code) = 'semi') THEN
    RAISE EXCEPTION 'Falta catalogos.corpus_catalog_control_automation: semi';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM catalogos.corpus_catalog_control_frequency WHERE lower(code) = 'event') THEN
    RAISE EXCEPTION 'Falta catalogos.corpus_catalog_control_frequency: event';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM catalogos.corpus_catalog_control_frequency WHERE lower(code) = 'continuous') THEN
    RAISE EXCEPTION 'Falta catalogos.corpus_catalog_control_frequency: continuous';
  END IF;
END $$;

WITH src AS (
  SELECT *
  FROM (
    VALUES
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-076', 'Vigilancia de amenazas emergentes', 'Controles para identificar, evaluar y anticipar amenazas emergentes que puedan afectar activos, procesos, tecnologias o modelos operativos.', '{"basis":"Threat intelligence","risk_coverage":["anticipacion deficiente de amenazas emergentes"]}'::jsonb, 'Detectivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-077', 'Erradicacion e investigacion forense', 'Procedimientos y capacidades para contener, erradicar, investigar y documentar incidentes con profundidad tecnica suficiente.', '{"basis":"Incident response and forensics","risk_coverage":["erradicacion e investigacion forense insuficientes"]}'::jsonb, 'Correctivo', 'manual', 'event'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-078', 'Seguridad de aplicaciones y APIs en operacion', 'Controles para proteger aplicaciones y APIs expuestas en produccion frente a abuso, explotacion, manipulacion o acceso indebido.', '{"basis":"Application and API security","risk_coverage":["compromiso de aplicaciones y APIs en operacion"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-079', 'Seguridad de la cadena de suministro de desarrollo', 'Controles para validar integridad, procedencia y seguridad de componentes, dependencias, librerias, pipelines y artefactos incorporados al desarrollo.', '{"basis":"Software supply chain security","risk_coverage":["introduccion de software inseguro en la cadena de suministro de desarrollo"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-080', 'Seguridad de entornos cloud', 'Controles para proteger configuraciones, identidades, cargas de trabajo, datos y servicios desplegados en infraestructuras cloud.', '{"basis":"Cloud security","risk_coverage":["exposicion y compromiso de entornos cloud"]}'::jsonb, 'Preventivo', 'semi', 'continuous')
  ) AS t(reino_id, code, name, description, rationale, control_type, automation, frequency)
),
resolved AS (
  SELECT
    s.reino_id,
    s.code,
    s.name,
    s.description,
    s.rationale,
    ct.id AS control_type_id,
    a.id AS automation_id,
    f.id AS frequency_id
  FROM src s
  JOIN catalogos.corpus_catalog_control_type ct
    ON lower(ct.code) = lower(s.control_type)
  JOIN catalogos.corpus_catalog_control_automation a
    ON lower(a.code) = lower(s.automation)
  JOIN catalogos.corpus_catalog_control_frequency f
    ON lower(f.code) = lower(s.frequency)
),
upserted AS (
  INSERT INTO graph.control (
    reino_id,
    code,
    name,
    description,
    rationale,
    control_type_id,
    automation_id,
    frequency_id,
    evidence_required,
    status,
    status_id,
    is_hard_gate,
    required_test
  )
  SELECT
    r.reino_id,
    r.code,
    r.name,
    r.description,
    r.rationale,
    r.control_type_id,
    r.automation_id,
    r.frequency_id,
    true,
    'active',
    2,
    false,
    true
  FROM resolved r
  ON CONFLICT (code)
  DO UPDATE SET
    reino_id = EXCLUDED.reino_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    rationale = EXCLUDED.rationale,
    control_type_id = EXCLUDED.control_type_id,
    automation_id = EXCLUDED.automation_id,
    frequency_id = EXCLUDED.frequency_id,
    evidence_required = EXCLUDED.evidence_required,
    status = EXCLUDED.status,
    status_id = EXCLUDED.status_id,
    is_hard_gate = EXCLUDED.is_hard_gate,
    required_test = EXCLUDED.required_test,
    updated_at = now()
  RETURNING code
)
SELECT count(*) AS affected_rows
FROM upserted;

COMMIT;
