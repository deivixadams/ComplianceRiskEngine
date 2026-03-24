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
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-026', 'Cumplimiento legal, regulatorio y contractual', 'Control orientado a identificar, evaluar y monitorear obligaciones legales, regulatorias y contractuales aplicables, asi como a verificar su cumplimiento oportuno.', '{"basis":"Cumplimiento normativo","risk_coverage":["incumplimiento legal, regulatorio o contractual"]}'::jsonb, 'Preventivo', 'manual', 'periodic'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-027', 'Proteccion de propiedad intelectual', 'Medidas para proteger activos sujetos a propiedad intelectual, controlar su uso autorizado y prevenir reproduccion indebida.', '{"basis":"Proteccion juridica","risk_coverage":["violacion de propiedad intelectual"]}'::jsonb, 'Preventivo', 'manual', 'periodic'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-028', 'Integridad y resguardo de registros', 'Controles para asegurar integridad, autenticidad y disponibilidad de registros.', '{"basis":"Gestion documental","risk_coverage":["perdida, alteracion o falsificacion de registros"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-029', 'Proteccion de datos personales', 'Mecanismos de seguridad para garantizar confidencialidad e integridad de datos personales.', '{"basis":"Privacidad","risk_coverage":["exposicion de datos personales"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-030', 'Evaluacion de efectividad de controles', 'Revision periodica de desempeno de controles para detectar debilidades.', '{"basis":"Auditoria interna","risk_coverage":["controles inefectivos no detectados"]}'::jsonb, 'Detectivo', 'manual', 'periodic'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-031', 'Gestion de conocimiento critico', 'Documentacion estructurada del conocimiento operativo clave.', '{"basis":"Resiliencia operativa","risk_coverage":["dependencia de conocimiento tacito"]}'::jsonb, 'Preventivo', 'manual', 'periodic'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-032', 'Gestion de amenaza interna', 'Deteccion de comportamientos anomalos internos.', '{"basis":"Seguridad interna","risk_coverage":["amenaza interna"]}'::jsonb, 'Detectivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-033', 'Prevencion de error humano', 'Capacitacion y controles de validacion para reducir errores.', '{"basis":"Factor humano","risk_coverage":["negligencia o error humano"]}'::jsonb, 'Preventivo', 'manual', 'periodic'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-034', 'Seguridad en trabajo remoto', 'Proteccion de accesos y dispositivos en entornos remotos.', '{"basis":"Teletrabajo seguro","risk_coverage":["riesgos de trabajo remoto"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-035', 'Reporte oportuno de eventos', 'Registro y escalamiento inmediato de eventos relevantes.', '{"basis":"Gestion de eventos","risk_coverage":["no reporte oportuno de eventos"]}'::jsonb, 'Detectivo', 'manual', 'event'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-036', 'Control de acceso fisico', 'Restriccion de acceso a instalaciones criticas.', '{"basis":"Seguridad fisica","risk_coverage":["intrusion fisica"]}'::jsonb, 'Preventivo', 'manual', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-037', 'Proteccion contra robo fisico', 'Controles para prevenir sustraccion de activos.', '{"basis":"Proteccion fisica","risk_coverage":["robo fisico"]}'::jsonb, 'Preventivo', 'manual', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-038', 'Proteccion de infraestructura fisica', 'Prevencion de danos fisicos y ambientales.', '{"basis":"Infraestructura critica","risk_coverage":["dano fisico o ambiental a infraestructura"]}'::jsonb, 'Preventivo', 'manual', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-039', 'Proteccion visual de informacion', 'Prevencion de exposicion visual indebida.', '{"basis":"Confidencialidad fisica","risk_coverage":["exposicion visual de informacion"]}'::jsonb, 'Preventivo', 'manual', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-040', 'Seguridad de dispositivos fisicos', 'Proteccion de dispositivos y medios removibles.', '{"basis":"Seguridad de activos","risk_coverage":["compromiso de dispositivos o medios fisicos"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-041', 'Continuidad de servicios de soporte', 'Garantia de disponibilidad de servicios criticos.', '{"basis":"Dependencias","risk_coverage":["fallas de servicios de soporte"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-042', 'Proteccion de cableado', 'Seguridad de infraestructura de red fisica.', '{"basis":"Red fisica","risk_coverage":["intercepcion o dano de cableado"]}'::jsonb, 'Preventivo', 'manual', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-043', 'Mantenimiento de equipos', 'Mantenimiento preventivo y correctivo de equipos.', '{"basis":"Infraestructura TI","risk_coverage":["fallo de equipos"]}'::jsonb, 'Correctivo', 'manual', 'periodic'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-044', 'Borrado seguro de activos', 'Eliminacion segura de datos en activos retirados.', '{"basis":"Disposicion segura","risk_coverage":["recuperacion indebida de datos en activos desechados"]}'::jsonb, 'Preventivo', 'manual', 'event'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-045', 'Proteccion de endpoints', 'Seguridad de estaciones de trabajo y dispositivos.', '{"basis":"Endpoint security","risk_coverage":["compromiso de endpoints"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-046', 'Proteccion contra malware', 'Deteccion y mitigacion de software malicioso.', '{"basis":"Antimalware","risk_coverage":["malware"]}'::jsonb, 'Detectivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-047', 'Prevencion de phishing', 'Controles contra ingenieria social.', '{"basis":"Concienciacion","risk_coverage":["phishing"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-048', 'Gestion de vulnerabilidades', 'Identificacion y remediacion de vulnerabilidades.', '{"basis":"Vulnerability management","risk_coverage":["explotacion de vulnerabilidades tecnicas"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-049', 'Gestion de configuraciones seguras', 'Aplicacion de configuraciones seguras en sistemas.', '{"basis":"Hardening","risk_coverage":["configuraciones inseguras"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-050', 'Prevencion de fuga de informacion', 'Control de salida no autorizada de datos.', '{"basis":"Data protection","risk_coverage":["fuga de informacion"]}'::jsonb, 'Preventivo', 'semi', 'continuous')
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
