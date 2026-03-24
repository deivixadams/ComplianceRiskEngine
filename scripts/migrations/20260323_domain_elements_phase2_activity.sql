BEGIN;

DO $$
DECLARE
  v_overlap integer;
BEGIN
  SELECT count(*)::int
  INTO v_overlap
  FROM graph.mtrix_activity a
  JOIN graph.domain_elements d ON d.id = a.id
  WHERE d.element_type <> 'ACTIVITY';

  IF v_overlap > 0 THEN
    RAISE EXCEPTION 'Cannot migrate mtrix_activity: % id collisions with non-ACTIVITY domain_elements', v_overlap;
  END IF;
END $$;

INSERT INTO graph.domain_elements (
  id,
  element_type,
  domain_id,
  code,
  name,
  description,
  evaluation_focus,
  expected_evidence,
  risk_implication,
  inherent_risk_impact,
  control_effectiveness_impact,
  sequence_order,
  activity_status_id,
  created_at,
  updated_at,
  source_table,
  source_pk
)
SELECT
  a.id,
  'ACTIVITY',
  a.domain_id,
  a.code,
  a.name,
  a.description,
  a.evaluation_focus,
  a.expected_evidence,
  a.risk_implication,
  a.inherent_risk_impact,
  a.control_effectiveness_impact,
  a.sequence_order,
  a.status_id,
  a.created_at::timestamptz,
  a.updated_at::timestamptz,
  'graph.mtrix_activity',
  a.id
FROM graph.mtrix_activity a
ON CONFLICT (id) DO UPDATE
SET
  element_type = EXCLUDED.element_type,
  domain_id = EXCLUDED.domain_id,
  code = EXCLUDED.code,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  evaluation_focus = EXCLUDED.evaluation_focus,
  expected_evidence = EXCLUDED.expected_evidence,
  risk_implication = EXCLUDED.risk_implication,
  inherent_risk_impact = EXCLUDED.inherent_risk_impact,
  control_effectiveness_impact = EXCLUDED.control_effectiveness_impact,
  sequence_order = EXCLUDED.sequence_order,
  activity_status_id = EXCLUDED.activity_status_id,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  source_table = EXCLUDED.source_table,
  source_pk = EXCLUDED.source_pk;

CREATE INDEX IF NOT EXISTS idx_domain_elements_activity_status_id
  ON graph.domain_elements(activity_status_id)
  WHERE element_type = 'ACTIVITY';

CREATE INDEX IF NOT EXISTS idx_domain_elements_activity_sequence
  ON graph.domain_elements(sequence_order)
  WHERE element_type = 'ACTIVITY';

DO $$
DECLARE
  r record;
  new_def text;
BEGIN
  FOR r IN
    SELECT
      con.conname,
      con.conrelid::regclass AS src_table,
      pg_get_constraintdef(con.oid) AS constraint_def
    FROM pg_constraint con
    WHERE con.contype = 'f'
      AND con.confrelid = 'graph.mtrix_activity'::regclass
  LOOP
    new_def := replace(
      r.constraint_def,
      'REFERENCES graph.mtrix_activity(id)',
      'REFERENCES graph.domain_elements(id)'
    );

    EXECUTE format(
      'ALTER TABLE %s DROP CONSTRAINT %I',
      r.src_table,
      r.conname
    );

    EXECUTE format(
      'ALTER TABLE %s ADD CONSTRAINT %I %s',
      r.src_table,
      r.conname,
      new_def
    );
  END LOOP;
END $$;

COMMIT;
