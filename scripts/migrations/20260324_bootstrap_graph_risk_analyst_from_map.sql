-- Step 2 (revised): no synthetic bootstrap values for graph.risk_analyst.
-- Real risk analysis data must be loaded from verified sources.

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

-- Intentionally no INSERT/UPSERT here.
-- Missing rows in graph.risk_analyst are surfaced by graph.v_risk_analyst as incomplete data.
