BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'corpus'
          AND p.proname = 'refresh_framework_doc'
          AND pg_get_function_identity_arguments(p.oid) = ''
    ) THEN
        EXECUTE 'ALTER FUNCTION corpus.refresh_framework_doc() SET SCHEMA "_Schema"';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'corpus'
          AND p.proname = 'handle_framework_doc_ddl'
          AND pg_get_function_identity_arguments(p.oid) = ''
    ) THEN
        EXECUTE 'ALTER FUNCTION corpus.handle_framework_doc_ddl() SET SCHEMA "_Schema"';
    END IF;
END
$$;

CREATE OR REPLACE FUNCTION "_Schema".handle_framework_doc_ddl()
RETURNS event_trigger
LANGUAGE plpgsql
AS $function$
BEGIN
    PERFORM "_Schema".refresh_framework_doc();
END;
$function$;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'corpus'
          AND c.relname = 'framework_doc_view'
          AND c.relkind = 'v'
    ) THEN
        EXECUTE 'ALTER VIEW corpus.framework_doc_view SET SCHEMA "_Schema"';
    END IF;
END
$$;

COMMIT;
