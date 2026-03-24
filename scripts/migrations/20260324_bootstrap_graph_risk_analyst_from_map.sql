-- Step 2: bootstrap risk_analyst from map_domain_elements_risk

DO $$
BEGIN
  IF to_regclass('graph.risk_analyst') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1
       FROM pg_constraint
       WHERE conrelid = 'graph.risk_analyst'::regclass
         AND conname = 'uq_risk_analyst_risk_element'
     ) THEN
    ALTER TABLE graph.risk_analyst
      ADD CONSTRAINT uq_risk_analyst_risk_element UNIQUE (risk_id, element_id);
  END IF;
END $$;

WITH base AS (
  SELECT
    mer.risk_id,
    mer.element_id,
    mer.link_strength,
    COALESCE(r.risk_layer_id, 2) AS risk_layer_id,
    COUNT(*) OVER (PARTITION BY mer.risk_id) AS risk_degree
  FROM graph.map_domain_elements_risk mer
  JOIN graph.risk r
    ON r.id = mer.risk_id
)
INSERT INTO graph.risk_analyst (
  risk_id,
  element_id,
  probability,
  impact,
  connectivity,
  cascade,
  k_factor,
  analysis_notes,
  source,
  scenario
)
SELECT
  b.risk_id,
  b.element_id,
  CASE b.link_strength
    WHEN 5 THEN 0.8500
    WHEN 4 THEN 0.7000
    WHEN 3 THEN 0.5500
    WHEN 2 THEN 0.4000
    ELSE 0.2500
  END AS probability,
  CASE b.risk_layer_id
    WHEN 1 THEN 0.9000
    WHEN 2 THEN 0.7500
    WHEN 3 THEN 0.6000
    ELSE 0.5000
  END AS impact,
  LEAST(5, GREATEST(1, b.risk_degree))::smallint AS connectivity,
  ROUND(
    LEAST(1::numeric, GREATEST(0::numeric, (LEAST(5, b.risk_degree)::numeric - 1) / 4)),
    4
  ) AS cascade,
  1.0000 AS k_factor,
  'Seed inicial desde graph.map_domain_elements_risk' AS analysis_notes,
  'bootstrap_map_domain_elements_risk_v1' AS source,
  'baseline' AS scenario
FROM base b
ON CONFLICT (risk_id, element_id)
DO UPDATE
SET
  probability = EXCLUDED.probability,
  impact = EXCLUDED.impact,
  connectivity = EXCLUDED.connectivity,
  cascade = EXCLUDED.cascade,
  k_factor = EXCLUDED.k_factor,
  analysis_notes = EXCLUDED.analysis_notes,
  source = EXCLUDED.source,
  scenario = EXCLUDED.scenario,
  updated_at = NOW();
