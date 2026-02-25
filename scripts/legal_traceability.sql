-- -----------------------------------------------------------------------------
-- SCHEMA: Legal Traceability & Freeze Enforcement (CRE)
-- -----------------------------------------------------------------------------

-- 1. AUDIT FINDING TYPES CATALOG
CREATE TABLE IF NOT EXISTS corpus.corpus_catalog_audit_finding_type (
    id SMALLINT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    default_severity SMALLINT NOT NULL DEFAULT 3,
    default_exposure_floor NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
    default_readiness_penalty INTEGER NOT NULL DEFAULT 0,
    default_owner_role TEXT,
    default_due_days INTEGER,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0
);

-- 2. AUDIT FINDINGS TABLE
CREATE TABLE IF NOT EXISTS corpus.corpus_audit_finding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    
    event_type_id SMALLINT NOT NULL REFERENCES corpus.corpus_catalog_audit_finding_type(id),
    severity SMALLINT NOT NULL CHECK (severity >= 1 AND severity <= 5),
    status TEXT NOT NULL CHECK (status IN ('open', 'closed', 'suppressed')),
    
    exposure_floor NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
    readiness_penalty INTEGER NOT NULL DEFAULT 0,
    owner_role TEXT,
    due_date DATE,
    
    root_cause TEXT,
    evidence_links JSONB NOT NULL DEFAULT '[]',
    dedupe_key TEXT UNIQUE,
    
    severity_id INTEGER, -- Legacy compatibility
    status_id INTEGER,   -- Legacy compatibility
    
    evaluation_id UUID REFERENCES corpus.corpus_evaluation(id),
    control_id UUID REFERENCES corpus.corpus_control(id),
    obligation_id UUID REFERENCES corpus.corpus_obligation(id),
    risk_id UUID REFERENCES corpus.corpus_risk(id),
    test_control_run_id UUID REFERENCES corpus.corpus_test_control_run(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_by UUID,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID,
    
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_finding_eval_status ON corpus.corpus_audit_finding (evaluation_id, status);
CREATE INDEX IF NOT EXISTS idx_finding_eval_severity ON corpus.corpus_audit_finding (evaluation_id, severity);

-- 2. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS corpus.corpus_audit_log (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID,
    entity_name TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by UUID,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ip_address TEXT,
    user_agent TEXT
);

-- -----------------------------------------------------------------------------
-- TRIGGERS & FUNCTIONS FOR IMMUTABILITY
-- -----------------------------------------------------------------------------

-- 3. EVALUATION FREEZE
CREATE OR REPLACE FUNCTION corpus.fn_check_evaluation_frozen()
RETURNS TRIGGER AS $$
DECLARE
    v_status_id INTEGER;
BEGIN
    -- For INSERT/UPDATE find evaluation_id in the NEW row
    -- Depending on which table we are triggering, the column name might vary.
    -- We assume the child tables have standard evaluation_id column.
    
    SELECT status_id INTO v_status_id FROM corpus.corpus_evaluation WHERE id = NEW.evaluation_id;
    
    -- Status 1 is Draft. Anything else is Frozen.
    IF v_status_id != 1 THEN
        RAISE EXCEPTION 'Evaluation is frozen (status_id %). Create a new evaluation to change inputs.', v_status_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Applied to child tables
DROP TRIGGER IF EXISTS tr_prevent_eval_control_state_update ON corpus.corpus_evaluation_control_state;
CREATE TRIGGER tr_prevent_eval_control_state_update
BEFORE INSERT OR UPDATE OR DELETE ON corpus.corpus_evaluation_control_state
FOR EACH ROW EXECUTE FUNCTION corpus.fn_check_evaluation_frozen();

DROP TRIGGER IF EXISTS tr_prevent_eval_test_run_update ON corpus.corpus_evaluation_test_run;
CREATE TRIGGER tr_prevent_eval_test_run_update
BEFORE INSERT OR UPDATE OR DELETE ON corpus.corpus_evaluation_test_run
FOR EACH ROW EXECUTE FUNCTION corpus.fn_check_evaluation_frozen();

DROP TRIGGER IF EXISTS tr_prevent_eval_artifact_update ON corpus.corpus_evaluation_artifact;
CREATE TRIGGER tr_prevent_eval_artifact_update
BEFORE INSERT OR UPDATE OR DELETE ON corpus.corpus_evaluation_artifact
FOR EACH ROW EXECUTE FUNCTION corpus.fn_check_evaluation_frozen();


-- 4. MODEL RUN IMMUTABILITY
CREATE OR REPLACE FUNCTION corpus.fn_check_model_run_immutable()
RETURNS TRIGGER AS $$
DECLARE
    v_status TEXT;
    v_ended TIMESTAMP WITH TIME ZONE;
    v_run_id UUID;
BEGIN
    -- Identify the run_id we are checking
    IF TG_TABLE_NAME = 'corpus_model_run' THEN
        v_run_id := OLD.id;
    ELSE
        -- For child tables, column is usually model_run_id or similar
        -- We'll try to find it dynamically if possible, but here we specify for known tables.
        IF TG_TABLE_NAME = 'corpus_model_run_control' THEN v_run_id := OLD.model_run_id;
        ELSIF TG_TABLE_NAME = 'corpus_model_run_obligation' THEN v_run_id := OLD.model_run_id;
        ELSIF TG_TABLE_NAME = 'corpus_model_run_score' THEN v_run_id := OLD.model_run_id;
        ELSIF TG_TABLE_NAME = 'corpus_model_run_trigger' THEN v_run_id := OLD.model_run_id;
        END IF;
    END IF;

    SELECT run_status, ended_at INTO v_status, v_ended FROM corpus.corpus_model_run WHERE id = v_run_id;

    IF v_status = 'completed' OR v_ended IS NOT NULL THEN
        RAISE EXCEPTION 'ModelRun is immutable. Status: %, Ended at: %', v_status, v_ended;
    END IF;

    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Apply to ModelRun and its child tables
DROP TRIGGER IF EXISTS tr_prevent_model_run_update ON corpus.corpus_model_run;
CREATE TRIGGER tr_prevent_model_run_update
BEFORE UPDATE OR DELETE ON corpus.corpus_model_run
FOR EACH ROW EXECUTE FUNCTION corpus.fn_check_model_run_immutable();

DROP TRIGGER IF EXISTS tr_prevent_model_run_control_update ON corpus.corpus_model_run_control;
CREATE TRIGGER tr_prevent_model_run_control_update
BEFORE UPDATE OR DELETE ON corpus.corpus_model_run_control
FOR EACH ROW EXECUTE FUNCTION corpus.fn_check_model_run_immutable();

DROP TRIGGER IF EXISTS tr_prevent_model_run_obligation_update ON corpus.corpus_model_run_obligation;
CREATE TRIGGER tr_prevent_model_run_obligation_update
BEFORE UPDATE OR DELETE ON corpus.corpus_model_run_obligation
FOR EACH ROW EXECUTE FUNCTION corpus.fn_check_model_run_immutable();

DROP TRIGGER IF EXISTS tr_prevent_model_run_score_update ON corpus.corpus_model_run_score;
CREATE TRIGGER tr_prevent_model_run_score_update
BEFORE UPDATE OR DELETE ON corpus.corpus_model_run_score
FOR EACH ROW EXECUTE FUNCTION corpus.fn_check_model_run_immutable();

DROP TRIGGER IF EXISTS tr_prevent_model_run_trigger_update ON corpus.corpus_model_run_trigger;
CREATE TRIGGER tr_prevent_model_run_trigger_update
BEFORE UPDATE OR DELETE ON corpus.corpus_model_run_trigger
FOR EACH ROW EXECUTE FUNCTION corpus.fn_check_model_run_immutable();


-- 5. PARAMETER SET IMMUTABILITY
CREATE OR REPLACE FUNCTION corpus.fn_check_parameter_set_locked()
RETURNS TRIGGER AS $$
DECLARE
    v_status_id INTEGER;
BEGIN
    SELECT status_id INTO v_status_id FROM corpus.corpus_parameter_set WHERE id = OLD.id;
    
    -- Status 2 is Active. Prohibit changes.
    IF v_status_id = 2 THEN
        RAISE EXCEPTION 'Parameter Set is Active and Locked. Create a new version for changes.';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_parameter_set_update ON corpus.corpus_parameter_set;
CREATE TRIGGER tr_prevent_parameter_set_update
BEFORE UPDATE OR DELETE ON corpus.corpus_parameter_set
FOR EACH ROW EXECUTE FUNCTION corpus.fn_check_parameter_set_locked();


-- 6. FRAMEWORK VERSION LOCK
CREATE OR REPLACE FUNCTION corpus.fn_check_framework_version_used()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if used in a finished ModelRun
    IF EXISTS (
        SELECT 1 FROM corpus.corpus_model_run 
        WHERE framework_version_id = OLD.id AND (run_status = 'completed' OR ended_at IS NOT NULL)
    ) THEN
        RAISE EXCEPTION 'Framework version is locked because it was used in final ModelRuns.';
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_prevent_framework_version_update ON corpus.corpus_framework_version;
CREATE TRIGGER tr_prevent_framework_version_update
BEFORE UPDATE OR DELETE ON corpus.corpus_framework_version
FOR EACH ROW EXECUTE FUNCTION corpus.fn_check_framework_version_used();
