-- Workbench Extensions Migration
-- Target: corpus schema

-- 1.1 Extender corpus_control
ALTER TABLE corpus.corpus_control 
ADD COLUMN IF NOT EXISTS design_description TEXT NOT NULL DEFAULT '',
ADD COLUMN IF NOT EXISTS criticality_level SMALLINT NOT NULL DEFAULT 3, -- 1-5
ADD COLUMN IF NOT EXISTS inherent_mitigation_strength NUMERIC(4,3) NOT NULL DEFAULT 1.000; -- 0-1

-- 1.2 Extender corpus_evaluation_control_state
ALTER TABLE corpus.corpus_evaluation_control_state
ADD COLUMN IF NOT EXISTS formalization_effectiveness NUMERIC(6,4) NULL,
ADD COLUMN IF NOT EXISTS coverage_effectiveness NUMERIC(6,4) NULL,
ADD COLUMN IF NOT EXISTS recency_effectiveness NUMERIC(6,4) NULL,
ADD COLUMN IF NOT EXISTS evidence_validated BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS applicability TEXT NOT NULL DEFAULT 'applicable' CHECK (applicability IN ('applicable','not_applicable')),
ADD COLUMN IF NOT EXISTS not_applicable_reason TEXT NULL,
ADD COLUMN IF NOT EXISTS final_effectiveness NUMERIC(6,4) NULL,
ADD COLUMN IF NOT EXISTS computed_at timestamptz NULL;

-- 1.3 Crear corpus_evaluation_scope
CREATE TABLE IF NOT EXISTS corpus.corpus_evaluation_scope (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES corpus.corpus_evaluation(id),
    scope_type TEXT NOT NULL CHECK (scope_type IN ('domain','obligation')),
    domain_id UUID REFERENCES corpus.corpus_domain(id),
    obligation_id UUID REFERENCES corpus.corpus_obligation(id),
    is_in_scope BOOLEAN NOT NULL DEFAULT true,
    rationale TEXT,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE(evaluation_id, scope_type, domain_id, obligation_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_eval_scope_evaluation ON corpus.corpus_evaluation_scope(evaluation_id);
