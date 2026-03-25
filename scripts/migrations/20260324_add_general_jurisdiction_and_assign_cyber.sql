BEGIN;

ALTER TABLE graph.jurisdiction DISABLE TRIGGER trg_sync_status_jurisdiction;

DO $$
DECLARE
  v_general_jurisdiction_id uuid;
BEGIN
  SELECT j.id
    INTO v_general_jurisdiction_id
  FROM graph.jurisdiction j
  WHERE j.code = 'GEN'
  LIMIT 1;

  IF v_general_jurisdiction_id IS NULL THEN
    INSERT INTO graph.jurisdiction (
      id,
      code,
      name,
      iso2,
      iso3,
      status,
      created_at,
      updated_at,
      status_id
    )
    VALUES (
      gen_random_uuid(),
      'GEN',
      'General',
      NULL,
      NULL,
      true,
      now(),
      now(),
      2
    )
    RETURNING id INTO v_general_jurisdiction_id;
  ELSE
    UPDATE graph.jurisdiction
       SET name = 'General',
           status = true,
           status_id = COALESCE(status_id, 2),
           updated_at = now()
     WHERE id = v_general_jurisdiction_id;
  END IF;

  UPDATE "_DONOTUSE_".corpus_framework
     SET jurisdiction_id = v_general_jurisdiction_id,
         updated_at = now()
   WHERE code = 'CYB_DO_BASE';
END $$;

ALTER TABLE graph.jurisdiction ENABLE TRIGGER trg_sync_status_jurisdiction;

COMMIT;
