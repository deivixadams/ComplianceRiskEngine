DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_control') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'graph'
         AND table_name = 'map_domain_elements_control'
         AND column_name = 'obligation_id'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM information_schema.columns
       WHERE table_schema = 'graph'
         AND table_name = 'map_domain_elements_control'
         AND column_name = 'element_id'
     ) THEN
    ALTER TABLE graph.map_domain_elements_control
      RENAME COLUMN obligation_id TO element_id;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_control') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'corpus_obligation_control_map_pkey'
     )
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'map_domain_elements_control_pkey'
     ) THEN
    ALTER TABLE graph.map_domain_elements_control
      RENAME CONSTRAINT corpus_obligation_control_map_pkey TO map_domain_elements_control_pkey;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.idx_ocm_obligation') IS NOT NULL
     AND to_regclass('graph.idx_ocm_element') IS NULL THEN
    ALTER INDEX graph.idx_ocm_obligation
      RENAME TO idx_ocm_element;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('graph.map_domain_element') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_element'::regclass
         AND conname = 'uq_map_domain_element_element_id'
     ) THEN
    IF EXISTS (
      SELECT element_id
      FROM graph.map_domain_element
      GROUP BY element_id
      HAVING COUNT(*) > 1
    ) THEN
      RAISE EXCEPTION 'Cannot add unique constraint uq_map_domain_element_element_id: duplicate element_id values exist in graph.map_domain_element';
    END IF;

    ALTER TABLE graph.map_domain_element
      ADD CONSTRAINT uq_map_domain_element_element_id UNIQUE (element_id);
  END IF;
END $$;

DELETE FROM graph.map_domain_elements_control moc
WHERE NOT EXISTS (
  SELECT 1
  FROM graph.map_domain_element mde
  WHERE mde.element_id = moc.element_id
);

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_control') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'fk_map_domain_elements_control_element'
     ) THEN
    ALTER TABLE graph.map_domain_elements_control
      DROP CONSTRAINT fk_map_domain_elements_control_element;
  END IF;
END $$;

ALTER TABLE graph.map_domain_elements_control
  ADD CONSTRAINT fk_map_domain_elements_control_element
  FOREIGN KEY (element_id)
  REFERENCES graph.map_domain_element(element_id);
