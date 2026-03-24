BEGIN;

DO $$
BEGIN
  IF to_regclass('graph.map_obligation_risk') IS NOT NULL
     AND to_regclass('graph.map_domain_elements_risk') IS NULL THEN
    ALTER TABLE graph.map_obligation_risk
      RENAME TO map_domain_elements_risk;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_risk') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'map_obligation_risk_pkey'
         AND conrelid = 'graph.map_domain_elements_risk'::regclass
     ) THEN
    ALTER TABLE graph.map_domain_elements_risk
      RENAME CONSTRAINT map_obligation_risk_pkey TO map_domain_elements_risk_pkey;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_risk') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'map_obligation_risk_link_strength_check'
         AND conrelid = 'graph.map_domain_elements_risk'::regclass
     ) THEN
    ALTER TABLE graph.map_domain_elements_risk
      RENAME CONSTRAINT map_obligation_risk_link_strength_check TO map_domain_elements_risk_link_strength_check;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_risk') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'fk_map_obligation_risk_obligation'
         AND conrelid = 'graph.map_domain_elements_risk'::regclass
     ) THEN
    ALTER TABLE graph.map_domain_elements_risk
      RENAME CONSTRAINT fk_map_obligation_risk_obligation TO fk_map_domain_elements_risk_domain_element;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_risk') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conname = 'fk_map_obligation_risk_risk'
         AND conrelid = 'graph.map_domain_elements_risk'::regclass
     ) THEN
    ALTER TABLE graph.map_domain_elements_risk
      RENAME CONSTRAINT fk_map_obligation_risk_risk TO fk_map_domain_elements_risk_risk;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_risk') IS NOT NULL
     AND to_regclass('graph.map_obligation_risk_pkey') IS NOT NULL
     AND to_regclass('graph.map_domain_elements_risk_pkey') IS NULL THEN
    ALTER INDEX graph.map_obligation_risk_pkey
      RENAME TO map_domain_elements_risk_pkey;
  END IF;
END $$;

COMMIT;
