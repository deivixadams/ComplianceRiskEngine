BEGIN;

DO $$
BEGIN
  IF to_regclass('audit.mtrix_key_activity') IS NOT NULL
     AND to_regclass('corpus.mtrix_key_activity') IS NULL THEN
    ALTER TABLE audit.mtrix_key_activity SET SCHEMA corpus;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('audit.mtrix_map_activity_risk') IS NOT NULL
     AND to_regclass('corpus.mtrix_map_activity_risk') IS NULL THEN
    ALTER TABLE audit.mtrix_map_activity_risk SET SCHEMA corpus;
  END IF;
END $$;

COMMIT;
