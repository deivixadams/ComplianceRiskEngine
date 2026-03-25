-- Add mitigating control metadata to risk analyst and expose it in v_risk_analyst
-- Date: 2026-03-24

BEGIN;

ALTER TABLE IF EXISTS graph.risk_analyst
  ADD COLUMN IF NOT EXISTS mitigating_control_id uuid,
  ADD COLUMN IF NOT EXISTS mitigation_strength smallint,
  ADD COLUMN IF NOT EXISTS mitigation_level text;

ALTER TABLE IF EXISTS graph.risk_analyst
  DROP CONSTRAINT IF EXISTS fk_risk_analyst_mitigating_control;
ALTER TABLE IF EXISTS graph.risk_analyst
  ADD CONSTRAINT fk_risk_analyst_mitigating_control
  FOREIGN KEY (mitigating_control_id)
  REFERENCES graph.control(id)
  ON UPDATE CASCADE
  ON DELETE SET NULL;

ALTER TABLE IF EXISTS graph.risk_analyst
  DROP CONSTRAINT IF EXISTS chk_risk_analyst_mitigation_strength;
ALTER TABLE IF EXISTS graph.risk_analyst
  ADD CONSTRAINT chk_risk_analyst_mitigation_strength
  CHECK (mitigation_strength IS NULL OR mitigation_strength BETWEEN 1 AND 5);

ALTER TABLE IF EXISTS graph.risk_analyst
  DROP CONSTRAINT IF EXISTS chk_risk_analyst_mitigation_level;
ALTER TABLE IF EXISTS graph.risk_analyst
  ADD CONSTRAINT chk_risk_analyst_mitigation_level
  CHECK (mitigation_level IS NULL OR upper(mitigation_level) IN ('TOTAL','PARCIAL'));

WITH best_control_by_risk AS (
  SELECT DISTINCT ON (mrc.risk_id)
    mrc.risk_id,
    mrc.control_id,
    mrc.mitigation_strength
  FROM graph.map_risk_control mrc
  ORDER BY
    mrc.risk_id,
    mrc.mitigation_strength DESC,
    CASE lower(mrc.effect_type)
      WHEN 'preventive' THEN 1
      WHEN 'detective' THEN 2
      WHEN 'corrective' THEN 3
      ELSE 9
    END,
    mrc.control_id
)
UPDATE graph.risk_analyst ra
SET
  mitigating_control_id = bcr.control_id,
  mitigation_strength = bcr.mitigation_strength,
  mitigation_level = CASE
    WHEN bcr.mitigation_strength IS NULL THEN NULL
    WHEN bcr.mitigation_strength >= 4 THEN 'TOTAL'
    ELSE 'PARCIAL'
  END
FROM best_control_by_risk bcr
WHERE ra.risk_id = bcr.risk_id
  AND (
    ra.mitigating_control_id IS NULL
    OR ra.mitigation_strength IS NULL
    OR ra.mitigation_level IS NULL
  );

CREATE INDEX IF NOT EXISTS idx_risk_analyst_mitigating_control_id
  ON graph.risk_analyst (mitigating_control_id);

CREATE OR REPLACE VIEW graph.v_risk_analyst AS
WITH element_domain AS (
  SELECT DISTINCT ON (mde.element_id)
    mde.element_id,
    mde.domain_id
  FROM graph.map_domain_element mde
  ORDER BY mde.element_id, mde.domain_id
),
ranked_controls AS (
  SELECT
    ra.id AS analyst_id,
    mrc.control_id,
    c.code AS control_code,
    c.name AS control_name,
    mrc.mitigation_strength,
    mrc.effect_type,
    mrc.framework_version_id,
    mrc.rationale,
    mrc.coverage_notes,
    ROW_NUMBER() OVER (
      PARTITION BY ra.id
      ORDER BY
        mrc.mitigation_strength DESC,
        CASE lower(mrc.effect_type)
          WHEN 'preventive' THEN 1
          WHEN 'detective' THEN 2
          WHEN 'corrective' THEN 3
          ELSE 9
        END,
        c.code
    ) AS rn
  FROM graph.risk_analyst ra
  JOIN graph.map_risk_control mrc
    ON mrc.risk_id = ra.risk_id
  JOIN graph.control c
    ON c.id = mrc.control_id
),
best_control AS (
  SELECT
    analyst_id,
    control_id,
    control_code,
    control_name,
    mitigation_strength,
    effect_type,
    framework_version_id,
    rationale,
    coverage_notes
  FROM ranked_controls
  WHERE rn = 1
)
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
    (ra.probability * ra.impact) /
    GREATEST(COALESCE(ra.mitigation_strength, bc.mitigation_strength, 1), 1)
  )::numeric(18,6) AS risk_score,
  (
    (ra.probability * ra.impact) /
    GREATEST(COALESCE(ra.mitigation_strength, bc.mitigation_strength, 1), 1)
  )::numeric(18,6) AS adjusted_score,
  (
    (ra.probability * ra.impact) -
    (
      (ra.probability * ra.impact) /
      GREATEST(COALESCE(ra.mitigation_strength, bc.mitigation_strength, 1), 1)
    )
  )::numeric(18,6) AS delta_score,
  ra.scenario,
  ra.source,
  ra.analysis_notes,
  ra.created_at,
  ra.updated_at,

  ed.domain_id,
  COALESCE(ra.mitigating_control_id, bc.control_id) AS mitigating_control_id,
  COALESCE(oc.code, bc.control_code) AS mitigating_control_code,
  COALESCE(oc.name, bc.control_name) AS mitigating_control_name,
  COALESCE(ra.mitigation_strength, bc.mitigation_strength)::smallint AS mitigation_strength,
  COALESCE(
    upper(ra.mitigation_level),
    CASE
      WHEN COALESCE(ra.mitigation_strength, bc.mitigation_strength) IS NULL THEN NULL
      WHEN COALESCE(ra.mitigation_strength, bc.mitigation_strength) >= 4 THEN 'TOTAL'
      ELSE 'PARCIAL'
    END
  ) AS mitigation_level,
  bc.effect_type AS mitigating_effect_type,
  bc.framework_version_id AS mitigating_framework_version_id,
  bc.rationale AS mitigating_rationale,
  bc.coverage_notes AS mitigating_coverage_notes,

  (ra.probability IS NOT NULL AND ra.impact IS NOT NULL AND ra.connectivity IS NOT NULL AND ra.cascade IS NOT NULL) AS has_real_data,
  NOT (ra.probability IS NOT NULL AND ra.impact IS NOT NULL AND ra.connectivity IS NOT NULL AND ra.cascade IS NOT NULL) AS is_missing_required_data
  
FROM graph.risk_analyst ra
JOIN graph.risk r
  ON r.id = ra.risk_id
LEFT JOIN graph.domain_elements de
  ON de.id = ra.element_id
LEFT JOIN element_domain ed
  ON ed.element_id = ra.element_id
LEFT JOIN best_control bc
  ON bc.analyst_id = ra.id
LEFT JOIN graph.control oc
  ON oc.id = ra.mitigating_control_id;

COMMIT;
