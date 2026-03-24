BEGIN;

CREATE SCHEMA IF NOT EXISTS graph;

DO $$
BEGIN
  IF to_regclass('corpus._reino') IS NOT NULL
     AND to_regclass('graph._reino') IS NULL
     AND to_regclass('graph.reino') IS NULL THEN
    ALTER TABLE corpus._reino SET SCHEMA graph;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph._reino') IS NOT NULL
     AND to_regclass('graph.reino') IS NULL THEN
    ALTER TABLE graph._reino RENAME TO reino;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.reino') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = '_reino_pkey'
         AND conrelid = 'graph.reino'::regclass
     ) THEN
    ALTER TABLE graph.reino RENAME CONSTRAINT _reino_pkey TO reino_pkey;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.reino') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = '_reino_code_key'
         AND conrelid = 'graph.reino'::regclass
     ) THEN
    ALTER TABLE graph.reino RENAME CONSTRAINT _reino_code_key TO reino_code_key;
  END IF;
END $$;

COMMIT;
