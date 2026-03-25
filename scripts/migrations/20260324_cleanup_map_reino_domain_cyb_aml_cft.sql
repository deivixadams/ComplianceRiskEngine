BEGIN;

DO $$
DECLARE
  deleted_count integer := 0;
BEGIN
  IF to_regclass('graph.map_reino_domain') IS NULL THEN
    RAISE NOTICE 'graph.map_reino_domain no existe. No se aplican cambios.';
    RETURN;
  END IF;

  IF to_regclass('graph._reino') IS NOT NULL THEN
    WITH deleted_rows AS (
      DELETE FROM graph.map_reino_domain m
      USING graph._reino r, graph.domain d
      WHERE m.reino_id = r.id
        AND m.domain_id = d.id
        AND r.code = 'CYB'
        AND d.code = 'AML_CFT'
      RETURNING 1
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted_rows;
  ELSIF to_regclass('graph.reino') IS NOT NULL THEN
    WITH deleted_rows AS (
      DELETE FROM graph.map_reino_domain m
      USING graph.reino r, graph.domain d
      WHERE m.reino_id = r.id
        AND m.domain_id = d.id
        AND r.code = 'CYB'
        AND d.code = 'AML_CFT'
      RETURNING 1
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted_rows;
  ELSE
    RAISE EXCEPTION 'No existe tabla de reino en graph (_reino/reino).';
  END IF;

  RAISE NOTICE 'Filas eliminadas (CYB -> AML_CFT): %', deleted_count;
END
$$;

COMMIT;

