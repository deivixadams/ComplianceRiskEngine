-- Upgrade graph.audit_draft_risk_analysis for domain-driven risk analysis

DO $$
BEGIN
  IF to_regclass('graph.audit_draft_risk_analysis') IS NULL THEN
    RAISE NOTICE 'graph.audit_draft_risk_analysis does not exist, skipping upgrade';
    RETURN;
  END IF;
END $$;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid();

UPDATE graph.audit_draft_risk_analysis
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD COLUMN IF NOT EXISTS domain_id uuid;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD COLUMN IF NOT EXISTS custom_element_name text;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD COLUMN IF NOT EXISTS row_mode text DEFAULT 'SYSTEM';

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ALTER COLUMN row_mode SET DEFAULT 'SYSTEM';

UPDATE graph.audit_draft_risk_analysis
SET row_mode = 'SYSTEM'
WHERE row_mode IS NULL;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ALTER COLUMN row_mode SET NOT NULL;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ALTER COLUMN element_id DROP NOT NULL;

UPDATE graph.audit_draft_risk_analysis ara
SET domain_id = mde.domain_id
FROM LATERAL (
  SELECT domain_id
  FROM graph.map_domain_element
  WHERE element_id = ara.element_id
  ORDER BY domain_id
  LIMIT 1
) mde
WHERE ara.domain_id IS NULL
  AND ara.element_id IS NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'graph.audit_draft_risk_analysis'::regclass
      AND conname = 'audit_draft_risk_analysis_pkey'
  ) THEN
    ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
      DROP CONSTRAINT audit_draft_risk_analysis_pkey;
  END IF;
END $$;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT audit_draft_risk_analysis_pkey PRIMARY KEY (id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'graph.audit_draft_risk_analysis'::regclass
      AND conname = 'fk_audit_draft_risk_analysis_domain'
  ) THEN
    ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
      ADD CONSTRAINT fk_audit_draft_risk_analysis_domain
      FOREIGN KEY (domain_id)
      REFERENCES graph.domain(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'graph.audit_draft_risk_analysis'::regclass
      AND conname = 'chk_audit_draft_risk_analysis_probability'
  ) THEN
    ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
      DROP CONSTRAINT chk_audit_draft_risk_analysis_probability;
  END IF;
END $$;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT chk_audit_draft_risk_analysis_probability
  CHECK (probability >= 1 AND probability <= 5);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'graph.audit_draft_risk_analysis'::regclass
      AND conname = 'chk_audit_draft_risk_analysis_impact'
  ) THEN
    ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
      DROP CONSTRAINT chk_audit_draft_risk_analysis_impact;
  END IF;
END $$;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT chk_audit_draft_risk_analysis_impact
  CHECK (impact >= 1 AND impact <= 5);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'graph.audit_draft_risk_analysis'::regclass
      AND conname = 'chk_audit_draft_risk_analysis_row_mode'
  ) THEN
    ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
      DROP CONSTRAINT chk_audit_draft_risk_analysis_row_mode;
  END IF;
END $$;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT chk_audit_draft_risk_analysis_row_mode
  CHECK (row_mode IN ('SYSTEM', 'CUSTOM'));

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'graph.audit_draft_risk_analysis'::regclass
      AND conname = 'chk_audit_draft_risk_analysis_element_mode_xor'
  ) THEN
    ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
      DROP CONSTRAINT chk_audit_draft_risk_analysis_element_mode_xor;
  END IF;
END $$;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT chk_audit_draft_risk_analysis_element_mode_xor
  CHECK (
    (row_mode = 'SYSTEM' AND element_id IS NOT NULL AND custom_element_name IS NULL) OR
    (row_mode = 'CUSTOM' AND element_id IS NULL AND custom_element_name IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_audit_draft_risk_analysis_domain_id
  ON graph.audit_draft_risk_analysis(domain_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_draft_risk_analysis_system
  ON graph.audit_draft_risk_analysis(draft_id, domain_id, risk_id, element_id)
  WHERE row_mode = 'SYSTEM' AND element_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_draft_risk_analysis_custom
  ON graph.audit_draft_risk_analysis(draft_id, domain_id, risk_id, custom_element_name)
  WHERE row_mode = 'CUSTOM' AND custom_element_name IS NOT NULL;

