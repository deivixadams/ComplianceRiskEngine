BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_elements_domain'
      AND conrelid = 'graph.domain_elements'::regclass
  ) THEN
    ALTER TABLE graph.domain_elements
      DROP CONSTRAINT fk_domain_elements_domain;
  END IF;
END $$;

DROP INDEX IF EXISTS graph.idx_domain_elements_domain_id;
DROP INDEX IF EXISTS graph.uq_domain_elements_obligation_domain_code;

ALTER TABLE graph.domain_elements
  DROP COLUMN IF EXISTS domain_id;

COMMIT;
