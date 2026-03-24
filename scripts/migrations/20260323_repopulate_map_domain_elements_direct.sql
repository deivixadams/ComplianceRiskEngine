BEGIN;

TRUNCATE TABLE graph.map_domain_elements;

INSERT INTO graph.map_domain_elements (
  domain_id,
  domain_element_id,
  relation_type
)
SELECT
  o.domain_id,
  de.id AS domain_element_id,
  'PRIMARY'
FROM graph.domain_elements de
JOIN graph.obligation o
  ON o.id = de.id
WHERE de.element_type = 'OBLIGATION'
ON CONFLICT (domain_id, domain_element_id) DO UPDATE
SET
  relation_type = EXCLUDED.relation_type,
  updated_at = now();

INSERT INTO graph.map_domain_elements (
  domain_id,
  domain_element_id,
  relation_type
)
SELECT
  a.domain_id,
  de.id AS domain_element_id,
  'PRIMARY'
FROM graph.domain_elements de
JOIN graph.mtrix_activity a
  ON a.id = de.id
WHERE de.element_type = 'ACTIVITY'
ON CONFLICT (domain_id, domain_element_id) DO UPDATE
SET
  relation_type = EXCLUDED.relation_type,
  updated_at = now();

COMMIT;
