BEGIN;

CREATE TABLE IF NOT EXISTS graph.map_domain_elements (
  domain_id uuid NOT NULL,
  domain_element_id uuid NOT NULL,
  relation_type text NOT NULL DEFAULT 'PRIMARY',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT map_domain_elements_pkey PRIMARY KEY (domain_id, domain_element_id),
  CONSTRAINT fk_map_domain_elements_domain
    FOREIGN KEY (domain_id)
    REFERENCES graph.domain(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_map_domain_elements_domain_element
    FOREIGN KEY (domain_element_id)
    REFERENCES graph.domain_elements(id)
    ON DELETE CASCADE,
  CONSTRAINT ck_map_domain_elements_relation_type
    CHECK (btrim(relation_type) <> '')
);

CREATE INDEX IF NOT EXISTS idx_map_domain_elements_domain_element
  ON graph.map_domain_elements(domain_element_id);

CREATE INDEX IF NOT EXISTS idx_map_domain_elements_relation_type
  ON graph.map_domain_elements(relation_type);

TRUNCATE TABLE graph.map_domain_elements;

WITH reino_rules AS (
  SELECT 'OBLIGATION'::text AS element_type, 'AML'::text AS reino_code
  UNION ALL
  SELECT 'ACTIVITY'::text AS element_type, 'CYB'::text AS reino_code
),
target_domains AS (
  SELECT
    rr.element_type,
    d.id AS domain_id
  FROM reino_rules rr
  JOIN graph._reino r
    ON r.code = rr.reino_code
  JOIN graph.map_reino_domain mrd
    ON mrd.reino_id = r.id
  JOIN graph.domain d
    ON d.id = mrd.domain_id
)
INSERT INTO graph.map_domain_elements (
  domain_id,
  domain_element_id,
  relation_type
)
SELECT
  td.domain_id,
  de.id AS domain_element_id,
  'REINO_DERIVED'
FROM graph.domain_elements de
JOIN target_domains td
  ON td.element_type = de.element_type
ON CONFLICT (domain_id, domain_element_id) DO NOTHING;

COMMIT;
