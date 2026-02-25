import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function PUT(
    request: Request,
    { params }: { params: { id: string, controlId: string } }
) {
    try {
        const { id: evaluationId, controlId } = params;
        const body = await request.json();

        // Fields allowed to update
        const {
            design,
            formalization,
            coverage,
            recency,
            evidenceValidated,
            applicability,
            notApplicableReason,
            state // fail/pass/warning
        } = body;

        // Upsert the state record
        const updatedState = await prisma.corpusEvaluationControlState.upsert({
            where: {
                // Since we don't have a unique constraint on (evaluationId, controlId) in Prisma schema yet 
                // (but we should), we'll find first or use ID if provided.
                // For this implementation, let's assume we find it by evaluationId + controlId
                id: body.id || 'new-uuid' // If ID is provided, use it, otherwise we'll search
            },
            create: {
                evaluationId,
                controlId,
                state: state || 'fail',
                formalizationEffectiveness: formalization,
                coverageEffectiveness: coverage,
                recencyEffectiveness: recency,
                evidenceValidated: evidenceValidated || false,
                applicability: applicability || 'applicable',
                notApplicableReason: notApplicableReason,
                computedAt: new Date()
            },
            update: {
                state,
                formalizationEffectiveness: formalization,
                coverageEffectiveness: coverage,
                recencyEffectiveness: recency,
                evidenceValidated,
                applicability,
                notApplicableReason,
                computedAt: new Date()
            }
        });

        return NextResponse.json(updatedState);
    } catch (error: any) {
        console.error('Error updating control state:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
