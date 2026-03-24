DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_risk') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'graph'
         AND table_name = 'map_domain_elements_risk'
         AND column_name = 'obligation_id'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'graph'
         AND table_name = 'map_domain_elements_risk'
         AND column_name = 'element_id'
     ) THEN
    ALTER TABLE graph.map_domain_elements_risk
      RENAME COLUMN obligation_id TO element_id;
  END IF;
END $$;
