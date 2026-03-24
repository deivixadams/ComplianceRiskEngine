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

INSERT INTO graph.map_domain_elements (
  domain_id,
  domain_element_id,
  relation_type
)
SELECT DISTINCT
  o.domain_id,
  de.id,
  'PRIMARY'
FROM graph.obligation o
JOIN graph.domain_elements de
  ON de.id = o.id
 AND de.element_type = 'OBLIGATION'
ON CONFLICT (domain_id, domain_element_id) DO NOTHING;

INSERT INTO graph.map_domain_elements (
  domain_id,
  domain_element_id,
  relation_type
)
SELECT DISTINCT
  a.domain_id,
  de.id,
  'PRIMARY'
FROM graph.mtrix_activity a
JOIN graph.domain_elements de
  ON de.id = a.id
 AND de.element_type = 'ACTIVITY'
ON CONFLICT (domain_id, domain_element_id) DO NOTHING;

COMMIT;
