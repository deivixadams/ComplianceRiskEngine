BEGIN;

CREATE SCHEMA IF NOT EXISTS graph;

DO $$
BEGIN
  IF to_regclass('corpus.jurisdiction') IS NOT NULL
     AND to_regclass('graph.jurisdiction') IS NULL THEN
    ALTER TABLE corpus.jurisdiction SET SCHEMA graph;
  END IF;
END $$;

COMMIT;
