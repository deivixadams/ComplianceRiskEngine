import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH /api/audit/findings/[id]/status
export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;
    try {
        const body = await req.json();
        const { status, resolution, userId, userRole } = body;

        // 1. RBAC Check
        const allowedRoles = ['AUDITOR', 'AUDIT_MANAGER'];
        if (!allowedRoles.includes(userRole)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Validate status
        if (!['open', 'closed', 'suppressed'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        // 3. Update Finding
        const updateData: any = { status, updatedBy: userId };

        if (status === 'closed') {
            updateData.closedAt = new Date();
            updateData.closedBy = userId;
            updateData.metadata = { resolution };
        }

        const finding = await prisma.corpusAuditFinding.update({
            where: { id },
            data: updateData
        });

        // 4. Log
        await prisma.corpusAuditLog.create({
            data: {
                tenantId: finding.tenantId,
                entityName: 'corpus_audit_finding',
                entityId: finding.id,
                action: `SET_STATUS_${status.toUpperCase()}`,
                newData: finding as any,
                changedBy: userId,
                ipAddress: '127.0.0.1'
            }
        });

        return NextResponse.json(finding);
    } catch (error) {
        console.error('Audit Finding PATCH Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
