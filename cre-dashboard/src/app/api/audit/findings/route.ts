import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET /api/audit/findings?evaluationId=...
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const evaluationId = searchParams.get('evaluationId');

    if (!evaluationId) {
        return NextResponse.json({ error: 'evaluationId is required' }, { status: 400 });
    }

    try {
        const findings = await prisma.corpusAuditFinding.findMany({
            where: { evaluationId },
            include: { eventType: true },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(findings);
    } catch (error) {
        console.error('Audit Findings API Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// POST /api/audit/findings (Manual Creation)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            tenantId, evaluationId, eventTypeId, title, description,
            severity, exposureFloor, readinessPenalty, dueDate, ownerRole,
            userId, userRole
        } = body;

        // 1. RBAC Check (Mock logic - should use real session)
        const allowedRoles = ['AUDITOR', 'AUDIT_MANAGER'];
        if (!allowedRoles.includes(userRole)) {
            return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
        }

        // 2. Fetch finding type for defaults
        const findingType = await prisma.corpusAuditFindingType.findUnique({
            where: { id: eventTypeId }
        });

        if (!findingType) {
            return NextResponse.json({ error: 'Finding type not found' }, { status: 404 });
        }

        // 3. Manager Override logic
        const isManager = userRole === 'AUDIT_MANAGER';
        const finalExposureFloor = isManager ? (exposureFloor ?? findingType.defaultExposureFloor) : findingType.defaultExposureFloor;
        const finalReadinessPenalty = isManager ? (readinessPenalty ?? findingType.defaultReadinessPenalty) : findingType.defaultReadinessPenalty;

        // 4. Create Finding
        const finding = await prisma.corpusAuditFinding.create({
            data: {
                tenantId,
                evaluationId,
                eventTypeId,
                code: `AUDIT-MAN-${new Date().getTime()}`,
                title: title || `${findingType.name} (Manual)`,
                description: description || 'Hallazgo creado manualmente por el equipo de cumplimiento.',
                severity: severity ?? findingType.defaultSeverity,
                status: 'open',
                exposureFloor: finalExposureFloor,
                readinessPenalty: finalReadinessPenalty,
                ownerRole: ownerRole ?? findingType.defaultOwnerRole,
                dueDate: dueDate ? new Date(dueDate) : null,
                createdBy: userId,
                evidenceLinks: [], // Manual findings require evidence upload via another flow usually
                // Legacy compatibility
                severityId: severity ?? findingType.defaultSeverity,
                statusId: 1
            }
        });

        // 5. Log change
        await prisma.corpusAuditLog.create({
            data: {
                tenantId,
                entityName: 'corpus_audit_finding',
                entityId: finding.id,
                action: 'MANUAL_CREATE',
                newData: finding as any,
                changedBy: userId,
                ipAddress: '127.0.0.1'
            }
        });

        return NextResponse.json(finding);
    } catch (error) {
        console.error('Audit Findings POST Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
