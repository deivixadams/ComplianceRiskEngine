BEGIN;

CREATE SCHEMA IF NOT EXISTS graph;

DO $$
BEGIN
  IF to_regclass('corpus.control') IS NOT NULL
     AND to_regclass('graph.control') IS NULL THEN
    ALTER TABLE corpus.control SET SCHEMA graph;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('corpus.obligation') IS NOT NULL
     AND to_regclass('graph.obligation') IS NULL THEN
    ALTER TABLE corpus.obligation SET SCHEMA graph;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('corpus.risk') IS NOT NULL
     AND to_regclass('graph.risk') IS NULL THEN
    ALTER TABLE corpus.risk SET SCHEMA graph;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('corpus.mtrix_risk') IS NOT NULL
     AND to_regclass('graph.mtrix_risk') IS NULL THEN
    ALTER TABLE corpus.mtrix_risk SET SCHEMA graph;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('corpus.mtrix_activity') IS NOT NULL
     AND to_regclass('graph.mtrix_activity') IS NULL THEN
    ALTER TABLE corpus.mtrix_activity SET SCHEMA graph;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('corpus.map_control_cre_company') IS NOT NULL
     AND to_regclass('graph.map_control_cre_company') IS NULL THEN
    ALTER TABLE corpus.map_control_cre_company SET SCHEMA graph;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('corpus.map_obligation_control') IS NOT NULL
     AND to_regclass('graph.map_obligation_control') IS NULL THEN
    ALTER TABLE corpus.map_obligation_control SET SCHEMA graph;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('corpus.map_obligation_risk') IS NOT NULL
     AND to_regclass('graph.map_obligation_risk') IS NULL THEN
    ALTER TABLE corpus.map_obligation_risk SET SCHEMA graph;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('corpus.map_reino_domain') IS NOT NULL
     AND to_regclass('graph.map_reino_domain') IS NULL THEN
    ALTER TABLE corpus.map_reino_domain SET SCHEMA graph;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('corpus.map_risk_control') IS NOT NULL
     AND to_regclass('graph.map_risk_control') IS NULL THEN
    ALTER TABLE corpus.map_risk_control SET SCHEMA graph;
  END IF;
END $$;

COMMIT;
