-- CRE ENGINE PHASE SCHEMA EXPANSION
-- Target Schema: corpus
-- Target Database: cre_db

SET search_path TO corpus;

-- 1) Paso 1: corpus_company
CREATE TABLE IF NOT EXISTS corpus_company (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code text UNIQUE NOT NULL,
    name text NOT NULL,
    legal_name text,
    jurisdiction_id uuid REFERENCES corpus_jurisdiction(id),
    status_id smallint NOT NULL REFERENCES corpus_catalog_status(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2) Paso 2: corpus_assessment
CREATE TABLE IF NOT EXISTS corpus_assessment (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id uuid NOT NULL REFERENCES corpus_company(id),
    framework_version_id uuid NOT NULL REFERENCES corpus_framework_version(id),
    name text NOT NULL,
    scope_notes text,
    status_id smallint NOT NULL REFERENCES corpus_catalog_status(id),
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by text
);

-- 3) Paso 3: corpus_evaluation
CREATE TABLE IF NOT EXISTS corpus_evaluation (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id uuid NOT NULL REFERENCES corpus_assessment(id),
    period_start date NOT NULL,
    period_end date NOT NULL,
    status_id smallint NOT NULL REFERENCES corpus_catalog_status(id),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    created_by text,
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4) Paso 4: corpus_evaluation_control_state
CREATE TABLE IF NOT EXISTS corpus_evaluation_control_state (
    evaluation_id uuid NOT NULL REFERENCES corpus_evaluation(id),
    control_id uuid NOT NULL REFERENCES corpus_control(id),
    implementation_status text NOT NULL, -- implemented, partial, not_implemented, unknown
    design_effectiveness numeric(6,4), -- 0-1
    operating_effectiveness numeric(6,4), -- 0-1
    notes text,
    updated_at timestamptz NOT NULL DEFAULT now(),
    updated_by text,
    PRIMARY KEY (evaluation_id, control_id)
);

-- 5) Paso 5: corpus_evaluation_artifact
CREATE TABLE IF NOT EXISTS corpus_evaluation_artifact (
    evaluation_id uuid NOT NULL REFERENCES corpus_evaluation(id),
    artifact_id uuid NOT NULL REFERENCES corpus_control_artifact(id),
    status text NOT NULL, -- accepted, rejected, pending
    review_notes text,
    reviewed_by text,
    reviewed_at timestamptz,
    PRIMARY KEY (evaluation_id, artifact_id)
);

-- 6) Paso 6: corpus_evaluation_test_run
CREATE TABLE IF NOT EXISTS corpus_evaluation_test_run (
    evaluation_id uuid NOT NULL REFERENCES corpus_evaluation(id),
    test_control_run_id uuid NOT NULL REFERENCES corpus_test_control_run(id),
    included boolean NOT NULL DEFAULT true,
    inclusion_reason text,
    selected_by text,
    selected_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (evaluation_id, test_control_run_id)
);

-- 7) Paso 7: corpus_parameter_set layer
CREATE TABLE IF NOT EXISTS corpus_parameter_set (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_version_id uuid NOT NULL REFERENCES corpus_framework_version(id),
    version text NOT NULL,
    status_id smallint NOT NULL REFERENCES corpus_catalog_status(id),
    hash text NOT NULL,
    approved_by text,
    approved_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS corpus_parameter_value (
    parameter_set_id uuid NOT NULL REFERENCES corpus_parameter_set(id),
    key text NOT NULL,
    value jsonb NOT NULL,
    notes text,
    PRIMARY KEY (parameter_set_id, key)
);

CREATE TABLE IF NOT EXISTS corpus_parameter_obligation_weight (
    parameter_set_id uuid NOT NULL REFERENCES corpus_parameter_set(id),
    obligation_id uuid NOT NULL REFERENCES corpus_obligation(id),
    weight numeric(10,6) NOT NULL,
    PRIMARY KEY (parameter_set_id, obligation_id)
);

-- 8) Paso 8: corpus_model_run
CREATE TABLE IF NOT EXISTS corpus_model_run (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id uuid NOT NULL REFERENCES corpus_assessment(id),
    evaluation_id uuid NOT NULL REFERENCES corpus_evaluation(id),
    parameter_set_id uuid NOT NULL REFERENCES corpus_parameter_set(id),
    engine_version text NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz,
    run_status text NOT NULL, -- success, fail, partial
    executed_by text,
    input_hash text NOT NULL,
    output_hash text NOT NULL
);

-- 9) Paso 9: Snapshots for Reproducibility
CREATE TABLE IF NOT EXISTS corpus_model_run_score (
    run_id uuid PRIMARY KEY REFERENCES corpus_model_run(id),
    score_total numeric(10,4),
    readiness_score numeric(5,2),
    e_base numeric(14,6),
    e_conc numeric(14,6),
    e_sys numeric(14,6),
    e_final numeric(14,6),
    gatillo_max numeric(14,6)
);

CREATE TABLE IF NOT EXISTS corpus_model_run_obligation (
    run_id uuid NOT NULL REFERENCES corpus_model_run(id),
    obligation_id uuid NOT NULL REFERENCES corpus_obligation(id),
    weight_used numeric(10,6),
    effectiveness_used numeric(6,4),
    exposure_ei numeric(14,6),
    PRIMARY KEY (run_id, obligation_id)
);

CREATE TABLE IF NOT EXISTS corpus_model_run_control (
    run_id uuid NOT NULL REFERENCES corpus_model_run(id),
    control_id uuid NOT NULL REFERENCES corpus_control(id),
    implementation_status_used text,
    design_eff_used numeric(6,4),
    oper_eff_used numeric(6,4),
    evidence_status_used text,
    control_effectiveness_used numeric(6,4),
    PRIMARY KEY (run_id, control_id)
);

CREATE TABLE IF NOT EXISTS corpus_model_run_trigger (
    run_id uuid NOT NULL REFERENCES corpus_model_run(id),
    trigger_code text NOT NULL,
    trigger_fired boolean NOT NULL,
    trigger_value jsonb,
    justification text,
    PRIMARY KEY (run_id, trigger_code)
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_corpus_company_updated_at BEFORE UPDATE ON corpus_company FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_corpus_evaluation_updated_at BEFORE UPDATE ON corpus_evaluation FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_corpus_evaluation_control_state_updated_at BEFORE UPDATE ON corpus_evaluation_control_state FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
