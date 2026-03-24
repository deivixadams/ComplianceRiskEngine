BEGIN;

CREATE OR REPLACE FUNCTION corpus._framework_integrity_check()
RETURNS TABLE(
  total_controls bigint,
  existence_count bigint,
  formalization_count bigint,
  operation_count bigint,
  expected_existence bigint,
  expected_formalization bigint,
  missing_base_controls bigint,
  status text
)
LANGUAGE sql
AS $function$
WITH control_base AS (
    SELECT COUNT(*) AS total_controls
    FROM graph.control
),
dimension_counts AS (
    SELECT
        COUNT(*) FILTER (WHERE d.dimension = 'EXISTENCE') AS existence_count,
        COUNT(*) FILTER (WHERE d.dimension = 'FORMALIZATION') AS formalization_count,
        COUNT(*) FILTER (WHERE d.dimension = 'OPERATION') AS operation_count
    FROM corpus.control_evaluation_catalog e
    JOIN corpus.control_dimension_model d
      ON d.id = e.dimension_id
),
missing_base AS (
    SELECT COUNT(*) AS missing_base_controls
    FROM (
        SELECT
            c.id
        FROM graph.control c
        LEFT JOIN corpus.control_evaluation_catalog e
          ON e.control_id = c.id
        LEFT JOIN corpus.control_dimension_model d
          ON d.id = e.dimension_id
         AND d.dimension IN ('EXISTENCE', 'FORMALIZATION')
        GROUP BY c.id
        HAVING COUNT(DISTINCT d.dimension) < 2
    ) t
)
SELECT
    cb.total_controls,
    dc.existence_count,
    dc.formalization_count,
    dc.operation_count,
    cb.total_controls AS expected_existence,
    cb.total_controls AS expected_formalization,
    mb.missing_base_controls,
    CASE
        WHEN dc.existence_count = cb.total_controls
         AND dc.formalization_count = cb.total_controls
         AND mb.missing_base_controls = 0
        THEN 'OK'
        ELSE 'FAIL'
    END AS status
FROM control_base cb
CROSS JOIN dimension_counts dc
CROSS JOIN missing_base mb;
$function$;

CREATE OR REPLACE FUNCTION corpus._framework_integrity_check_missing_base()
RETURNS TABLE(
  control_code text,
  control_name text,
  has_existence boolean,
  has_formalization boolean
)
LANGUAGE sql
AS $function$
SELECT
    c.code AS control_code,
    c.name AS control_name,
    BOOL_OR(d.dimension = 'EXISTENCE') AS has_existence,
    BOOL_OR(d.dimension = 'FORMALIZATION') AS has_formalization
FROM graph.control c
LEFT JOIN corpus.control_evaluation_catalog e
  ON e.control_id = c.id
LEFT JOIN corpus.control_dimension_model d
  ON d.id = e.dimension_id
 AND d.dimension IN ('EXISTENCE', 'FORMALIZATION')
GROUP BY c.id, c.code, c.name
HAVING NOT BOOL_OR(d.dimension = 'EXISTENCE')
    OR NOT BOOL_OR(d.dimension = 'FORMALIZATION')
ORDER BY c.code;
$function$;

COMMIT;
