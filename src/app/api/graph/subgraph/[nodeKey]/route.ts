import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';

type GraphViewRow = {
  element_kind: 'node' | 'edge';
  element_key: string;
  element_data: {
    id?: string;
    source?: string;
    target?: string;
    [key: string]: unknown;
  };
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ nodeKey: string }> }
) {
  try {
    const { nodeKey } = await params;
    const decodedNodeKey = decodeURIComponent(nodeKey);

    if (!decodedNodeKey) {
      return NextResponse.json({ error: 'Missing node key' }, { status: 400 });
    }

    const [nodeRows, edgeRows] = await Promise.all([
      prisma.$queryRaw<GraphViewRow[]>(Prisma.sql`
        SELECT element_kind, element_key, element_data
        FROM graph.cre_graph_view
        WHERE element_kind = 'node'
          AND element_data->>'id' = ${decodedNodeKey}
      `),
      prisma.$queryRaw<GraphViewRow[]>(Prisma.sql`
        SELECT element_kind, element_key, element_data
        FROM graph.cre_graph_view
        WHERE element_kind = 'edge'
          AND (
            element_data->>'source' = ${decodedNodeKey}
            OR element_data->>'target' = ${decodedNodeKey}
          )
        ORDER BY element_key
      `),
    ]);

    const connectedNodeIds = new Set<string>([decodedNodeKey]);
    edgeRows.forEach((row) => {
      if (row.element_data.source) connectedNodeIds.add(String(row.element_data.source));
      if (row.element_data.target) connectedNodeIds.add(String(row.element_data.target));
    });

    const connectedNodeArray = Array.from(connectedNodeIds);
    const neighborRows = connectedNodeArray.length > 0
      ? await prisma.$queryRaw<GraphViewRow[]>(Prisma.sql`
          SELECT element_kind, element_key, element_data
          FROM graph.cre_graph_view
          WHERE element_kind = 'node'
            AND element_data->>'id' = ANY(${connectedNodeArray}::text[])
          ORDER BY element_key
        `)
      : [];

    const uniqueNodes = new Map<string, GraphViewRow>();
    [...nodeRows, ...neighborRows].forEach((row) => {
      uniqueNodes.set(row.element_key, row);
    });

    return NextResponse.json({
      elements: [...uniqueNodes.values(), ...edgeRows],
      meta: {
        rootNodeId: decodedNodeKey,
        counts: {
          nodes: uniqueNodes.size,
          edges: edgeRows.length,
          total: uniqueNodes.size + edgeRows.length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching graph subgraph:', error);
    return NextResponse.json({ error: 'Failed to fetch graph subgraph' }, { status: 500 });
  }
}
