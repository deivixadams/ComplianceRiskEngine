BEGIN;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS domain_id uuid,
  ADD COLUMN IF NOT EXISTS custom_element_name text,
  ADD COLUMN IF NOT EXISTS row_mode text DEFAULT 'SYSTEM',
  ADD COLUMN IF NOT EXISTS mitigating_control_id uuid,
  ADD COLUMN IF NOT EXISTS mitigation_strength smallint,
  ADD COLUMN IF NOT EXISTS mitigation_level text;

UPDATE graph.audit_draft_risk_analysis
SET id = gen_random_uuid()
WHERE id IS NULL;

UPDATE graph.audit_draft_risk_analysis
SET row_mode = 'SYSTEM'
WHERE row_mode IS NULL
   OR btrim(row_mode) = ''
   OR upper(row_mode) NOT IN ('SYSTEM', 'CUSTOM');

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  DROP CONSTRAINT IF EXISTS audit_draft_risk_analysis_pkey;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ALTER COLUMN id SET NOT NULL,
  ALTER COLUMN row_mode SET DEFAULT 'SYSTEM',
  ALTER COLUMN row_mode SET NOT NULL,
  ALTER COLUMN element_id DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'graph.audit_draft_risk_analysis'::regclass
      AND conname = 'fk_audit_draft_risk_analysis_domain'
  ) THEN
    ALTER TABLE graph.audit_draft_risk_analysis
      ADD CONSTRAINT fk_audit_draft_risk_analysis_domain
      FOREIGN KEY (domain_id)
      REFERENCES graph.domain(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'graph.audit_draft_risk_analysis'::regclass
      AND conname = 'fk_audit_draft_risk_analysis_control'
  ) THEN
    ALTER TABLE graph.audit_draft_risk_analysis
      ADD CONSTRAINT fk_audit_draft_risk_analysis_control
      FOREIGN KEY (mitigating_control_id)
      REFERENCES graph.control(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  DROP CONSTRAINT IF EXISTS chk_audit_draft_risk_analysis_row_mode;
ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT chk_audit_draft_risk_analysis_row_mode
  CHECK (upper(row_mode) IN ('SYSTEM', 'CUSTOM'));

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  DROP CONSTRAINT IF EXISTS chk_audit_draft_risk_analysis_element_mode_xor;
ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT chk_audit_draft_risk_analysis_element_mode_xor
  CHECK (
    (upper(row_mode) = 'SYSTEM' AND element_id IS NOT NULL AND custom_element_name IS NULL) OR
    (upper(row_mode) = 'CUSTOM' AND element_id IS NULL AND custom_element_name IS NOT NULL AND btrim(custom_element_name) <> '')
  );

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT audit_draft_risk_analysis_pkey PRIMARY KEY (id);

DROP INDEX IF EXISTS graph.uq_audit_draft_risk_analysis_system;
DROP INDEX IF EXISTS graph.uq_audit_draft_risk_analysis_custom;

DROP INDEX IF EXISTS graph.uq_audit_draft_risk_analysis_system_v2;
CREATE UNIQUE INDEX uq_audit_draft_risk_analysis_system_v2
  ON graph.audit_draft_risk_analysis(
    draft_id,
    COALESCE(domain_id, '00000000-0000-0000-0000-000000000000'::uuid),
    risk_id,
    element_id,
    COALESCE(mitigating_control_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  WHERE upper(row_mode) = 'SYSTEM' AND element_id IS NOT NULL;

DROP INDEX IF EXISTS graph.uq_audit_draft_risk_analysis_custom_v2;
CREATE UNIQUE INDEX uq_audit_draft_risk_analysis_custom_v2
  ON graph.audit_draft_risk_analysis(
    draft_id,
    COALESCE(domain_id, '00000000-0000-0000-0000-000000000000'::uuid),
    risk_id,
    lower(custom_element_name),
    COALESCE(mitigating_control_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  WHERE upper(row_mode) = 'CUSTOM' AND custom_element_name IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_audit_draft_risk_analysis_domain_id
  ON graph.audit_draft_risk_analysis(domain_id);
CREATE INDEX IF NOT EXISTS idx_audit_draft_risk_analysis_control
  ON graph.audit_draft_risk_analysis(mitigating_control_id);

COMMIT;
