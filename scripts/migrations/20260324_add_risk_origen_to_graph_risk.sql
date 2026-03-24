BEGIN;

ALTER TABLE graph.risk
  ADD COLUMN IF NOT EXISTS risk_origen text;

UPDATE graph.risk
SET risk_origen = CASE
  WHEN code LIKE 'RSK\_%' ESCAPE '\' THEN 'AML'
  WHEN code LIKE 'RISK-%' THEN 'CYB'
  ELSE NULL
END;

DO $$
DECLARE
  v_unknown integer;
BEGIN
  SELECT count(*)
  INTO v_unknown
  FROM graph.risk
  WHERE risk_origen IS NULL;

  IF v_unknown > 0 THEN
    RAISE EXCEPTION 'Existen % riesgos sin clasificar en risk_origen (patron de code no reconocido)', v_unknown;
  END IF;
END $$;

ALTER TABLE graph.risk
  ALTER COLUMN risk_origen SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'graph_risk_risk_origen_check'
      AND conrelid = 'graph.risk'::regclass
  ) THEN
    ALTER TABLE graph.risk
      ADD CONSTRAINT graph_risk_risk_origen_check
      CHECK (risk_origen IN ('AML', 'CYB'));
  END IF;
END $$;

COMMIT;
