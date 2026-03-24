BEGIN;

CREATE TABLE IF NOT EXISTS graph.domain_elements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  element_type text NOT NULL,
  domain_id uuid NOT NULL,
  code text NOT NULL,
  name text,
  title text,
  description text,
  statement text,
  source_ref text,
  rationale jsonb,
  obligation_status text,
  obligation_status_id smallint,
  obligation_type_id smallint,
  is_hard_gate boolean,
  criticality smallint,
  evidence_strength smallint,
  criticality_id smallint,
  evidence_strength_id smallint,
  evaluation_focus text,
  expected_evidence text,
  risk_implication text,
  inherent_risk_impact boolean,
  control_effectiveness_impact boolean,
  sequence_order integer,
  activity_status_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  source_table text,
  source_pk uuid,
  CONSTRAINT ck_domain_elements_type
    CHECK (element_type IN ('OBLIGATION', 'ACTIVITY')),
  CONSTRAINT ck_domain_elements_code_not_blank
    CHECK (btrim(code) <> ''),
  CONSTRAINT ck_domain_elements_rationale_object
    CHECK (rationale IS NULL OR jsonb_typeof(rationale) = 'object'),
  CONSTRAINT ck_domain_elements_required_by_type
    CHECK (
      (element_type = 'OBLIGATION'
       AND title IS NOT NULL
       AND btrim(title) <> ''
       AND statement IS NOT NULL
       AND btrim(statement) <> '')
      OR
      (element_type = 'ACTIVITY'
       AND name IS NOT NULL
       AND btrim(name) <> ''
       AND description IS NOT NULL
       AND btrim(description) <> '')
    )
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_elements_domain'
      AND conrelid = 'graph.domain_elements'::regclass
  ) THEN
    ALTER TABLE graph.domain_elements
      ADD CONSTRAINT fk_domain_elements_domain
      FOREIGN KEY (domain_id)
      REFERENCES graph.domain(id)
      ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_elements_obligation_status_id'
      AND conrelid = 'graph.domain_elements'::regclass
  ) THEN
    ALTER TABLE graph.domain_elements
      ADD CONSTRAINT fk_domain_elements_obligation_status_id
      FOREIGN KEY (obligation_status_id)
      REFERENCES catalogos.corpus_catalog_status(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_elements_obligation_type_id'
      AND conrelid = 'graph.domain_elements'::regclass
  ) THEN
    ALTER TABLE graph.domain_elements
      ADD CONSTRAINT fk_domain_elements_obligation_type_id
      FOREIGN KEY (obligation_type_id)
      REFERENCES catalogos.corpus_catalog_obligation_type(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_elements_criticality_id'
      AND conrelid = 'graph.domain_elements'::regclass
  ) THEN
    ALTER TABLE graph.domain_elements
      ADD CONSTRAINT fk_domain_elements_criticality_id
      FOREIGN KEY (criticality_id)
      REFERENCES catalogos.corpus_catalog_criticality(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_elements_evidence_strength_id'
      AND conrelid = 'graph.domain_elements'::regclass
  ) THEN
    ALTER TABLE graph.domain_elements
      ADD CONSTRAINT fk_domain_elements_evidence_strength_id
      FOREIGN KEY (evidence_strength_id)
      REFERENCES catalogos.corpus_catalog_evidence_strength(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_elements_activity_status_id'
      AND conrelid = 'graph.domain_elements'::regclass
  ) THEN
    ALTER TABLE graph.domain_elements
      ADD CONSTRAINT fk_domain_elements_activity_status_id
      FOREIGN KEY (activity_status_id)
      REFERENCES catalogos.cat_ciber_status(id);
  END IF;
END $$;

INSERT INTO graph.domain_elements (
  id,
  element_type,
  domain_id,
  code,
  title,
  statement,
  source_ref,
  rationale,
  obligation_status,
  obligation_status_id,
  obligation_type_id,
  is_hard_gate,
  criticality,
  evidence_strength,
  criticality_id,
  evidence_strength_id,
  created_at,
  updated_at,
  source_table,
  source_pk
)
SELECT
  o.id,
  'OBLIGATION',
  o.domain_id,
  o.code,
  o.title,
  o.statement,
  o.source_ref,
  o.rationale,
  o.status,
  o.status_id,
  o.obligation_type_id,
  o.is_hard_gate,
  o.criticality,
  o.evidence_strength,
  o.criticality_id,
  o.evidence_strength_id,
  o.created_at,
  o.updated_at,
  'graph.obligation',
  o.id
FROM graph.obligation o
ON CONFLICT (id) DO UPDATE
SET
  element_type = EXCLUDED.element_type,
  domain_id = EXCLUDED.domain_id,
  code = EXCLUDED.code,
  title = EXCLUDED.title,
  statement = EXCLUDED.statement,
  source_ref = EXCLUDED.source_ref,
  rationale = EXCLUDED.rationale,
  obligation_status = EXCLUDED.obligation_status,
  obligation_status_id = EXCLUDED.obligation_status_id,
  obligation_type_id = EXCLUDED.obligation_type_id,
  is_hard_gate = EXCLUDED.is_hard_gate,
  criticality = EXCLUDED.criticality,
  evidence_strength = EXCLUDED.evidence_strength,
  criticality_id = EXCLUDED.criticality_id,
  evidence_strength_id = EXCLUDED.evidence_strength_id,
  created_at = EXCLUDED.created_at,
  updated_at = EXCLUDED.updated_at,
  source_table = EXCLUDED.source_table,
  source_pk = EXCLUDED.source_pk;

CREATE INDEX IF NOT EXISTS idx_domain_elements_domain_id
  ON graph.domain_elements(domain_id);

CREATE INDEX IF NOT EXISTS idx_domain_elements_element_type
  ON graph.domain_elements(element_type);

CREATE INDEX IF NOT EXISTS idx_domain_elements_code
  ON graph.domain_elements(code);

CREATE UNIQUE INDEX IF NOT EXISTS uq_domain_elements_obligation_domain_code
  ON graph.domain_elements(domain_id, code)
  WHERE element_type = 'OBLIGATION';

CREATE UNIQUE INDEX IF NOT EXISTS uq_domain_elements_activity_code
  ON graph.domain_elements(code)
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
      AND con.confrelid = 'graph.obligation'::regclass
  LOOP
    new_def := replace(
      r.constraint_def,
      'REFERENCES graph.obligation(id)',
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
