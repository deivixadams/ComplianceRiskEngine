BEGIN;

CREATE OR REPLACE FUNCTION "_Schema".refresh_framework_doc()
RETURNS void
LANGUAGE plpgsql
AS $function$
BEGIN
    DELETE FROM corpus.framework_doc;

    INSERT INTO corpus.framework_doc (
        object_schema,
        object_name,
        object_type,
        object_subtype,
        parent_schema,
        parent_name,
        parent_type,
        column_name,
        ordinal_position,
        data_type,
        udt_schema,
        udt_name,
        is_nullable,
        column_default,
        object_description,
        source_oid,
        is_active,
        discovered_at,
        refreshed_at
    )
    SELECT
        n.nspname AS object_schema,
        c.relname AS object_name,
        CASE c.relkind
            WHEN 'r' THEN 'TABLE'
            WHEN 'p' THEN 'TABLE'
            WHEN 'v' THEN 'VIEW'
            WHEN 'm' THEN 'MATERIALIZED VIEW'
        END AS object_type,
        CASE c.relkind
            WHEN 'r' THEN 'BASE TABLE'
            WHEN 'p' THEN 'PARTITIONED TABLE'
            WHEN 'v' THEN 'VIEW'
            WHEN 'm' THEN 'MATERIALIZED VIEW'
        END AS object_subtype,
        NULL::text AS parent_schema,
        NULL::text AS parent_name,
        NULL::text AS parent_type,
        NULL::text AS column_name,
        NULL::integer AS ordinal_position,
        NULL::text AS data_type,
        NULL::text AS udt_schema,
        NULL::text AS udt_name,
        NULL::boolean AS is_nullable,
        NULL::text AS column_default,
        obj_description(c.oid, 'pg_class') AS object_description,
        c.oid AS source_oid,
        true AS is_active,
        now() AS discovered_at,
        now() AS refreshed_at
    FROM pg_class c
    JOIN pg_namespace n
      ON n.oid = c.relnamespace
    WHERE n.nspname <> '_DONOTUSE_'
      AND c.relkind IN ('r','p','v','m');

    INSERT INTO corpus.framework_doc (
        object_schema,
        object_name,
        object_type,
        object_subtype,
        parent_schema,
        parent_name,
        parent_type,
        column_name,
        ordinal_position,
        data_type,
        udt_schema,
        udt_name,
        is_nullable,
        column_default,
        object_description,
        source_oid,
        is_active,
        discovered_at,
        refreshed_at
    )
    SELECT
        n.nspname AS object_schema,
        c.relname AS object_name,
        'COLUMN' AS object_type,
        CASE c.relkind
            WHEN 'r' THEN 'TABLE COLUMN'
            WHEN 'p' THEN 'TABLE COLUMN'
            WHEN 'v' THEN 'VIEW COLUMN'
            WHEN 'm' THEN 'MATERIALIZED VIEW COLUMN'
        END AS object_subtype,
        n.nspname AS parent_schema,
        c.relname AS parent_name,
        CASE c.relkind
            WHEN 'r' THEN 'TABLE'
            WHEN 'p' THEN 'TABLE'
            WHEN 'v' THEN 'VIEW'
            WHEN 'm' THEN 'MATERIALIZED VIEW'
        END AS parent_type,
        a.attname AS column_name,
        a.attnum AS ordinal_position,
        pg_catalog.format_type(a.atttypid, a.atttypmod) AS data_type,
        tn.nspname AS udt_schema,
        t.typname AS udt_name,
        NOT a.attnotnull AS is_nullable,
        pg_get_expr(ad.adbin, ad.adrelid) AS column_default,
        col_description(c.oid, a.attnum) AS object_description,
        c.oid AS source_oid,
        true AS is_active,
        now() AS discovered_at,
        now() AS refreshed_at
    FROM pg_class c
    JOIN pg_namespace n
      ON n.oid = c.relnamespace
    JOIN pg_attribute a
      ON a.attrelid = c.oid
    JOIN pg_type t
      ON t.oid = a.atttypid
    JOIN pg_namespace tn
      ON tn.oid = t.typnamespace
    LEFT JOIN pg_attrdef ad
      ON ad.adrelid = a.attrelid
     AND ad.adnum = a.attnum
    WHERE n.nspname <> '_DONOTUSE_'
      AND c.relkind IN ('r','p','v','m')
      AND a.attnum > 0
      AND NOT a.attisdropped;
END;
$function$;

SELECT "_Schema".refresh_framework_doc();

COMMIT;
