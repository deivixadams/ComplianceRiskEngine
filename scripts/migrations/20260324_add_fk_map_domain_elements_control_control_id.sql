-- Remove orphan mappings and enforce FK from map_domain_elements_control.control_id to graph.control.id

DELETE FROM graph.map_domain_elements_control moc
WHERE NOT EXISTS (
  SELECT 1
  FROM graph.control c
  WHERE c.id = moc.control_id
);

DO $$
BEGIN
  IF to_regclass('graph.map_domain_elements_control') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.map_domain_elements_control'::regclass
         AND conname = 'fk_map_domain_elements_control_control'
     ) THEN
    ALTER TABLE graph.map_domain_elements_control
      ADD CONSTRAINT fk_map_domain_elements_control_control
      FOREIGN KEY (control_id)
      REFERENCES graph.control(id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'graph.map_domain_elements_control'::regclass
      AND conname = 'fk_map_domain_elements_control_control'
      AND NOT convalidated
  ) THEN
    ALTER TABLE graph.map_domain_elements_control
      VALIDATE CONSTRAINT fk_map_domain_elements_control_control;
  END IF;
END $$;
