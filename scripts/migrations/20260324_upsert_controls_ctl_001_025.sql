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
  IF NOT EXISTS (SELECT 1 FROM catalogos.corpus_catalog_control_frequency WHERE lower(code) = 'periodic') THEN
    RAISE EXCEPTION 'Falta catalogos.corpus_catalog_control_frequency: periodic';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM catalogos.corpus_catalog_control_frequency WHERE lower(code) = 'continuous') THEN
    RAISE EXCEPTION 'Falta catalogos.corpus_catalog_control_frequency: continuous';
  END IF;
END $$;

WITH src AS (
  SELECT *
  FROM (
    VALUES
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-001', 'Estructura organizacional clara y definida', 'Definicion formal de estructura organizacional, roles y lineas de reporte para evitar ambiguedad en la gestion.', '{"basis":"Gobierno corporativo","risk_coverage":["ambiguedad organizacional"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-002', 'Asignacion formal de responsabilidades', 'Asignacion explicita y documentada de responsabilidades para cada funcion critica del sistema.', '{"basis":"Gobierno interno","risk_coverage":["vacios de responsabilidad"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-003', 'Cumplimiento de politicas de seguridad', 'Implementacion y monitoreo del cumplimiento de politicas de seguridad institucional.', '{"basis":"Politicas internas","risk_coverage":["incumplimiento de directrices de seguridad"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-004', 'Control antifraude interno', 'Mecanismos de deteccion y prevencion de fraude interno mediante monitoreo y segregacion de funciones.', '{"basis":"Gestion de fraude","risk_coverage":["fraude interno"],"control_type":"detectivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-005', 'Gestion de privilegios y accesos', 'Control y revision periodica de privilegios para evitar abuso de accesos.', '{"basis":"Control de acceso","risk_coverage":["abuso de privilegios"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-006', 'Deteccion de errores operativos', 'Mecanismos de validacion y monitoreo para detectar errores en procesos criticos.', '{"basis":"Control operativo","risk_coverage":["errores no detectados"],"control_type":"detectivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-007', 'Monitoreo de amenazas', 'Sistema de vigilancia continua de amenazas internas y externas.', '{"basis":"Ciberseguridad","risk_coverage":["ceguera ante amenazas"],"control_type":"detectivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-008', 'Gestion de respuesta a incidentes', 'Procedimientos definidos para respuesta oportuna ante incidentes de seguridad.', '{"basis":"Gestion de incidentes","risk_coverage":["respuesta tardia ante amenazas"],"control_type":"correctivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-009', 'Revision de seguridad en diseno', 'Evaluacion de seguridad en fases de diseno de sistemas y proyectos.', '{"basis":"Secure by design","risk_coverage":["diseno inseguro de proyectos y sistemas"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-010', 'Inventario de activos actualizado', 'Registro completo y actualizado de todos los activos de informacion.', '{"basis":"Gestion de activos","risk_coverage":["activos no identificados"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-011', 'Uso adecuado de activos', 'Politicas y controles que regulan el uso correcto de activos.', '{"basis":"Uso de activos","risk_coverage":["uso indebido de activos"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-012', 'Proteccion contra perdida de activos', 'Controles fisicos y logicos para prevenir perdida de activos.', '{"basis":"Seguridad fisica","risk_coverage":["perdida de activos"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-013', 'Clasificacion de informacion', 'Clasificacion y etiquetado de informacion para evitar sobreexposicion.', '{"basis":"Gestion de informacion","risk_coverage":["sobreexposicion de informacion"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-014', 'Proteccion de informacion sensible', 'Controles de proteccion adecuados segun nivel de sensibilidad.', '{"basis":"Seguridad de la informacion","risk_coverage":["subproteccion de informacion"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-015', 'Gestion adecuada de informacion', 'Procedimientos para manejo seguro de la informacion durante su ciclo de vida.', '{"basis":"Gestion de datos","risk_coverage":["manejo incorrecto de informacion"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-016', 'Cifrado de informacion en transito', 'Uso de mecanismos criptograficos para proteger informacion en transito.', '{"basis":"Cifrado","risk_coverage":["interceptacion o manipulacion de informacion en transito"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-017', 'Control de accesos', 'Implementacion de autenticacion y autorizacion para prevenir accesos no autorizados.', '{"basis":"IAM","risk_coverage":["acceso no autorizado"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-018', 'Prevencion de escalamiento de privilegios', 'Controles tecnicos para evitar elevacion indebida de privilegios.', '{"basis":"Seguridad tecnica","risk_coverage":["escalamiento de privilegios"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-019', 'Gestion del ciclo de vida de accesos', 'Revision periodica y revocacion de accesos innecesarios.', '{"basis":"IAM lifecycle","risk_coverage":["persistencia indebida de accesos"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-020', 'Gestion de terceros', 'Evaluacion y monitoreo de riesgos asociados a terceros y proveedores.', '{"basis":"Third-party risk","risk_coverage":["riesgo de terceros y cadena de suministro"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-021', 'Gestion integral de incidentes', 'Proceso estructurado de identificacion, analisis y resolucion de incidentes.', '{"basis":"Incidentes","risk_coverage":["gestion deficiente de incidentes"],"control_type":"correctivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-022', 'Preservacion de evidencia', 'Mecanismos para garantizar integridad y disponibilidad de evidencia.', '{"basis":"Forense","risk_coverage":["perdida de evidencia y trazabilidad forense"],"control_type":"detectivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-023', 'Analisis de causa raiz', 'Evaluacion de incidentes para evitar recurrencia.', '{"basis":"Mejora continua","risk_coverage":["reincidencia de incidentes"],"control_type":"correctivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-024', 'Plan de continuidad operativa', 'Definicion de planes para asegurar operacion ante interrupciones.', '{"basis":"BCP","risk_coverage":["interrupcion operativa"],"control_type":"preventivo"}'::jsonb),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-025', 'Plan de continuidad del negocio', 'Estrategias para recuperacion y continuidad del negocio.', '{"basis":"BCM","risk_coverage":["perdida de continuidad del negocio"],"control_type":"preventivo"}'::jsonb)
  ) AS t(reino_id, code, name, description, rationale)
),
catalog AS (
  SELECT
    (SELECT id FROM catalogos.corpus_catalog_control_type WHERE lower(code) = 'preventivo' LIMIT 1) AS ct_preventivo,
    (SELECT id FROM catalogos.corpus_catalog_control_type WHERE lower(code) = 'detectivo' LIMIT 1) AS ct_detectivo,
    (SELECT id FROM catalogos.corpus_catalog_control_type WHERE lower(code) = 'correctivo' LIMIT 1) AS ct_correctivo,
    (SELECT id FROM catalogos.corpus_catalog_control_automation WHERE lower(code) = 'manual' LIMIT 1) AS aut_manual,
    (SELECT id FROM catalogos.corpus_catalog_control_automation WHERE lower(code) = 'semi' LIMIT 1) AS aut_semi,
    (SELECT id FROM catalogos.corpus_catalog_control_frequency WHERE lower(code) = 'event' LIMIT 1) AS fq_event,
    (SELECT id FROM catalogos.corpus_catalog_control_frequency WHERE lower(code) = 'periodic' LIMIT 1) AS fq_periodic,
    (SELECT id FROM catalogos.corpus_catalog_control_frequency WHERE lower(code) = 'continuous' LIMIT 1) AS fq_continuous
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
    s.reino_id,
    s.code,
    s.name,
    s.description,
    s.rationale,
    CASE lower(coalesce(s.rationale ->> 'control_type', ''))
      WHEN 'preventivo' THEN c.ct_preventivo
      WHEN 'detectivo' THEN c.ct_detectivo
      WHEN 'correctivo' THEN c.ct_correctivo
      ELSE c.ct_preventivo
    END AS control_type_id,
    CASE lower(coalesce(s.rationale ->> 'control_type', ''))
      WHEN 'detectivo' THEN c.aut_semi
      ELSE c.aut_manual
    END AS automation_id,
    CASE lower(coalesce(s.rationale ->> 'control_type', ''))
      WHEN 'correctivo' THEN c.fq_event
      WHEN 'detectivo' THEN c.fq_continuous
      ELSE c.fq_periodic
    END AS frequency_id,
    true AS evidence_required,
    'active' AS status,
    2 AS status_id,
    false AS is_hard_gate,
    true AS required_test
  FROM src s
  CROSS JOIN catalog c
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
