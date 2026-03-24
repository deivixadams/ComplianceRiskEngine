import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const prisma = (await import('@/lib/prisma')).default;

    const stats = await prisma.$transaction([
      prisma.$queryRaw`SELECT count(*)::int as count FROM graph.domain`,
      prisma.$queryRaw`SELECT count(*)::int as count FROM graph.domain_elements WHERE element_type = 'OBLIGATION'`,
      prisma.$queryRaw`SELECT count(*)::int as count FROM graph.risk`,
      prisma.$queryRaw`SELECT count(*)::int as count FROM graph.control`,
      prisma.$queryRaw`SELECT count(*)::int as count FROM graph.map_risk_control`,
      prisma.$queryRaw`SELECT count(*)::int as count FROM graph.map_domain_elements_risk`,
      prisma.$queryRaw`SELECT count(*)::int as count FROM graph.map_domain_elements_control`,
      prisma.$queryRaw`SELECT count(*)::int as count FROM corpus.audit_assessment`,
      prisma.$queryRaw`SELECT count(*)::int as count FROM corpus.audit_evaluation`,
      prisma.$queryRaw`SELECT count(*)::int as count FROM score.run`,
    ]);

    const results = [
      { label: "Dominios",        value: (stats[0] as any)[0].count, badge: "Corpus",  icon: "domain",       color: "#3b82f6" },
      { label: "Obligaciones",    value: (stats[1] as any)[0].count, badge: "Corpus",  icon: "obligation",   color: "#8b5cf6" },
      { label: "Riesgos",         value: (stats[2] as any)[0].count, badge: "Corpus",  icon: "risk",         color: "#f59e0b" },
      { label: "Controles",       value: (stats[3] as any)[0].count, badge: "Corpus",  icon: "control",      color: "#10b981" },
      { label: "Map Riesgo↔Ctrl", value: (stats[4] as any)[0].count, badge: "Mapping", icon: "map_rc",       color: "#06b6d4" },
      { label: "Map Oblig↔Riesgo",value: (stats[5] as any)[0].count, badge: "Mapping", icon: "map_or",       color: "#ec4899" },
      { label: "Map Oblig↔Ctrl",  value: (stats[6] as any)[0].count, badge: "Mapping", icon: "map_oc",       color: "#14b8a6" },
      { label: "Auditorías",      value: (stats[7] as any)[0].count, badge: "Audit",   icon: "audit",        color: "#6366f1" },
      { label: "Evaluaciones",    value: (stats[8] as any)[0].count, badge: "Audit",   icon: "finding",      color: "#ef4444" },
      { label: "Corridas (Run)",  value: (stats[9] as any)[0].count, badge: "Score",   icon: "run",          color: "#22c55e" },
    ];

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error fetching corpus stats:', error);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}

