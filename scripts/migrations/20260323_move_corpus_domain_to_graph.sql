BEGIN;

CREATE SCHEMA IF NOT EXISTS graph;

DO $$
BEGIN
  IF to_regclass('corpus.domain') IS NOT NULL
     AND to_regclass('graph.domain') IS NULL THEN
    ALTER TABLE corpus.domain SET SCHEMA graph;
  END IF;
END $$;

COMMIT;
