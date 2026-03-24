BEGIN;

DO $$
BEGIN
  IF to_regclass('graph.reino') IS NOT NULL
     AND to_regclass('graph._graph_reino') IS NULL THEN
    ALTER TABLE graph.reino RENAME TO _graph_reino;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph._graph_reino') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'reino_pkey'
         AND conrelid = 'graph._graph_reino'::regclass
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = '_graph_reino_pkey'
         AND conrelid = 'graph._graph_reino'::regclass
     ) THEN
    ALTER TABLE graph._graph_reino
      RENAME CONSTRAINT reino_pkey TO _graph_reino_pkey;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph._graph_reino') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = '_reino_pkey'
         AND conrelid = 'graph._graph_reino'::regclass
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = '_graph_reino_pkey'
         AND conrelid = 'graph._graph_reino'::regclass
     ) THEN
    ALTER TABLE graph._graph_reino
      RENAME CONSTRAINT _reino_pkey TO _graph_reino_pkey;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph._graph_reino') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'reino_code_key'
         AND conrelid = 'graph._graph_reino'::regclass
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = '_graph_reino_code_key'
         AND conrelid = 'graph._graph_reino'::regclass
     ) THEN
    ALTER TABLE graph._graph_reino
      RENAME CONSTRAINT reino_code_key TO _graph_reino_code_key;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph._graph_reino') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = '_reino_code_key'
         AND conrelid = 'graph._graph_reino'::regclass
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = '_graph_reino_code_key'
         AND conrelid = 'graph._graph_reino'::regclass
     ) THEN
    ALTER TABLE graph._graph_reino
      RENAME CONSTRAINT _reino_code_key TO _graph_reino_code_key;
  END IF;
END $$;

COMMIT;
