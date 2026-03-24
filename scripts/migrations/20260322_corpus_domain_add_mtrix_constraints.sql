BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_domain_type'
      AND conrelid = 'corpus.domain'::regclass
  ) THEN
    ALTER TABLE corpus.domain
      ADD CONSTRAINT fk_domain_domain_type
      FOREIGN KEY (domain_type_id)
      REFERENCES catalogos.cat_ciber_domain_type(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_risk_scope'
      AND conrelid = 'corpus.domain'::regclass
  ) THEN
    ALTER TABLE corpus.domain
      ADD CONSTRAINT fk_domain_risk_scope
      FOREIGN KEY (risk_scope_id)
      REFERENCES catalogos.cat_ciber_risk_scope(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_supervisory_relevance'
      AND conrelid = 'corpus.domain'::regclass
  ) THEN
    ALTER TABLE corpus.domain
      ADD CONSTRAINT fk_domain_supervisory_relevance
      FOREIGN KEY (supervisory_relevance_id)
      REFERENCES catalogos.cat_ciber_supervisory_relevance(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_weight_factor'
      AND conrelid = 'corpus.domain'::regclass
  ) THEN
    ALTER TABLE corpus.domain
      ADD CONSTRAINT fk_domain_weight_factor
      FOREIGN KEY (weight_factor_id)
      REFERENCES catalogos.cat_ciber_weight_factor(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_applicability_rule'
      AND conrelid = 'corpus.domain'::regclass
  ) THEN
    ALTER TABLE corpus.domain
      ADD CONSTRAINT fk_domain_applicability_rule
      FOREIGN KEY (applicability_rule_id)
      REFERENCES catalogos.cat_ciber_applicability_rule(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'fk_domain_mtrix_status'
      AND conrelid = 'corpus.domain'::regclass
  ) THEN
    ALTER TABLE corpus.domain
      ADD CONSTRAINT fk_domain_mtrix_status
      FOREIGN KEY (mtrix_status_id)
      REFERENCES catalogos.cat_ciber_status(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_domain_active_dates'
      AND conrelid = 'corpus.domain'::regclass
  ) THEN
    ALTER TABLE corpus.domain
      ADD CONSTRAINT ck_domain_active_dates
      CHECK (
        active_from IS NULL
        OR active_to IS NULL
        OR active_to >= active_from
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_domain_code_not_blank'
      AND conrelid = 'corpus.domain'::regclass
  ) THEN
    ALTER TABLE corpus.domain
      ADD CONSTRAINT ck_domain_code_not_blank
      CHECK (btrim(code) <> '');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_domain_name_not_blank'
      AND conrelid = 'corpus.domain'::regclass
  ) THEN
    ALTER TABLE corpus.domain
      ADD CONSTRAINT ck_domain_name_not_blank
      CHECK (btrim(name) <> '');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ck_domain_description_not_blank'
      AND conrelid = 'corpus.domain'::regclass
  ) THEN
    ALTER TABLE corpus.domain
      ADD CONSTRAINT ck_domain_description_not_blank
      CHECK (description IS NULL OR btrim(description) <> '');
  END IF;
END $$;

COMMIT;
