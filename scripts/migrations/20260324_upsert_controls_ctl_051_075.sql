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
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-051', 'Proteccion de datos sensibles', 'Controles para identificar, clasificar y resguardar datos sensibles frente a acceso, uso o divulgacion no autorizada.', '{"basis":"Proteccion de informacion sensible","risk_coverage":["exposicion de datos sensibles"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-052', 'Respaldo y recuperacion de datos', 'Mecanismos de copia de seguridad, validacion y restauracion para reducir perdida de datos y asegurar recuperabilidad.', '{"basis":"Resiliencia de datos","risk_coverage":["perdida de datos"]}'::jsonb, 'Correctivo', 'semi', 'periodic'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-053', 'Gestion de disponibilidad de servicios', 'Controles para preservar la disponibilidad de servicios criticos mediante redundancia, monitoreo y recuperacion.', '{"basis":"Disponibilidad operativa","risk_coverage":["perdida de disponibilidad"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-054', 'Gestion de capacidad y rendimiento', 'Monitoreo y ajuste de capacidad para evitar saturacion de recursos e interrupciones por sobrecarga.', '{"basis":"Capacidad operativa","risk_coverage":["saturacion de capacidad"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-055', 'Trazabilidad operativa', 'Generacion y conservacion de registros suficientes para reconstruir eventos, acciones y decisiones operativas.', '{"basis":"Trazabilidad y auditoria","risk_coverage":["falta de trazabilidad operativa"]}'::jsonb, 'Detectivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-056', 'Deteccion de anomalias', 'Controles para identificar patrones atipicos, desviaciones o comportamientos anomalos en procesos, usuarios o sistemas.', '{"basis":"Monitoreo y deteccion","risk_coverage":["deteccion insuficiente de anomalias"]}'::jsonb, 'Detectivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-057', 'Sincronizacion temporal de registros', 'Mecanismos para asegurar sincronia y consistencia temporal en logs, eventos y evidencias.', '{"basis":"Integridad cronologica","risk_coverage":["desincronizacion temporal de registros"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-058', 'Prevencion de bypass de controles', 'Controles para impedir evasion, desactivacion o rodeo indebido de mecanismos de seguridad o validacion.', '{"basis":"Integridad del entorno de control","risk_coverage":["bypass de controles"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-059', 'Control de software autorizado', 'Validacion, restriccion e inventario de software permitido para prevenir instalacion de software no autorizado o malicioso.', '{"basis":"Gestion de software","risk_coverage":["instalacion de software no autorizado o malicioso"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-060', 'Seguridad de red', 'Controles para proteger infraestructura de red frente a acceso indebido, alteracion, intrusion o uso malicioso.', '{"basis":"Seguridad de red","risk_coverage":["compromiso de red"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-061', 'Contencion de movimiento lateral', 'Segmentacion, monitoreo y restricciones de acceso para limitar desplazamiento lateral dentro del entorno tecnologico.', '{"basis":"Contencion de propagacion","risk_coverage":["movimiento lateral"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-062', 'Segmentacion de entornos y redes', 'Separacion logica o fisica de segmentos, sistemas y activos criticos para reducir exposicion cruzada.', '{"basis":"Arquitectura defensiva","risk_coverage":["segmentacion insuficiente"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-063', 'Proteccion de codigo fuente', 'Controles de acceso, integridad y monitoreo sobre repositorios y artefactos de desarrollo para evitar compromiso del codigo fuente.', '{"basis":"Seguridad del ciclo de desarrollo","risk_coverage":["compromiso del codigo fuente"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-064', 'Desarrollo seguro', 'Aplicacion de practicas y criterios de seguridad a lo largo del ciclo de vida de desarrollo de software.', '{"basis":"Secure SDLC","risk_coverage":["desarrollo inseguro"]}'::jsonb, 'Preventivo', 'manual', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-065', 'Gestion de requisitos de seguridad', 'Identificacion, definicion y trazabilidad de requisitos de seguridad desde etapas tempranas del diseno y desarrollo.', '{"basis":"Security requirements","risk_coverage":["omision de requisitos de seguridad"]}'::jsonb, 'Preventivo', 'manual', 'event'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-066', 'Revision de arquitectura segura', 'Evaluacion de decisiones arquitectonicas para reducir debilidades estructurales de seguridad.', '{"basis":"Arquitectura segura","risk_coverage":["arquitectura insegura"]}'::jsonb, 'Preventivo', 'manual', 'event'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-067', 'Practicas de codificacion segura', 'Aplicacion de estandares y revisiones para minimizar defectos de seguridad en el codigo.', '{"basis":"Secure coding","risk_coverage":["codificacion insegura"]}'::jsonb, 'Preventivo', 'manual', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-068', 'Pruebas de seguridad', 'Ejecucion de pruebas orientadas a identificar vulnerabilidades y debilidades antes de puesta en produccion.', '{"basis":"Security testing","risk_coverage":["pruebas de seguridad insuficientes"]}'::jsonb, 'Detectivo', 'semi', 'event'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-069', 'Gestion de desarrollo subcontratado', 'Controles contractuales, tecnicos y de supervision sobre terceros que participan en desarrollo o mantenimiento.', '{"basis":"Third-party development governance","risk_coverage":["riesgo en desarrollo subcontratado"]}'::jsonb, 'Preventivo', 'manual', 'periodic'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-070', 'Separacion de entornos', 'Controles para mantener segregacion efectiva entre desarrollo, pruebas y produccion.', '{"basis":"Segregacion de ambientes","risk_coverage":["mezcla de entornos"]}'::jsonb, 'Preventivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-071', 'Gestion controlada de cambios', 'Proceso formal de evaluacion, aprobacion, prueba e implementacion de cambios para evitar alteraciones no controladas.', '{"basis":"Change management","risk_coverage":["cambios no controlados"]}'::jsonb, 'Preventivo', 'manual', 'event'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-072', 'Proteccion de datos de prueba', 'Controles para evitar exposicion o uso indebido de datos sensibles en ambientes de prueba.', '{"basis":"Seguridad en testing","risk_coverage":["exposicion de datos de prueba"]}'::jsonb, 'Preventivo', 'manual', 'event'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-073', 'Identificacion y priorizacion del riesgo cibernetico', 'Proceso sistematico para identificar, valorar y priorizar riesgos ciberneticos conforme criticidad y exposicion.', '{"basis":"Cyber risk governance","risk_coverage":["identificacion y priorizacion deficiente del riesgo cibernetico"]}'::jsonb, 'Preventivo', 'manual', 'periodic'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-074', 'Visibilidad de activos y superficie de ataque', 'Controles para mantener inventario y visibilidad suficiente sobre activos, software, servicios expuestos y superficie de ataque.', '{"basis":"Asset and attack surface visibility","risk_coverage":["visibilidad insuficiente de activos, software y superficie de ataque"]}'::jsonb, 'Detectivo', 'semi', 'continuous'),
    ('706e297e-4e1d-45bc-a294-0a404eeddf46'::uuid, 'CTL-075', 'Gestion de secretos e identidades no humanas', 'Controles para proteger, rotar y monitorear secretos, credenciales tecnicas e identidades de servicio.', '{"basis":"Identity and secret management","risk_coverage":["compromiso de secretos, credenciales e identidades no humanas"]}'::jsonb, 'Preventivo', 'semi', 'continuous')
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
