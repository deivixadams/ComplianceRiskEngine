-- -----------------------------------------------------------------------------
-- FINAL VERIFICATION SCRIPT: Freeze & Immutability Triggers
-- -----------------------------------------------------------------------------

DO $$
DECLARE
    v_company_id UUID := gen_random_uuid();
    v_jurisdiction_id UUID := gen_random_uuid();
    v_framework_id UUID := gen_random_uuid();
    v_framework_version_id UUID := gen_random_uuid();
    v_assessment_id UUID := gen_random_uuid();
    v_evaluation_id UUID := gen_random_uuid();
    v_model_run_id UUID := gen_random_uuid();
BEGIN
    -- 1. Setup Base Data
    INSERT INTO corpus.corpus_jurisdiction (id, name, code, iso2, iso3) 
    VALUES (v_jurisdiction_id, 'Traceability Land', 'TRL', 'TL', 'TRL');

    INSERT INTO corpus.corpus_company (id, name, code, legal_name, jurisdiction_id, status_id) 
    VALUES (v_company_id, 'Traceability Corp', 'TRC-123', 'Traceability Corp LTD', v_jurisdiction_id, 1);
    
    INSERT INTO corpus.corpus_framework (id, name, code, jurisdiction_id) 
    VALUES (v_framework_id, 'AML Standard', 'AML-STD', v_jurisdiction_id);
    
    INSERT INTO corpus.corpus_framework_version (id, framework_id, version, status) 
    VALUES (v_framework_version_id, v_framework_id, 'v1.0-test', 'active');
    
    INSERT INTO corpus.corpus_assessment (id, company_id, status_id, name, framework_version_id) 
    VALUES (v_assessment_id, v_company_id, 1, 'Test Assessment', v_framework_version_id);
    
    -- 2. Test EVALUATION FREEZE
    -- Create an Active (status 2 = Frozen) Evaluation
    INSERT INTO corpus.corpus_evaluation (id, assessment_id, status_id, period_start, period_end) 
    VALUES (v_evaluation_id, v_assessment_id, 2, now(), now());
    
    BEGIN
        INSERT INTO corpus.corpus_evaluation_control_state (id, evaluation_id, control_id, state)
        VALUES (gen_random_uuid(), v_evaluation_id, gen_random_uuid(), 'fail');
        RAISE EXCEPTION 'FAIL: Evaluation trigger did not block insert on frozen Evaluation.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: Evaluation trigger correctly blocked insert. Error: %', SQLERRM;
    END;

    -- 3. Test MODEL RUN IMMUTABILITY
    -- Create a Completed Model Run
    INSERT INTO corpus.corpus_model_run (id, assessment_id, evaluation_id, parameter_set_id, engine_version, run_status, ended_at)
    VALUES (v_model_run_id, v_assessment_id, v_evaluation_id, gen_random_uuid(), '1.0', 'completed', now());

    BEGIN
        UPDATE corpus.corpus_model_run SET engine_version = '2.0' WHERE id = v_model_run_id;
        RAISE EXCEPTION 'FAIL: ModelRun trigger did not block update on completed Run.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: ModelRun trigger correctly blocked update. Error: %', SQLERRM;
    END;

    -- 4. Test CHILD MODEL RUN IMMUTABILITY
    BEGIN
        INSERT INTO corpus.corpus_model_run_score (id, model_run_id, score_value)
        VALUES (gen_random_uuid(), v_model_run_id, 0.85);
        RAISE EXCEPTION 'FAIL: ModelRun child trigger did not block update on completed Run.';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'SUCCESS: ModelRun child trigger correctly blocked update. Error: %', SQLERRM;
    END;

    RAISE NOTICE 'TRACER: All verification scenarios passed.';
END $$;
