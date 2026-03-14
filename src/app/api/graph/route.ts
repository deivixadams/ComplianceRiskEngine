import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

type GraphViewRow = {
  element_kind: 'node' | 'edge';
  element_key: string;
  element_data: Record<string, unknown>;
};

type FilterCountRow = {
  value: string | null;
  count: number;
};

function parseMultiValue(searchParams: URLSearchParams, key: string) {
  const directValues = searchParams.getAll(key);
  const csvValue = searchParams.get(key);
  const values = [...directValues];

  if (csvValue && !directValues.includes(csvValue)) {
    values.push(csvValue);
  }

  return [...new Set(
    values
      .flatMap((value) => String(value).split(','))
      .map((value) => value.trim())
      .filter(Boolean)
  )];
}

function parseBooleanFlag(value: string | null) {
  return value === 'true' || value === '1';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const nodeTypes = parseMultiValue(searchParams, 'node_type');
    const edgeTypes = parseMultiValue(searchParams, 'edge_type');
    const statuses = parseMultiValue(searchParams, 'status');
    const search = searchParams.get('search')?.trim() ?? '';
    const onlyHardGate = parseBooleanFlag(searchParams.get('hard_gate'));
    const onlyDependencyRoot = parseBooleanFlag(searchParams.get('dependency_root'));
    const onlyPrimary = parseBooleanFlag(searchParams.get('primary'));
    const onlyMandatory = parseBooleanFlag(searchParams.get('mandatory'));
    const criticalityMin = Number(searchParams.get('criticality_min'));

    const nodeFilters: Prisma.Sql[] = [Prisma.sql`element_kind = 'node'`];
    const edgeFilters: Prisma.Sql[] = [Prisma.sql`element_kind = 'edge'`];

    if (nodeTypes.length > 0) {
      nodeFilters.push(Prisma.sql`element_data->>'type' = ANY(${nodeTypes}::text[])`);
    }

    if (edgeTypes.length > 0) {
      edgeFilters.push(Prisma.sql`element_data->>'edge_type' = ANY(${edgeTypes}::text[])`);
    }

    if (statuses.length > 0) {
      nodeFilters.push(Prisma.sql`COALESCE(element_data->>'status', '') = ANY(${statuses}::text[])`);
    }

    if (onlyHardGate) {
      nodeFilters.push(Prisma.sql`COALESCE((element_data->>'is_hard_gate')::boolean, false) = true`);
    }

    if (onlyDependencyRoot) {
      nodeFilters.push(Prisma.sql`COALESCE((element_data->>'is_dependency_root')::boolean, false) = true`);
    }

    if (onlyPrimary) {
      edgeFilters.push(Prisma.sql`COALESCE((element_data->>'is_primary')::boolean, false) = true`);
    }

    if (onlyMandatory) {
      edgeFilters.push(Prisma.sql`COALESCE((element_data->>'is_mandatory')::boolean, false) = true`);
    }

    if (Number.isFinite(criticalityMin)) {
      nodeFilters.push(
        Prisma.sql`COALESCE(NULLIF(element_data->>'criticality', '')::int, 0) >= ${criticalityMin}`
      );
    }

    if (search) {
      const searchPattern = `%${search}%`;
      const searchFilter = Prisma.sql`
        (
          COALESCE(element_data->>'code', '') ILIKE ${searchPattern}
          OR COALESCE(element_data->>'label', '') ILIKE ${searchPattern}
          OR COALESCE(element_data->>'title', '') ILIKE ${searchPattern}
          OR COALESCE(element_data->>'id', '') ILIKE ${searchPattern}
        )
      `;
      nodeFilters.push(searchFilter);
      edgeFilters.push(searchFilter);
    }

    const nodeWhereSql = Prisma.sql`WHERE ${Prisma.join(nodeFilters, ' AND ')}`;
    const edgeWhereSql = Prisma.sql`WHERE ${Prisma.join(edgeFilters, ' AND ')}`;

    const [nodesRaw, edgesRaw, nodeTypeRows, edgeTypeRows] = await Promise.all([
      prisma.$queryRaw<GraphViewRow[]>(Prisma.sql`
        SELECT element_kind, element_key, element_data
        FROM graph.cre_graph_view
        ${nodeWhereSql}
        ORDER BY element_key
      `),
      prisma.$queryRaw<GraphViewRow[]>(Prisma.sql`
        SELECT element_kind, element_key, element_data
        FROM graph.cre_graph_view
        ${edgeWhereSql}
        ORDER BY element_key
      `),
      prisma.$queryRaw<FilterCountRow[]>(Prisma.sql`
        SELECT element_data->>'type' AS value, COUNT(*)::int AS count
        FROM graph.cre_graph_view
        WHERE element_kind = 'node'
        GROUP BY 1
        ORDER BY 1
      `),
      prisma.$queryRaw<FilterCountRow[]>(Prisma.sql`
        SELECT element_data->>'edge_type' AS value, COUNT(*)::int AS count
        FROM graph.cre_graph_view
        WHERE element_kind = 'edge'
        GROUP BY 1
        ORDER BY 1
      `),
    ]);

    return NextResponse.json({
      elements: [...nodesRaw, ...edgesRaw],
      meta: {
        counts: {
          nodes: nodesRaw.length,
          edges: edgesRaw.length,
          total: nodesRaw.length + edgesRaw.length,
        },
        availableFilters: {
          nodeTypes: nodeTypeRows
            .filter((row) => row.value)
            .map((row) => ({ value: String(row.value), count: Number(row.count) })),
          edgeTypes: edgeTypeRows
            .filter((row) => row.value)
            .map((row) => ({ value: String(row.value), count: Number(row.count) })),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching graph view:', error);
    return NextResponse.json({ error: 'Failed to fetch graph' }, { status: 500 });
  }
}
