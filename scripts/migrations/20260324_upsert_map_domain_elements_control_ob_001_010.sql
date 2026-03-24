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
  -- OB_001
  ('f2d94382-2f93-49a2-a490-8f4b29939e43','43e875b5-99cd-4374-9800-8d98fbfb8b41','WEIGHTED',true,0.80,'HIGH',1.00,'PRIMARY',true,true,'OB_001_CORE',1,'REQUIRES_PRIMARY',0.50,'{"basis":"La adopcion formal del programa AML exige un control rector de cumplimiento legal y regulatorio que asegure existencia formal, alineacion normativa y exigibilidad institucional."}'),
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','43e875b5-99cd-4374-9800-8d98fbfb8b41','WEIGHTED',true,0.80,'HIGH',0.70,'SUPPORT',false,true,'OB_001_CORE',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La estructura organizacional formal soporta la adopcion efectiva del programa AML al definir gobierno, lineas de reporte y ubicacion institucional del programa."}'),
  ('6defef9b-40da-4503-808d-3d4c36e56480','43e875b5-99cd-4374-9800-8d98fbfb8b41','WEIGHTED',true,0.80,'MEDIUM',0.50,'SUPPORT',false,false,'OB_001_CORE',3,'PRIMARY_PLUS_SUPPORT',0.20,'{"basis":"El cumplimiento de politicas materializa la adopcion formal del programa mediante evidencia de implementacion y observancia operativa."}'),

  -- OB_002
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','e97627b0-4b55-489e-b871-9ec11a9016ae','WEIGHTED',true,0.80,'HIGH',1.00,'PRIMARY',true,true,'OB_002_GOV',1,'REQUIRES_PRIMARY',0.45,'{"basis":"La aprobacion por el organo de administracion requiere evidencia de gobierno formal, estructura aprobatoria y trazabilidad de decisiones al maximo nivel."}'),
  ('63982b10-1637-4c32-84b4-60da9751f357','e97627b0-4b55-489e-b871-9ec11a9016ae','WEIGHTED',true,0.80,'HIGH',0.70,'SUPPORT',false,true,'OB_002_GOV',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La asignacion formal de responsabilidades soporta la aprobacion del programa al identificar responsables de propuesta, revision, escalamiento y ejecucion."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','e97627b0-4b55-489e-b871-9ec11a9016ae','WEIGHTED',true,0.80,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_002_GOV',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La integridad y resguardo de registros asegura evidencia defendible de actas, aprobaciones y version aprobada por el organo de administracion."}'),

  -- OB_003
  ('0844a742-3ab3-4666-b461-ff23520db747','a167c248-99b3-43a8-bdf0-8f7db1ad9d76','WEIGHTED',true,0.70,'HIGH',1.00,'PRIMARY',true,true,'OB_003_VERSION',1,'REQUIRES_PRIMARY',0.50,'{"basis":"El versionado formal depende primariamente de controles de integridad, resguardo y autenticidad documental que permitan demostrar historia, vigencia y cambios aprobados del programa AML."}'),
  ('5e2f50a3-f3e9-43c9-a466-d7014858e8e2','a167c248-99b3-43a8-bdf0-8f7db1ad9d76','WEIGHTED',true,0.70,'HIGH',0.70,'SUPPORT',false,true,'OB_003_VERSION',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La gestion controlada de cambios soporta el versionado al exigir evaluacion, aprobacion, prueba e implementacion formal de modificaciones."}'),
  ('f2d94382-2f93-49a2-a490-8f4b29939e43','a167c248-99b3-43a8-bdf0-8f7db1ad9d76','WEIGHTED',true,0.70,'MEDIUM',0.50,'SUPPORT',false,false,'OB_003_VERSION',3,'PRIMARY_PLUS_SUPPORT',0.20,'{"basis":"El control de cumplimiento asegura que el versionado responda a cambios regulatorios y mantenga alineacion normativa verificable."}'),

  -- OB_004
  ('63982b10-1637-4c32-84b4-60da9751f357','71d7bacf-a646-4301-a78f-f78cc7a267d2','WEIGHTED',true,0.80,'HIGH',1.00,'PRIMARY',true,true,'OB_004_RESOURCES',1,'REQUIRES_PRIMARY',0.45,'{"basis":"La asignacion formal de responsabilidades permite aterrizar recursos suficientes mediante dueños claros de funciones, cargas y capacidad operativa del programa AML."}'),
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','71d7bacf-a646-4301-a78f-f78cc7a267d2','WEIGHTED',true,0.80,'HIGH',0.70,'SUPPORT',false,true,'OB_004_RESOURCES',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"Una estructura organizacional clara demuestra si la entidad ha dotado al programa AML de posicionamiento, jerarquia y recursos compatibles con su mandato."}'),
  ('6b307533-48af-4c1f-8956-a8de565b40e4','71d7bacf-a646-4301-a78f-f78cc7a267d2','WEIGHTED',true,0.80,'MEDIUM',0.50,'SUPPORT',false,false,'OB_004_RESOURCES',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La gestion de conocimiento critico sirve como evidencia complementaria de suficiencia de recursos, continuidad y cobertura funcional del programa."}'),

  -- OB_005
  ('304e8eec-eb22-4e8c-ba05-bcf086ecbd85','14f6bb0d-b6d5-482c-be45-09600f92bbba','WEIGHTED',true,0.70,'HIGH',1.00,'PRIMARY',true,true,'OB_005_RISK_APPETITE',1,'REQUIRES_PRIMARY',0.50,'{"basis":"La definicion del apetito de riesgo AML requiere un proceso explicito de identificacion y priorizacion de riesgos que traduzca tolerancias institucionales en criterios operables."}'),
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','14f6bb0d-b6d5-482c-be45-09600f92bbba','WEIGHTED',true,0.70,'HIGH',0.70,'SUPPORT',false,true,'OB_005_RISK_APPETITE',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"El apetito de riesgo AML necesita patrocinio y gobierno formal para ser valido, aprobado y exigible transversalmente."}'),
  ('0e4a5087-5002-46b5-bc78-3401df64418f','14f6bb0d-b6d5-482c-be45-09600f92bbba','WEIGHTED',true,0.70,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_005_RISK_APPETITE',3,'PRIMARY_PLUS_SUPPORT',0.20,'{"basis":"Las metricas de seguridad y monitoreo aportan evidencia objetiva de umbrales, indicadores y seguimiento del apetito de riesgo definido."}'),

  -- OB_006
  ('75a189ab-54fb-4717-9415-77eb1114c1ac','4461bd8c-6a85-43b4-9903-262e542a69bf','WEIGHTED',true,0.70,'HIGH',1.00,'PRIMARY',true,true,'OB_006_OVERSIGHT',1,'REQUIRES_PRIMARY',0.45,'{"basis":"La supervision periodica del programa AML se satisface primariamente con evaluaciones de efectividad de controles que permitan revisar desempeno, brechas y acciones correctivas."}'),
  ('91156f74-0919-42fc-9849-d8fdc0ff2c56','4461bd8c-6a85-43b4-9903-262e542a69bf','WEIGHTED',true,0.70,'HIGH',0.70,'SUPPORT',false,true,'OB_006_OVERSIGHT',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La auditoria de seguridad y control independiente soporta la supervision periodica al aportar validacion objetiva y mirada de tercera linea."}'),
  ('f9248ece-4580-469c-b3e4-098ac7d1dfac','4461bd8c-6a85-43b4-9903-262e542a69bf','WEIGHTED',true,0.70,'MEDIUM',0.50,'FOLLOW_UP',false,false,'OB_006_OVERSIGHT',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La gestion centralizada de hallazgos fortalece la supervision periodica mediante trazabilidad de observaciones, cierre y reincidencia."}'),

  -- OB_007
  ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c','f1e536af-e389-44f7-bfaa-bba029fe5fb7','WEIGHTED',true,0.70,'HIGH',1.00,'PRIMARY',true,true,'OB_007_GROUP',1,'REQUIRES_PRIMARY',0.40,'{"basis":"Un programa AML consolidado de grupo requiere estructura de gobierno clara, lineas de reporte y alcance organizacional que cubra entidades y funciones del grupo."}'),
  ('f2d94382-2f93-49a2-a490-8f4b29939e43','f1e536af-e389-44f7-bfaa-bba029fe5fb7','WEIGHTED',true,0.70,'HIGH',0.70,'SUPPORT',false,true,'OB_007_GROUP',2,'PRIMARY_PLUS_SUPPORT',0.35,'{"basis":"El cumplimiento legal y regulatorio soporta la consolidacion del programa AML al asegurar consistencia frente a exigencias normativas aplicables en el grupo."}'),
  ('8b5806fc-741e-47cc-a435-add9ac35ac2d','f1e536af-e389-44f7-bfaa-bba029fe5fb7','WEIGHTED',true,0.70,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_007_GROUP',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La trazabilidad operativa permite demostrar consolidacion efectiva mediante reportes, escalamiento y evidencia agregada a nivel de grupo."}'),

  -- OB_008
  ('6defef9b-40da-4503-808d-3d4c36e56480','30cf1209-71c4-422b-a7a6-3c9fb5f8f652','WEIGHTED',true,0.70,'HIGH',1.00,'PRIMARY',true,true,'OB_008_DISCIPLINE',1,'REQUIRES_PRIMARY',0.45,'{"basis":"El regimen disciplinario AML descansa en el cumplimiento de politicas como mecanismo base para activar consecuencias frente a incumplimientos."}'),
  ('63982b10-1637-4c32-84b4-60da9751f357','30cf1209-71c4-422b-a7a6-3c9fb5f8f652','WEIGHTED',true,0.70,'HIGH',0.70,'SUPPORT',false,true,'OB_008_DISCIPLINE',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La asignacion formal de responsabilidades permite imputar incumplimientos, definir deberes y sustentar la aplicacion disciplinaria."}'),
  ('0844a742-3ab3-4666-b461-ff23520db747','30cf1209-71c4-422b-a7a6-3c9fb5f8f652','WEIGHTED',true,0.70,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_008_DISCIPLINE',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La integridad de registros soporta la trazabilidad del proceso disciplinario, desde la evidencia del incumplimiento hasta la decision adoptada."}'),

  -- OB_009
  ('6defef9b-40da-4503-808d-3d4c36e56480','fb583f29-4c7f-450c-9c5b-4d14012e545d','WEIGHTED',true,0.70,'HIGH',1.00,'PRIMARY',true,true,'OB_009_ETHICS',1,'REQUIRES_PRIMARY',0.40,'{"basis":"El codigo de etica con enforcement requiere politicas vigentes, difundidas y monitoreadas como base de observancia y aplicacion institucional."}'),
  ('63982b10-1637-4c32-84b4-60da9751f357','fb583f29-4c7f-450c-9c5b-4d14012e545d','WEIGHTED',true,0.70,'HIGH',0.70,'SUPPORT',false,true,'OB_009_ETHICS',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La definicion de responsabilidades refuerza el enforcement al vincular deberes eticos con funciones y responsabilidades concretas."}'),
  ('9b2f4965-fc87-4dc5-84f3-17ed3e6c88e0','fb583f29-4c7f-450c-9c5b-4d14012e545d','WEIGHTED',true,0.70,'MEDIUM',0.50,'EVIDENCE',false,false,'OB_009_ETHICS',3,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"El reporte oportuno de eventos soporta el enforcement del codigo al habilitar denuncia, escalamiento y reaccion frente a desvios de conducta."}'),

  -- OB_010
  ('f562d173-fdf8-4e20-aa82-10cd2c481b40','d1ea5025-add8-4c87-966f-4dc6f1d16cff','WEIGHTED',true,0.70,'HIGH',1.00,'PRIMARY',true,true,'OB_010_TRAINING',1,'REQUIRES_PRIMARY',0.45,'{"basis":"La capacitacion AML por rol se satisface primariamente con controles orientados a prevenir error humano mediante formacion, validacion y refuerzo conductual."}'),
  ('63982b10-1637-4c32-84b4-60da9751f357','d1ea5025-add8-4c87-966f-4dc6f1d16cff','WEIGHTED',true,0.70,'HIGH',0.70,'SUPPORT',false,true,'OB_010_TRAINING',2,'PRIMARY_PLUS_SUPPORT',0.30,'{"basis":"La asignacion formal de responsabilidades permite definir contenidos, profundidad y obligatoriedad de capacitacion segun perfil y funcion."}'),
  ('6b307533-48af-4c1f-8956-a8de565b40e4','d1ea5025-add8-4c87-966f-4dc6f1d16cff','WEIGHTED',true,0.70,'MEDIUM',0.50,'SUPPORT',false,false,'OB_010_TRAINING',3,'PRIMARY_PLUS_SUPPORT',0.25,'{"basis":"La gestion de conocimiento critico complementa la capacitacion por rol al institucionalizar contenidos, procedimientos y lecciones aprendidas relevantes para AML."}')
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
    WHEN role_in_satisfaction = 'FOLLOW_UP' THEN 'OVERSIGHT'
    ELSE role_in_satisfaction
  END AS role_in_satisfaction,
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
