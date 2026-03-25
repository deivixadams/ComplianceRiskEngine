BEGIN;

-- Normaliza probabilidad e impacto a escala regulatoria 1..5.
-- Regla de migracion:
--   - Valores historicos en 0..1 => se escalan con ROUND(valor * 5)
--   - Valores fuera de 0..1   => se redondean al entero mas cercano
--   - Siempre se acota en [1,5]

UPDATE graph.risk_analyst
SET
  probability = CASE
    WHEN probability < 1 THEN GREATEST(1, LEAST(5, ROUND(probability * 5)))
    ELSE GREATEST(1, LEAST(5, ROUND(probability)))
  END,
  impact = CASE
    WHEN impact < 1 THEN GREATEST(1, LEAST(5, ROUND(impact * 5)))
    ELSE GREATEST(1, LEAST(5, ROUND(impact)))
  END,
  updated_at = now()
WHERE
  probability < 1 OR probability > 5 OR probability <> ROUND(probability)
  OR impact < 1 OR impact > 5 OR impact <> ROUND(impact);

UPDATE graph.audit_draft_risk_analysis
SET
  probability = CASE
    WHEN probability < 1 THEN GREATEST(1, LEAST(5, ROUND(probability * 5)))
    ELSE GREATEST(1, LEAST(5, ROUND(probability)))
  END,
  impact = CASE
    WHEN impact < 1 THEN GREATEST(1, LEAST(5, ROUND(impact * 5)))
    ELSE GREATEST(1, LEAST(5, ROUND(impact)))
  END,
  updated_at = now()
WHERE
  probability < 1 OR probability > 5 OR probability <> ROUND(probability)
  OR impact < 1 OR impact > 5 OR impact <> ROUND(impact);

ALTER TABLE IF EXISTS graph.risk_analyst
  DROP CONSTRAINT IF EXISTS chk_risk_analyst_probability;
ALTER TABLE IF EXISTS graph.risk_analyst
  ADD CONSTRAINT chk_risk_analyst_probability
  CHECK (probability >= 1 AND probability <= 5);

ALTER TABLE IF EXISTS graph.risk_analyst
  DROP CONSTRAINT IF EXISTS chk_risk_analyst_impact;
ALTER TABLE IF EXISTS graph.risk_analyst
  ADD CONSTRAINT chk_risk_analyst_impact
  CHECK (impact >= 1 AND impact <= 5);

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  DROP CONSTRAINT IF EXISTS chk_audit_draft_risk_analysis_probability;
ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT chk_audit_draft_risk_analysis_probability
  CHECK (probability >= 1 AND probability <= 5);

ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  DROP CONSTRAINT IF EXISTS chk_audit_draft_risk_analysis_impact;
ALTER TABLE IF EXISTS graph.audit_draft_risk_analysis
  ADD CONSTRAINT chk_audit_draft_risk_analysis_impact
  CHECK (impact >= 1 AND impact <= 5);

COMMIT;
