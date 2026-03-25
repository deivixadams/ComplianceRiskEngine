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

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ALTER COLUMN id SET NOT NULL;

UPDATE graph.audit_draft_risk_analysis ara
SET domain_id = sub.domain_id
FROM (
  SELECT DISTINCT ON (mde.element_id)
    mde.element_id,
    mde.domain_id
  FROM graph.map_domain_element mde
  ORDER BY mde.element_id, mde.domain_id
) sub
WHERE ara.element_id = sub.element_id
  AND ara.domain_id IS NULL;

UPDATE graph.audit_draft_risk_analysis
SET row_mode = CASE
  WHEN element_id IS NULL AND custom_element_name IS NOT NULL THEN 'CUSTOM'
  ELSE 'SYSTEM'
END
WHERE row_mode IS NULL OR row_mode = '';

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  DROP CONSTRAINT IF EXISTS chk_audit_draft_risk_analysis_row_mode;
ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT chk_audit_draft_risk_analysis_row_mode
  CHECK (upper(row_mode) IN ('SYSTEM', 'CUSTOM'));

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  DROP CONSTRAINT IF EXISTS chk_audit_draft_risk_analysis_mitigation_strength;
ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT chk_audit_draft_risk_analysis_mitigation_strength
  CHECK (mitigation_strength IS NULL OR mitigation_strength BETWEEN 1 AND 5);

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  DROP CONSTRAINT IF EXISTS chk_audit_draft_risk_analysis_mitigation_level;
ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT chk_audit_draft_risk_analysis_mitigation_level
  CHECK (mitigation_level IS NULL OR upper(mitigation_level) IN ('TOTAL', 'PARCIAL'));

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  DROP CONSTRAINT IF EXISTS fk_audit_draft_risk_analysis_control;
ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT fk_audit_draft_risk_analysis_control
  FOREIGN KEY (mitigating_control_id)
  REFERENCES graph.control(id)
  ON UPDATE CASCADE
  ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_audit_draft_risk_analysis_control
  ON graph.audit_draft_risk_analysis (mitigating_control_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_draft_risk_analysis_id
  ON graph.audit_draft_risk_analysis (id);

COMMIT;
