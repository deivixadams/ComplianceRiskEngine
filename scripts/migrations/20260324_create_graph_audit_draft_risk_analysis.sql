CREATE TABLE IF NOT EXISTS graph.audit_draft_risk_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  draft_id uuid NOT NULL,
  domain_id uuid,
  risk_id uuid NOT NULL,
  element_id uuid,
  custom_element_name text,
  row_mode text NOT NULL DEFAULT 'SYSTEM',

  probability numeric(8,4) NOT NULL,
  impact numeric(8,4) NOT NULL,
  connectivity smallint NOT NULL,
  cascade numeric(8,4) NOT NULL,
  k_factor numeric(8,4) NOT NULL DEFAULT 1.0000,

  analysis_notes text,
  source text,
  scenario text,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT audit_draft_risk_analysis_pkey
    PRIMARY KEY (id),

  CONSTRAINT fk_audit_draft_risk_analysis_draft
    FOREIGN KEY (draft_id)
    REFERENCES corpus.audit_assessment_draft(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_audit_draft_risk_analysis_domain
    FOREIGN KEY (domain_id)
    REFERENCES graph.domain(id)
    ON UPDATE CASCADE
    ON DELETE SET NULL,

  CONSTRAINT fk_audit_draft_risk_analysis_risk
    FOREIGN KEY (risk_id)
    REFERENCES graph.risk(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT fk_audit_draft_risk_analysis_element
    FOREIGN KEY (element_id)
    REFERENCES graph.domain_elements(id)
    ON UPDATE CASCADE
    ON DELETE CASCADE,

  CONSTRAINT chk_audit_draft_risk_analysis_probability
    CHECK (probability >= 1 AND probability <= 5),
  CONSTRAINT chk_audit_draft_risk_analysis_impact
    CHECK (impact >= 1 AND impact <= 5),
  CONSTRAINT chk_audit_draft_risk_analysis_connectivity
    CHECK (connectivity BETWEEN 1 AND 5),
  CONSTRAINT chk_audit_draft_risk_analysis_cascade
    CHECK (cascade BETWEEN 0 AND 1),
  CONSTRAINT chk_audit_draft_risk_analysis_k_factor
    CHECK (k_factor >= 0),
  CONSTRAINT chk_audit_draft_risk_analysis_row_mode
    CHECK (row_mode IN ('SYSTEM', 'CUSTOM')),
  CONSTRAINT chk_audit_draft_risk_analysis_element_mode_xor
    CHECK (
      (row_mode = 'SYSTEM' AND element_id IS NOT NULL AND custom_element_name IS NULL) OR
      (row_mode = 'CUSTOM' AND element_id IS NULL AND custom_element_name IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_audit_draft_risk_analysis_draft_id
  ON graph.audit_draft_risk_analysis(draft_id);

CREATE INDEX IF NOT EXISTS idx_audit_draft_risk_analysis_domain_id
  ON graph.audit_draft_risk_analysis(domain_id);

CREATE INDEX IF NOT EXISTS idx_audit_draft_risk_analysis_element_id
  ON graph.audit_draft_risk_analysis(element_id);

CREATE INDEX IF NOT EXISTS idx_audit_draft_risk_analysis_risk_id
  ON graph.audit_draft_risk_analysis(risk_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_draft_risk_analysis_system
  ON graph.audit_draft_risk_analysis(draft_id, domain_id, risk_id, element_id)
  WHERE row_mode = 'SYSTEM' AND element_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_audit_draft_risk_analysis_custom
  ON graph.audit_draft_risk_analysis(draft_id, domain_id, risk_id, custom_element_name)
  WHERE row_mode = 'CUSTOM' AND custom_element_name IS NOT NULL;
