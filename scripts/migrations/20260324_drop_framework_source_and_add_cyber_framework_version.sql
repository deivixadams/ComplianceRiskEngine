BEGIN;

DO $$
DECLARE
  v_jurisdiction_id uuid;
  v_framework_id uuid;
  v_framework_version_id uuid;
BEGIN
  SELECT j.id
    INTO v_jurisdiction_id
  FROM graph.jurisdiction j
  WHERE j.code = 'DO'
  ORDER BY j.name ASC
  LIMIT 1;

  IF v_jurisdiction_id IS NULL THEN
    SELECT j.id
      INTO v_jurisdiction_id
    FROM graph.jurisdiction j
    ORDER BY j.name ASC
    LIMIT 1;
  END IF;

  IF v_jurisdiction_id IS NULL THEN
    RAISE EXCEPTION 'No existe ningun registro en graph.jurisdiction para crear el framework de ciberseguridad';
  END IF;

  SELECT f.id
    INTO v_framework_id
  FROM "_DONOTUSE_".corpus_framework f
  WHERE f.code = 'CYB_DO_BASE'
  LIMIT 1;

  IF v_framework_id IS NULL THEN
    v_framework_id := gen_random_uuid();
    INSERT INTO "_DONOTUSE_".corpus_framework (
      id,
      jurisdiction_id,
      code,
      name,
      description,
      status,
      created_at,
      updated_at,
      status_id
    ) VALUES (
      v_framework_id,
      v_jurisdiction_id,
      'CYB_DO_BASE',
      'Marco Base de Ciberseguridad',
      'Marco base para evaluaciones de ciberseguridad',
      'active',
      now(),
      now(),
      2
    );
  END IF;

  SELECT fv.id
    INTO v_framework_version_id
  FROM corpus.framework_version fv
  WHERE fv.framework_id = v_framework_id
    AND fv.version = 'v1'
  LIMIT 1;

  IF v_framework_version_id IS NULL THEN
    v_framework_version_id := gen_random_uuid();
    INSERT INTO corpus.framework_version (
      id,
      framework_id,
      version,
      effective_date,
      changelog,
      status,
      created_at,
      updated_at,
      status_id
    ) VALUES (
      v_framework_version_id,
      v_framework_id,
      'v1',
      CURRENT_DATE,
      'Version inicial del marco de ciberseguridad',
      'active',
      now(),
      now(),
      2
    );
  ELSE
    UPDATE corpus.framework_version
       SET status = 'active',
           updated_at = now(),
           status_id = COALESCE(status_id, 2),
           changelog = COALESCE(changelog, 'Version inicial del marco de ciberseguridad')
     WHERE id = v_framework_version_id;
  END IF;
END $$;

DROP TABLE IF EXISTS corpus.framework_source CASCADE;

COMMIT;
