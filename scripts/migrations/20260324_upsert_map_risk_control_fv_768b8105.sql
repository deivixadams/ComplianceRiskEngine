BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM corpus.framework_version
    WHERE id = '768b8105-935b-42e3-af21-dc63e5ff8292'::uuid
  ) THEN
    RAISE EXCEPTION 'No existe framework_version_id 768b8105-935b-42e3-af21-dc63e5ff8292 en corpus.framework_version';
  END IF;
END $$;

WITH src AS (
  SELECT *
  FROM (
    VALUES
    ('fb4b7bf6-dd6f-45ff-8309-f9a35082856c'::uuid, '7d2839ef-266a-43d7-9d5a-bc6389278360'::uuid, 0.98::numeric, 'preventive', 'La estructura organizacional clara reduce de forma directa la ambiguedad organizacional al definir jerarquia, lineas de reporte y gobierno.', 'Cobertura estructural sobre gobierno, roles y diseno organizacional.'),
    ('63982b10-1637-4c32-84b4-60da9751f357'::uuid, 'b0188d72-5c3b-4e82-aa1e-85e9a67b1692'::uuid, 0.98::numeric, 'preventive', 'La asignacion formal de responsabilidades elimina vacios de responsabilidad y fortalece la trazabilidad decisional.', 'Cobertura sobre ownership, accountability y segregacion funcional.'),
    ('6defef9b-40da-4503-808d-3d4c36e56480'::uuid, '0c17a8bc-5916-4283-a5b7-e84a9586b739'::uuid, 0.97::numeric, 'preventive', 'El cumplimiento de politicas de seguridad mitiga de forma directa el incumplimiento de directrices de seguridad.', 'Cobertura sobre adopcion, ejecucion y seguimiento de politicas.'),
    ('c842855e-01de-49c6-8087-e73e672e7b56'::uuid, '40e2273e-59fb-49b1-af71-47fc8d08b0b5'::uuid, 0.95::numeric, 'detective', 'Los mecanismos antifraude interno detectan y previenen manipulacion intencional de procesos e informacion.', 'Cobertura sobre segregacion, monitoreo y alertas de fraude interno.'),
    ('8e40277f-e9fc-410b-86e0-439ff3492b28'::uuid, '62d9df27-ac71-4f51-8feb-8cde87849b6b'::uuid, 0.97::numeric, 'preventive', 'La gestion de privilegios y accesos reduce el uso indebido de accesos elevados y restringe privilegios excesivos.', 'Cobertura sobre otorgamiento, revision y revocacion de privilegios.'),
    ('1326e0b2-9a58-4034-8a97-d3a0bd65bffe'::uuid, '42f53825-2951-45a2-a871-776cd2df300f'::uuid, 0.95::numeric, 'detective', 'La deteccion de errores operativos permite identificar fallas operativas que de otro modo permanecerian invisibles.', 'Cobertura sobre validaciones, excepciones y monitoreo operativo.'),
    ('432effdf-3c06-41ae-868e-56a380f375f3'::uuid, 'ac4a5832-cfcf-48a0-af06-08aaeded6180'::uuid, 0.96::numeric, 'detective', 'El monitoreo de amenazas reduce la ceguera ante amenazas internas y externas mediante vigilancia continua.', 'Cobertura sobre alertamiento, inteligencia y observabilidad de amenazas.'),
    ('f0729421-674a-4b43-8681-922cd468f351'::uuid, '450abee7-062a-4b04-8f55-3960d16801ff'::uuid, 0.96::numeric, 'corrective', 'La gestion de respuesta a incidentes disminuye el retraso en reaccion y contencion ante amenazas.', 'Cobertura sobre playbooks, escalamiento y respuesta coordinada.'),
    ('3ea7eebb-ab32-4afe-9167-3956ad719eef'::uuid, '59bc0d5f-53e9-4735-bb91-9c82b14c1dbb'::uuid, 0.95::numeric, 'preventive', 'La revision de seguridad en diseno reduce la incorporacion tardia o inexistente de controles de seguridad en proyectos y sistemas.', 'Cobertura sobre secure-by-design y revision de arquitectura.'),
    ('e20f0cdd-d21a-48c8-9583-fe18d32c1829'::uuid, '379ac9c5-9ff0-4e4c-bd64-afcc86e95c2b'::uuid, 0.97::numeric, 'preventive', 'Un inventario actualizado reduce el desconocimiento de activos tecnologicos y de informacion.', 'Cobertura sobre discovery, inventario y actualizacion de activos.'),
    ('12f4bb59-619e-45de-82b7-85991b527d5a'::uuid, 'b7c9e8b7-e4dd-41d3-9d8d-6439dcdac333'::uuid, 0.93::numeric, 'preventive', 'El uso adecuado de activos limita el uso fuera de proposito o politica de los activos institucionales.', 'Cobertura sobre politicas de uso aceptable y disciplina operativa.'),
    ('b0e55604-d959-4a72-8d20-ed7acce1a901'::uuid, '21d8960b-4165-4d36-80e6-c706b5973158'::uuid, 0.94::numeric, 'preventive', 'La proteccion contra perdida de activos reduce extravio, sustraccion o eliminacion no controlada de activos criticos.', 'Cobertura fisica y logica sobre custodia y preservacion de activos.'),
    ('6ed8e6e1-c0d8-4c0c-bdff-2c58b7de910f'::uuid, 'a2bcea51-4fc2-48e0-b560-060e870e69d3'::uuid, 0.94::numeric, 'preventive', 'La clasificacion de informacion limita el acceso excesivo o innecesario a informacion sensible.', 'Cobertura sobre etiquetado, sensibilidad y reglas de acceso.'),
    ('18d0c202-2f90-415f-8ff3-d4f1d91bb325'::uuid, '50209c7f-0019-49bc-afd2-6f90e69a1d8f'::uuid, 0.95::numeric, 'preventive', 'La proteccion de informacion sensible mitiga controles insuficientes sobre informacion critica.', 'Cobertura sobre resguardo segun criticidad y sensibilidad.'),
    ('8ad907e4-54ef-44e1-bab3-da3ef05af425'::uuid, 'be1db0fb-a61d-4deb-a77b-1bb1d643b19e'::uuid, 0.93::numeric, 'preventive', 'La gestion adecuada de informacion reduce errores en manipulacion, almacenamiento y transmision.', 'Cobertura durante el ciclo de vida de la informacion.'),
    ('41c4da92-ccf2-41a4-8c0d-892d2ee80b88'::uuid, '87dfaf73-87e2-4379-ad9a-1d16247a75ff'::uuid, 0.97::numeric, 'preventive', 'El cifrado en transito protege la informacion frente a interceptacion o manipulacion durante la transferencia.', 'Cobertura sobre canales, sesiones y transporte de datos.'),
    ('448bab5b-a1cc-42b5-a513-7897875d8b9b'::uuid, 'e04ffb5c-8f6d-4d56-b5e7-43e5a22ded00'::uuid, 0.97::numeric, 'preventive', 'El control de accesos reduce accesos a sistemas o datos sin permisos validos.', 'Cobertura sobre autenticacion, autorizacion y enforcement.'),
    ('3c9f4025-dca4-4b36-9cf5-7cd6eb970f61'::uuid, 'eb27587f-f11f-4244-8232-40c95bfa9f03'::uuid, 0.96::numeric, 'preventive', 'La prevencion de escalamiento de privilegios reduce la elevacion indebida de privilegios dentro del sistema.', 'Cobertura sobre hardening, privilegios minimos y controles tecnicos.'),
    ('1c5d29cb-fa83-4bd3-8551-b6f3e375a2c7'::uuid, 'f5f998f4-2fd0-41e9-8bfb-d027706f80ae'::uuid, 0.97::numeric, 'preventive', 'La gestion del ciclo de vida de accesos reduce accesos que permanecen tras cambios o salidas.', 'Cobertura sobre altas, cambios, bajas y recertificacion.'),
    ('f0281fea-a7d5-4ed1-a32b-1a27d9129a1d'::uuid, '9488027b-c65c-4603-8e0c-44380c33b341'::uuid, 0.94::numeric, 'preventive', 'La gestion de terceros mitiga el compromiso indirecto por proveedores y servicios externos.', 'Cobertura sobre due diligence, monitoreo y exigencias contractuales.'),
    ('39bd603e-c70c-4bd3-a03f-039ccad802d5'::uuid, '12012544-e6f8-4dfa-a9ba-bfb4bc2a6e3f'::uuid, 0.96::numeric, 'corrective', 'La gestion integral de incidentes reduce deficiencias en la deteccion, coordinacion y resolucion de incidentes.', 'Cobertura extremo a extremo del ciclo de gestion de incidentes.'),
    ('0f782c88-61d8-499f-a3b3-6ca2592cdf0a'::uuid, 'f88f39f3-3d57-43aa-a56d-9eaee1be61ad'::uuid, 0.95::numeric, 'detective', 'La preservacion de evidencia reduce la incapacidad de reconstruir eventos y soportar analisis forense.', 'Cobertura sobre integridad, conservacion y disponibilidad de evidencia.'),
    ('a6ec5441-0bed-4abd-b245-aece66fd9826'::uuid, 'fbf808f0-6508-45c4-8f97-a664240a0a62'::uuid, 0.93::numeric, 'corrective', 'El analisis de causa raiz disminuye la repeticion de incidentes al corregir causas subyacentes.', 'Cobertura sobre aprendizaje, remediacion y mejora continua.'),
    ('42e387bd-6037-49d5-8fae-72e9cb976729'::uuid, '3e52d198-2eae-4d34-906d-6a0fff010982'::uuid, 0.95::numeric, 'preventive', 'El plan de continuidad operativa reduce la caida de servicios o procesos criticos.', 'Cobertura sobre continuidad de operaciones esenciales.'),
    ('d5421076-905b-4074-809f-18e87d3803a8'::uuid, '2d7d6bf2-da83-47ed-a8e9-847f4b91183d'::uuid, 0.95::numeric, 'preventive', 'El plan de continuidad del negocio reduce la incapacidad de sostener operaciones ante crisis.', 'Cobertura sobre resiliencia institucional y recuperacion del negocio.'),
    ('f2d94382-2f93-49a2-a490-8f4b29939e43'::uuid, 'e3c77cc5-1290-4888-ad1b-1b6b92162d27'::uuid, 0.97::numeric, 'preventive', 'El control de cumplimiento legal, regulatorio y contractual reduce incumplimientos normativos y contractuales aplicables.', 'Cobertura sobre identificacion, monitoreo y cumplimiento regulatorio.'),
    ('0278c65a-5292-48a6-b0ce-a2503e623036'::uuid, '10fc9fd9-c841-4bb7-bd2a-7e23e9f1d45b'::uuid, 0.92::numeric, 'preventive', 'La proteccion de propiedad intelectual reduce uso o divulgacion indebida de propiedad intelectual.', 'Cobertura sobre activos protegidos, uso autorizado y restricciones.'),
    ('0844a742-3ab3-4666-b461-ff23520db747'::uuid, 'bbd8f3e3-bad3-425c-a0db-c45a58612d67'::uuid, 0.94::numeric, 'preventive', 'La integridad y resguardo de registros reduce perdida, alteracion o falsificacion de registros criticos.', 'Cobertura sobre autenticidad, conservacion y disponibilidad de registros.'),
    ('ff21a9ae-7537-4697-8df9-b840d97d97fa'::uuid, '70cb8495-9128-4fbd-9c23-94915988f739'::uuid, 0.95::numeric, 'preventive', 'La proteccion de datos personales mitiga la divulgacion no autorizada de datos personales.', 'Cobertura sobre privacidad, confidencialidad e integridad.'),
    ('75a189ab-54fb-4717-9415-77eb1114c1ac'::uuid, '9e12c262-b1e4-4b04-903e-769df9331dcc'::uuid, 0.92::numeric, 'detective', 'La evaluacion de efectividad de controles permite identificar oportunamente fallas de control no detectadas.', 'Cobertura sobre revision periodica y deteccion de debilidades.')
  ) AS t(control_id, risk_id, raw_mitigation_strength, effect_type, rationale, coverage_notes)
),
validated AS (
  SELECT s.*
  FROM src s
  JOIN graph.control c
    ON c.id = s.control_id
  JOIN graph.risk r
    ON r.id = s.risk_id
),
normalized AS (
  SELECT
    v.control_id,
    v.risk_id,
    CASE
      WHEN v.raw_mitigation_strength >= 0.97 THEN 5
      WHEN v.raw_mitigation_strength >= 0.94 THEN 4
      ELSE 3
    END::smallint AS mitigation_strength,
    '768b8105-935b-42e3-af21-dc63e5ff8292'::uuid AS framework_version_id,
    lower(v.effect_type) AS effect_type,
    v.rationale,
    v.coverage_notes
  FROM validated v
),
upserted AS (
  INSERT INTO graph.map_risk_control (
    control_id,
    risk_id,
    mitigation_strength,
    framework_version_id,
    effect_type,
    rationale,
    coverage_notes
  )
  SELECT
    n.control_id,
    n.risk_id,
    n.mitigation_strength,
    n.framework_version_id,
    n.effect_type,
    n.rationale,
    n.coverage_notes
  FROM normalized n
  ON CONFLICT ON CONSTRAINT unique_risk_control_framework
  DO UPDATE SET
    mitigation_strength = EXCLUDED.mitigation_strength,
    effect_type = EXCLUDED.effect_type,
    rationale = EXCLUDED.rationale,
    coverage_notes = EXCLUDED.coverage_notes
  RETURNING control_id, risk_id
)
SELECT COUNT(*) AS affected_rows
FROM upserted;

COMMIT;
