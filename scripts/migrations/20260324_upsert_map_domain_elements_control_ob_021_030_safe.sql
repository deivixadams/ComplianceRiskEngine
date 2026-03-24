-- Safe upsert for OB_021..OB_030.
-- Inserts only rows whose control_id exists in graph.control
-- and whose element_id exists in graph.map_domain_element.

WITH src (
  control_id,
  element_id,
  satisfaction_mode,
  evidence_required,
  min_coverage_threshold,
  regulator_acceptance,
  max_usable_coverage,
  role_in_satisfaction,
  is_primary,
  is_mandatory,
  aggregation_group,
  sequence_order,
  dependency_rule,
  coverage_weight,
  rationale
) AS (
  VALUES
  -- OB_021
  ('63982b10-1637-4c32-84b4-60da9751f357','8c5b7d40-3c9b-4bd4-a8a7-0b4bc1d57b11','WEIGHTED',true,0.85,'HIGH',0.90,'PRIMARY',true,true,'OB_021_OC_REMOVAL',1,'REQUIRES_PRIMARY',0.40,'{"basis":"La remocion del Oficial de Cumplimiento debe estar formalmente asignada y regulada para impedir desvinculaciones arbitrarias o sin competencia definida."}'),
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','8c5b7d40-3c9b-4bd4-a8a7-0b4bc1d57b11','WEIGHTED',true,0.85,'HIGH',0.80,'SUPPORT',false,true,'OB_021_OC_REMOVAL',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"La estructura organizacional clara y definida soporta la remocion formal al establecer organos competentes, jerarquia y lineas de escalamiento."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','8c5b7d40-3c9b-4bd4-a8a7-0b4bc1d57b11','WEIGHTED',true,0.85,'HIGH',0.60,'EVIDENCE',false,true,'OB_021_OC_REMOVAL',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La integridad y resguardo de registros permite demostrar causa, aprobacion y trazabilidad documental de la remocion del Oficial de Cumplimiento."}'),

  -- OB_022
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','66c1cf55-f5ba-478b-9524-f4a3f9c6b212','WEIGHTED',true,0.75,'HIGH',1.00,'PRIMARY',true,true,'OB_022_AML_COMMITTEE',1,'REQUIRES_PRIMARY',0.45,'{"basis":"La existencia de un comite AML con atribuciones definidas depende de una estructura de gobierno formal que lo instituya, ubique y articule dentro de la organizacion."}'),
  ('63982b10-1637-4c32-84b4-60da9751f357','66c1cf55-f5ba-478b-9524-f4a3f9c6b212','WEIGHTED',true,0.75,'HIGH',0.70,'SUPPORT',false,true,'OB_022_AML_COMMITTEE',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La asignacion formal de responsabilidades soporta la definicion de atribuciones, integrantes, quorum y deberes del comite AML."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','66c1cf55-f5ba-478b-9524-f4a3f9c6b212','WEIGHTED',true,0.75,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_022_AML_COMMITTEE',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La integridad documental soporta evidencia de constitucion, actas, decisiones y seguimiento del comite AML."}'),

  -- OB_023
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','31da1e8a-1e09-4c44-b179-9f4e52b3a9d3','WEIGHTED',true,0.70,'HIGH',0.90,'PRIMARY',true,true,'OB_023_AML_COMMITTEE_SESSIONS',1,'REQUIRES_PRIMARY',0.40,'{"basis":"Las sesiones periodicas del comite AML requieren trazabilidad operativa de convocatorias, reuniones, temas tratados y decisiones adoptadas."}'),
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','31da1e8a-1e09-4c44-b179-9f4e52b3a9d3','WEIGHTED',true,0.70,'MEDIUM',0.70,'SUPPORT',false,true,'OB_023_AML_COMMITTEE_SESSIONS',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"La estructura de gobierno soporta la periodicidad de sesiones al definir formalmente frecuencia, escalamiento y rendicion del comite AML."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','31da1e8a-1e09-4c44-b179-9f4e52b3a9d3','WEIGHTED',true,0.70,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_023_AML_COMMITTEE_SESSIONS',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La integridad y resguardo de registros conserva evidencia defendible de asistencia, actas y acuerdos de las sesiones periodicas."}'),

  -- OB_024
  ('9b2f4965-fc87-4dc5-84f3-17ed3e6c88e0','db4df1cb-a827-45b8-a31d-10f4d5d6d2fd','WEIGHTED',true,0.80,'HIGH',0.90,'PRIMARY',true,true,'OB_024_ESCALATION',1,'REQUIRES_PRIMARY',0.40,'{"basis":"El escalamiento de asuntos criticos AML requiere mecanismos de reporte oportuno que permitan elevar alertas, incumplimientos y riesgos relevantes sin demora."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','db4df1cb-a827-45b8-a31d-10f4d5d6d2fd','WEIGHTED',true,0.80,'HIGH',0.70,'SUPPORT',false,true,'OB_024_ESCALATION',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"La trazabilidad operativa soporta el escalamiento al permitir reconstruir origen, ruta, destinatario y resolucion de cada asunto critico."}'),
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','db4df1cb-a827-45b8-a31d-10f4d5d6d2fd','WEIGHTED',true,0.80,'MEDIUM',0.50,'GUARDRAIL',false,false,'OB_024_ESCALATION',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La estructura organizacional clara actua como resguardo para asegurar canales de escalamiento definidos y sin bloqueos indebidos."}'),

  -- OB_025
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','d2e4f9c7-e6a3-4d0a-8d7b-9d22b435a8ec','WEIGHTED',true,0.75,'HIGH',0.90,'PRIMARY',true,true,'OB_025_BOARD_REPORTING',1,'REQUIRES_PRIMARY',0.40,'{"basis":"El reporte periodico al Consejo exige trazabilidad de informes, entregas, contenidos y recepcion por el maximo nivel de gobierno."}'),
  ('0e4a5087-5002-46b5-bc78-3401df64418f','d2e4f9c7-e6a3-4d0a-8d7b-9d22b435a8ec','WEIGHTED',true,0.75,'HIGH',0.70,'SUPPORT',false,true,'OB_025_BOARD_REPORTING',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"Las metricas de seguridad y monitoreo soportan el reporte periodico al Consejo al proveer indicadores objetivos sobre riesgo, alertas y desempeno AML."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','d2e4f9c7-e6a3-4d0a-8d7b-9d22b435a8ec','WEIGHTED',true,0.75,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_025_BOARD_REPORTING',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La integridad de registros conserva evidencia defendible de presentaciones, anexos, actas y seguimiento del reporte al Consejo."}'),

  -- OB_026
  ('91156f74-0919-42fc-9849-d8fdc0ff2c56','b1ef4737-b6a4-4fa7-9d3a-962592e3770d','WEIGHTED',true,0.80,'HIGH',1.00,'PRIMARY',true,true,'OB_026_INDEPENDENT_REVIEW',1,'REQUIRES_PRIMARY',0.45,'{"basis":"La evaluacion independiente AML se satisface primariamente mediante auditoria de seguridad o control independiente que revise objetivamente diseno, ejecucion y efectividad del programa."}'),
  ('75a189ab-54fb-4717-9415-77eb1114c1ac','b1ef4737-b6a4-4fa7-9d3a-962592e3770d','WEIGHTED',true,0.80,'HIGH',0.70,'SUPPORT',false,true,'OB_026_INDEPENDENT_REVIEW',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La evaluacion periodica de efectividad de controles soporta la revision independiente al aportar metodologia, hallazgos y criterios de desempeno verificables."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','b1ef4737-b6a4-4fa7-9d3a-962592e3770d','WEIGHTED',true,0.80,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_026_INDEPENDENT_REVIEW',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La integridad documental soporta la evidencia de alcance, resultados, recomendaciones e independencia de la evaluacion AML."}'),

  -- OB_027
  ('f9248ece-4580-469c-b3e4-098ac7d1dfac','c8a6f4b1-19f7-4b8d-8709-01e7d8bd2c9a','WEIGHTED',true,0.75,'HIGH',0.90,'PRIMARY',true,true,'OB_027_ACTION_PLANS',1,'REQUIRES_PRIMARY',0.45,'{"basis":"El seguimiento a planes de accion AML requiere un control centralizado de hallazgos y remediaciones con estatus, responsables, fechas y evidencia de cierre."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','c8a6f4b1-19f7-4b8d-8709-01e7d8bd2c9a','WEIGHTED',true,0.75,'HIGH',0.70,'SUPPORT',false,true,'OB_027_ACTION_PLANS',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La trazabilidad operativa soporta la ejecucion del plan de accion al permitir reconstruir avance, bloqueos, aprobaciones y resultados logrados."}'),
  ('75a189ab-54fb-4717-9415-77eb1114c1ac','c8a6f4b1-19f7-4b8d-8709-01e7d8bd2c9a','WEIGHTED',true,0.75,'MEDIUM',0.50,'FOLLOW_UP',false,false,'OB_027_ACTION_PLANS',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La evaluacion periodica de efectividad permite verificar si las acciones correctivas realmente mitigaron la brecha AML detectada."}'),

  -- OB_028
  ('304e8eec-eb22-4e8c-ba05-bcf086ecbd85','4bfb42c9-d497-4ee5-ae88-9e54b9cb8f47','WEIGHTED',true,0.80,'HIGH',0.90,'PRIMARY',true,true,'OB_028_HIGH_RISK_CLIENTS',1,'REQUIRES_PRIMARY',0.40,'{"basis":"La politica de aceptacion de clientes de alto riesgo debe partir de un proceso robusto de identificacion y priorizacion de riesgos que establezca criterios de admision y restriccion."}'),
  ('6defef9b-40da-4503-808d-3d4c36e56480','4bfb42c9-d497-4ee5-ae88-9e54b9cb8f47','WEIGHTED',true,0.80,'HIGH',0.70,'SUPPORT',false,true,'OB_028_HIGH_RISK_CLIENTS',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"El cumplimiento de politicas soporta la aplicacion consistente de criterios para aceptar, rechazar o escalar clientes de alto riesgo."}'),
  ('1c5d29cb-fa83-4bd3-8551-b6f3e375a2c7','4bfb42c9-d497-4ee5-ae88-9e54b9cb8f47','WEIGHTED',true,0.80,'MEDIUM',0.50,'SUPPORT',false,false,'OB_028_HIGH_RISK_CLIENTS',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La gestion del ciclo de vida de accesos soporta la restriccion y control de decisiones de aceptacion sobre clientes de alto riesgo."}'),

  -- OB_029
  ('304e8eec-eb22-4e8c-ba05-bcf086ecbd85','84f350d0-5ac7-4d40-8178-4f652f8ed64b','WEIGHTED',true,0.85,'HIGH',0.90,'PRIMARY',true,true,'OB_029_EDD',1,'REQUIRES_PRIMARY',0.40,'{"basis":"La debida diligencia reforzada exige identificacion y priorizacion de riesgos para activar medidas mas intensas frente a clientes, productos o jurisdicciones de mayor exposicion."}'),
  ('6defef9b-40da-4503-808d-3d4c36e56480','84f350d0-5ac7-4d40-8178-4f652f8ed64b','WEIGHTED',true,0.85,'HIGH',0.70,'SUPPORT',false,true,'OB_029_EDD',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"El cumplimiento de politicas soporta la ejecucion consistente de la debida diligencia reforzada conforme reglas, umbrales y aprobaciones definidas."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','84f350d0-5ac7-4d40-8178-4f652f8ed64b','WEIGHTED',true,0.85,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_029_EDD',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La trazabilidad operativa permite demostrar analisis, documentos revisados, escalamiento y decision final de diligencia reforzada."}'),

  -- OB_030
  ('6defef9b-40da-4503-808d-3d4c36e56480','17f74d14-d7f0-4a0d-93a5-e6b8efc14cb6','WEIGHTED',true,0.85,'HIGH',0.90,'PRIMARY',true,true,'OB_030_BENEFICIAL_OWNER',1,'REQUIRES_PRIMARY',0.40,'{"basis":"La identificacion del beneficiario final exige politicas y procedimientos consistentes para obtener, validar y actualizar la informacion requerida."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','17f74d14-d7f0-4a0d-93a5-e6b8efc14cb6','WEIGHTED',true,0.85,'HIGH',0.70,'EVIDENCE',false,true,'OB_030_BENEFICIAL_OWNER',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"La integridad y resguardo de registros soporta la evidencia documental sobre titularidad real, soporte societario y actualizaciones del beneficiario final."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','17f74d14-d7f0-4a0d-93a5-e6b8efc14cb6','WEIGHTED',true,0.85,'MEDIUM',0.50,'SUPPORT',false,false,'OB_030_BENEFICIAL_OWNER',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La trazabilidad operativa permite demostrar obtencion, validacion, cambios y uso de la informacion de beneficiario final dentro del ciclo AML."}')
),
normalized AS (
  SELECT
    control_id::uuid AS control_id,
    element_id::uuid AS element_id,
    satisfaction_mode,
    evidence_required,
    min_coverage_threshold,
    regulator_acceptance,
    max_usable_coverage,
    CASE
      WHEN role_in_satisfaction = 'SUPPORT' THEN 'EXECUTION'
      WHEN role_in_satisfaction = 'GUARDRAIL' THEN 'COMPENSATING'
      WHEN role_in_satisfaction = 'FOLLOW_UP' THEN 'OVERSIGHT'
      ELSE role_in_satisfaction
    END AS role_in_satisfaction,
    is_primary,
    is_mandatory,
    aggregation_group,
    sequence_order,
    dependency_rule,
    coverage_weight,
    rationale::jsonb AS rationale
  FROM src
),
insertable AS (
  SELECT n.*
  FROM normalized n
  JOIN graph.control c ON c.id = n.control_id
  JOIN graph.map_domain_element mde ON mde.element_id = n.element_id
)
INSERT INTO graph.map_domain_elements_control (
  control_id,
  element_id,
  satisfaction_mode,
  evidence_required,
  min_coverage_threshold,
  regulator_acceptance,
  created_at,
  updated_at,
  max_usable_coverage,
  role_in_satisfaction,
  is_primary,
  is_mandatory,
  aggregation_group,
  sequence_order,
  dependency_rule,
  coverage_weight,
  rationale
)
SELECT
  control_id,
  element_id,
  satisfaction_mode,
  evidence_required,
  min_coverage_threshold,
  regulator_acceptance,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  max_usable_coverage,
  role_in_satisfaction,
  is_primary,
  is_mandatory,
  aggregation_group,
  sequence_order,
  dependency_rule,
  coverage_weight,
  rationale
FROM insertable
ON CONFLICT (control_id, element_id)
DO UPDATE SET
  satisfaction_mode = EXCLUDED.satisfaction_mode,
  evidence_required = EXCLUDED.evidence_required,
  min_coverage_threshold = EXCLUDED.min_coverage_threshold,
  regulator_acceptance = EXCLUDED.regulator_acceptance,
  updated_at = CURRENT_TIMESTAMP,
  max_usable_coverage = EXCLUDED.max_usable_coverage,
  role_in_satisfaction = EXCLUDED.role_in_satisfaction,
  is_primary = EXCLUDED.is_primary,
  is_mandatory = EXCLUDED.is_mandatory,
  aggregation_group = EXCLUDED.aggregation_group,
  sequence_order = EXCLUDED.sequence_order,
  dependency_rule = EXCLUDED.dependency_rule,
  coverage_weight = EXCLUDED.coverage_weight,
  rationale = EXCLUDED.rationale;
