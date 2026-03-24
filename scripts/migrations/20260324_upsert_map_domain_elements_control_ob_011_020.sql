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
  -- OB_011
  ('75a189ab-54fb-4717-9415-77eb1114c1ac','f1916187-02f6-46b2-a736-b5cef884be62','WEIGHTED',true,0.70,'HIGH',1.00,'PRIMARY',true,true,'OB_011_TRAINING_EFFECTIVENESS',1,'REQUIRES_PRIMARY',0.50,'{"basis":"La evaluacion de efectividad de la capacitacion requiere un control primario de revision periodica que permita medir si la formacion realmente reduce brechas y mejora desempeno."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','f1916187-02f6-46b2-a736-b5cef884be62','WEIGHTED',true,0.70,'MEDIUM',0.60,'EVIDENCE',false,true,'OB_011_TRAINING_EFFECTIVENESS',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La trazabilidad operativa soporta la evaluacion al conservar registros de asistencia, resultados, brechas y remediaciones derivadas de la capacitacion."}'),
  ('6defef9b-40da-4503-808d-3d4c36e56480','f1916187-02f6-46b2-a736-b5cef884be62','WEIGHTED',true,0.70,'MEDIUM',0.50,'SUPPORT',false,false,'OB_011_TRAINING_EFFECTIVENESS',3,'PRIMARY_PLUS_SUPPORT',0.20,'{"basis":"El cumplimiento de politicas soporta la evaluacion de efectividad al verificar si la capacitacion se refleja en conducta y observancia real de directrices."}'),

  -- OB_012
  ('75a189ab-54fb-4717-9415-77eb1114c1ac','f9248ece-4580-469c-b3e4-098ac7d1dfac','WEIGHTED',true,0.70,'HIGH',0.90,'PRIMARY',true,true,'OB_012_FINDINGS',1,'REQUIRES_PRIMARY',0.40,'{"basis":"La gestion centralizada de hallazgos parte de una evaluacion consistente de controles y brechas detectadas en distintas revisiones."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','f9248ece-4580-469c-b3e4-098ac7d1dfac','WEIGHTED',true,0.70,'HIGH',0.80,'EVIDENCE',false,true,'OB_012_FINDINGS',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"La trazabilidad operativa es clave para centralizar hallazgos, responsables, fechas compromiso, estatus y reincidencias de forma defendible."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','f9248ece-4580-469c-b3e4-098ac7d1dfac','WEIGHTED',true,0.70,'MEDIUM',0.60,'SUPPORT',false,false,'OB_012_FINDINGS',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La integridad y resguardo de registros asegura que los hallazgos centralizados no puedan ser alterados, omitidos o destruidos."}'),

  -- OB_013
  ('5e2f50a3-f3e9-43c9-a466-d7014858e8e2','889e369f-9fe6-4550-ab9c-cf93571189cc','WEIGHTED',true,0.70,'HIGH',0.90,'PRIMARY',true,true,'OB_013_EXCEPTIONS',1,'REQUIRES_PRIMARY',0.45,'{"basis":"La gestion formal de excepciones AML requiere un proceso controlado de evaluacion, aprobacion y documentacion de cambios o desvios permitidos."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','889e369f-9fe6-4550-ab9c-cf93571189cc','WEIGHTED',true,0.70,'HIGH',0.70,'EVIDENCE',false,true,'OB_013_EXCEPTIONS',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La trazabilidad operativa soporta la gestion de excepciones al reconstruir quien autorizo, bajo que condicion y con que vencimiento o compensacion."}'),
  ('f2d94382-2f93-49a2-a490-8f4b29939e43','889e369f-9fe6-4550-ab9c-cf93571189cc','WEIGHTED',true,0.70,'MEDIUM',0.50,'SUPPORT',false,false,'OB_013_EXCEPTIONS',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"El cumplimiento regulatorio complementa la gestion formal de excepciones al asegurar que ninguna excepcion vulnere limites normativos o mandatos legales."}'),

  -- OB_014
  ('5e2f50a3-f3e9-43c9-a466-d7014858e8e2','0336f07c-2e1c-4735-ad2f-100f8d02c4b5','WEIGHTED',true,0.75,'HIGH',1.00,'PRIMARY',true,true,'OB_014_CHANGE_RISK',1,'REQUIRES_PRIMARY',0.45,'{"basis":"La obligacion exige que todo cambio relevante pase por un flujo formal de evaluacion, aprobacion, prueba e implementacion controlada."}'),
  ('304e8eec-eb22-4e8c-ba05-bcf086ecbd85','0336f07c-2e1c-4735-ad2f-100f8d02c4b5','WEIGHTED',true,0.75,'HIGH',0.70,'SUPPORT',false,true,'OB_014_CHANGE_RISK',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"La identificacion y priorizacion del riesgo soporta la gestion de cambios al exigir valoracion previa del impacto y criticidad del cambio."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','0336f07c-2e1c-4735-ad2f-100f8d02c4b5','WEIGHTED',true,0.75,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_014_CHANGE_RISK',3,'PRIMARY_PLUS_SUPPORT',0.20,'{"basis":"La trazabilidad operativa permite demostrar el expediente completo del cambio, desde la solicitud hasta la aprobacion y despliegue."}'),

  -- OB_015
  ('63982b10-1637-4c32-84b4-60da9751f357','b1ad2bb6-7e69-4b36-b63c-107eecadcad4','WEIGHTED',true,0.85,'HIGH',1.00,'PRIMARY',true,true,'OB_015_OC_APPOINTMENT',1,'REQUIRES_PRIMARY',0.45,'{"basis":"La designacion formal del Oficial de Cumplimiento exige asignacion explicita, documentada y no ambigua de la responsabilidad critica."}'),
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','b1ad2bb6-7e69-4b36-b63c-107eecadcad4','WEIGHTED',true,0.85,'HIGH',0.80,'SUPPORT',false,true,'OB_015_OC_APPOINTMENT',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"La estructura organizacional clara y definida demuestra posicionamiento formal del Oficial de Cumplimiento dentro del gobierno institucional."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','b1ad2bb6-7e69-4b36-b63c-107eecadcad4','WEIGHTED',true,0.85,'HIGH',0.60,'EVIDENCE',false,true,'OB_015_OC_APPOINTMENT',3,'PRIMARY_PLUS_SUPPORT',0.20,'{"basis":"La integridad y resguardo de registros soporta la evidencia de nombramiento, actas, aprobaciones y vigencia del cargo."}'),

  -- OB_016
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','5858eac4-d8d1-4730-ae37-29694b674791','WEIGHTED',true,0.85,'HIGH',1.00,'PRIMARY',true,true,'OB_016_OC_INDEPENDENCE',1,'REQUIRES_PRIMARY',0.45,'{"basis":"La independencia funcional del Oficial de Cumplimiento depende de una estructura organizacional que evite subordinacion indebida y conflictos de interes."}'),
  ('63982b10-1637-4c32-84b4-60da9751f357','5858eac4-d8d1-4730-ae37-29694b674791','WEIGHTED',true,0.85,'HIGH',0.70,'SUPPORT',false,true,'OB_016_OC_INDEPENDENCE',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La asignacion formal de responsabilidades delimita funciones del Oficial de Cumplimiento frente a negocio, operacion y control."}'),
  ('f2d94382-2f93-49a2-a490-8f4b29939e43','5858eac4-d8d1-4730-ae37-29694b674791','WEIGHTED',true,0.85,'MEDIUM',0.50,'GUARDRAIL',false,false,'OB_016_OC_INDEPENDENCE',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"El cumplimiento regulatorio actua como control de resguardo para asegurar que la independencia funcional cumpla exigencias legales y supervisoras."}'),

  -- OB_017
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','a0076fee-b1e2-4254-a794-8bcf45e6f125','WEIGHTED',true,0.75,'HIGH',0.90,'PRIMARY',true,true,'OB_017_BOARD_ACCESS',1,'REQUIRES_PRIMARY',0.40,'{"basis":"El acceso directo al organo de administracion requiere una estructura formal de gobierno y lineas de escalamiento sin intermediacion obstructiva."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','a0076fee-b1e2-4254-a794-8bcf45e6f125','WEIGHTED',true,0.75,'HIGH',0.70,'EVIDENCE',false,true,'OB_017_BOARD_ACCESS',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"La trazabilidad operativa permite demostrar reportes, escalamiento, acceso efectivo a sesiones y seguimiento de asuntos elevados al consejo."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','a0076fee-b1e2-4254-a794-8bcf45e6f125','WEIGHTED',true,0.75,'MEDIUM',0.50,'SUPPORT',false,false,'OB_017_BOARD_ACCESS',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La integridad documental soporta evidencia de presentaciones, actas, decisiones y comunicaciones directas con el organo de administracion."}'),

  -- OB_018
  ('448bab5b-a1cc-42b5-a513-7897875d8b9b','e021db55-3f8e-489c-b11a-1ad8632ca310','WEIGHTED',true,0.80,'HIGH',0.90,'PRIMARY',true,true,'OB_018_AML_DATA_ACCESS',1,'REQUIRES_PRIMARY',0.40,'{"basis":"El acceso efectivo a datos AML requiere control formal de accesos para habilitar disponibilidad legitima, segura y oportuna de la informacion necesaria."}'),
  ('1c5d29cb-fa83-4bd3-8551-b6f3e375a2c7','e021db55-3f8e-489c-b11a-1ad8632ca310','WEIGHTED',true,0.80,'HIGH',0.70,'SUPPORT',false,true,'OB_018_AML_DATA_ACCESS',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"La gestion del ciclo de vida de accesos asegura altas, modificaciones y revocaciones coherentes con el acceso requerido para funciones AML."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','e021db55-3f8e-489c-b11a-1ad8632ca310','WEIGHTED',true,0.80,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_018_AML_DATA_ACCESS',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La trazabilidad operativa aporta evidencia verificable de consultas, uso, restricciones y disponibilidad de datos AML."}'),

  -- OB_019
  ('63982b10-1637-4c32-84b4-60da9751f357','6dd11e67-cd09-43d6-b30b-4a1e8728e751','WEIGHTED',true,0.80,'HIGH',0.90,'PRIMARY',true,true,'OB_019_STOP_ONBOARDING',1,'REQUIRES_PRIMARY',0.40,'{"basis":"La facultad de detener onboarding debe estar explicitamente asignada y formalizada para que pueda ejercerse sin disputa o ambiguedad."}'),
  ('5e2f50a3-f3e9-43c9-a466-d7014858e8e2','6dd11e67-cd09-43d6-b30b-4a1e8728e751','WEIGHTED',true,0.80,'HIGH',0.70,'SUPPORT',false,true,'OB_019_STOP_ONBOARDING',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"La gestion controlada de cambios y aprobaciones soporta la capacidad de bloquear o detener procesos de incorporacion ante alertas o incumplimientos."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','6dd11e67-cd09-43d6-b30b-4a1e8728e751','WEIGHTED',true,0.80,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_019_STOP_ONBOARDING',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La trazabilidad operativa permite demostrar decisiones de stop, fundamento, aprobacion y efecto real sobre el onboarding."}'),

  -- OB_020
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','26dc219a-2ca5-48dd-820e-af380ef53b2e','WEIGHTED',true,0.75,'HIGH',0.90,'PRIMARY',true,true,'OB_020_OC_PROTECTION',1,'REQUIRES_PRIMARY',0.40,'{"basis":"La proteccion funcional del Oficial de Cumplimiento exige una estructura de gobierno que preserve su rol frente a presiones operativas o comerciales indebidas."}'),
  ('63982b10-1637-4c32-84b4-60da9751f357','26dc219a-2ca5-48dd-820e-af380ef53b2e','WEIGHTED',true,0.75,'HIGH',0.70,'SUPPORT',false,true,'OB_020_OC_PROTECTION',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La asignacion formal de responsabilidades delimita el mandato protegido del Oficial de Cumplimiento y evita interferencias incompatibles con su funcion."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','26dc219a-2ca5-48dd-820e-af380ef53b2e','WEIGHTED',true,0.75,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_020_OC_PROTECTION',3,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La integridad y resguardo de registros soporta evidencia de decisiones, reportes y actuaciones del Oficial de Cumplimiento frente a posibles interferencias."}')
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
  control_id::uuid,
  element_id::uuid,
  satisfaction_mode,
  evidence_required,
  min_coverage_threshold,
  regulator_acceptance,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP,
  max_usable_coverage,
  CASE
    WHEN role_in_satisfaction = 'SUPPORT' THEN 'EXECUTION'
    WHEN role_in_satisfaction = 'GUARDRAIL' THEN 'COMPENSATING'
    ELSE role_in_satisfaction
  END,
  is_primary,
  is_mandatory,
  aggregation_group,
  sequence_order,
  dependency_rule,
  coverage_weight,
  rationale::jsonb
FROM src
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
