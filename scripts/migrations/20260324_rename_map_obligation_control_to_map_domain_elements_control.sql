DO $$
BEGIN
  IF to_regclass('graph.map_obligation_control') IS NOT NULL
     AND to_regclass('graph.map_domain_elements_control') IS NULL THEN
    ALTER TABLE graph.map_obligation_control
      RENAME TO map_domain_elements_control;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_control') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'map_obligation_control_coverage_weight_chk'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'map_domain_elements_control_coverage_weight_chk'
     ) THEN
    ALTER TABLE graph.map_domain_elements_control
      RENAME CONSTRAINT map_obligation_control_coverage_weight_chk TO map_domain_elements_control_coverage_weight_chk;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_control') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'map_obligation_control_rationale_chk'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'map_domain_elements_control_rationale_chk'
     ) THEN
    ALTER TABLE graph.map_domain_elements_control
      RENAME CONSTRAINT map_obligation_control_rationale_chk TO map_domain_elements_control_rationale_chk;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_control') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'map_obligation_control_role_chk'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'map_domain_elements_control_role_chk'
     ) THEN
    ALTER TABLE graph.map_domain_elements_control
      RENAME CONSTRAINT map_obligation_control_role_chk TO map_domain_elements_control_role_chk;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_control') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'map_obligation_control_sequence_order_chk'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'map_domain_elements_control_sequence_order_chk'
     ) THEN
    ALTER TABLE graph.map_domain_elements_control
      RENAME CONSTRAINT map_obligation_control_sequence_order_chk TO map_domain_elements_control_sequence_order_chk;
  END IF;
END $$;
