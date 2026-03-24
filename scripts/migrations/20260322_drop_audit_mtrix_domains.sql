BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_key_activity_domain'
      AND conrelid = 'audit.mtrix_key_activity'::regclass
      AND confrelid = to_regclass('audit.mtrix_domains')
  ) THEN
    ALTER TABLE audit.mtrix_key_activity
      DROP CONSTRAINT fk_key_activity_domain;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_key_activity_domain'
      AND conrelid = 'audit.mtrix_key_activity'::regclass
      AND confrelid = 'corpus.domain'::regclass
  ) THEN
    ALTER TABLE audit.mtrix_key_activity
      ADD CONSTRAINT fk_key_activity_domain
      FOREIGN KEY (domain_id)
      REFERENCES corpus.domain(id);
  END IF;
END $$;

DROP TABLE IF EXISTS audit.mtrix_domains;

COMMIT;
