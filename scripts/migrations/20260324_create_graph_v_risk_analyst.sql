CREATE OR REPLACE VIEW graph.v_risk_analyst AS
SELECT
  ra.id AS analyst_id,
  ra.risk_id,
  r.code AS risk_code,
  r.name AS risk_name,
  r.risk_type,
  r.risk_layer_id,
  r.risk_origen,

  ra.element_id,
  de.code AS element_code,
  COALESCE(de.title, de.name, de.code) AS element_name,
  de.element_type,

  ra.probability,
  ra.impact,
  ra.connectivity,
  ra.cascade,
  ra.k_factor,

  ra.base_score,
  (
    (ra.probability * ra.impact) * (1 + (ra.k_factor * ra.cascade))
  )::numeric(18,6) AS risk_score,
  ra.adjusted_score,
  (
    ((ra.probability * ra.impact) * (1 + (ra.k_factor * ra.cascade))) - ra.base_score
  )::numeric(18,6) AS delta_score,

  ra.scenario,
  ra.source,
  ra.analysis_notes,
  ra.created_at,
  ra.updated_at
FROM graph.risk_analyst ra
JOIN graph.risk r
  ON r.id = ra.risk_id
LEFT JOIN graph.domain_elements de
  ON de.id = ra.element_id;
