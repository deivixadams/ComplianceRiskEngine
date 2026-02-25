import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const types = await prisma.corpusAuditFindingType.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });
        return NextResponse.json(types);
    } catch (error) {
        console.error('Audit Catalog API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// Optional Seeding helper (could be used manually)
export async function POST() {
    const defaultTypes = [
        { id: 1, code: 'CTRL_CRITICAL_FAIL', name: 'Falla Crítica de Control', defaultSeverity: 5, defaultExposureFloor: 0.7, defaultReadinessPenalty: 30, defaultDueDays: 15 },
        { id: 2, code: 'CTRL_SIG_FAIL', name: 'Falla Significativa de Control', defaultSeverity: 4, defaultExposureFloor: 0.4, defaultReadinessPenalty: 15, defaultDueDays: 30 },
        { id: 3, code: 'PEP_NO_EDD', name: 'Clientes PEP sin EDD', defaultSeverity: 5, defaultExposureFloor: 0.8, defaultReadinessPenalty: 50, defaultDueDays: 7 },
        { id: 4, code: 'ROS_LATE', name: 'Reporte ROS Extemporáneo', defaultSeverity: 4, defaultExposureFloor: 0.5, defaultReadinessPenalty: 25, defaultDueDays: 10 },
        { id: 5, code: 'UBO_MISSING', name: 'Falta de Identificación de Beneficiario Final', defaultSeverity: 5, defaultExposureFloor: 0.6, defaultReadinessPenalty: 40, defaultDueDays: 20 },
    ];

    try {
        for (const type of defaultTypes) {
            await prisma.corpusAuditFindingType.upsert({
                where: { id: type.id },
                update: type,
                create: type
            });
        }
        return NextResponse.json({ message: 'Catalog seeded' });
    } catch (error) {
        return NextResponse.json({ error: 'Seeding failed' }, { status: 500 });
    }
}
