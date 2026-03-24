BEGIN;

DO $$
BEGIN
  IF to_regclass('audit.mtrix_risk') IS NOT NULL
     AND to_regclass('corpus.mtrix_risk') IS NULL THEN
    ALTER TABLE audit.mtrix_risk SET SCHEMA corpus;
  END IF;
END $$;

COMMIT;
