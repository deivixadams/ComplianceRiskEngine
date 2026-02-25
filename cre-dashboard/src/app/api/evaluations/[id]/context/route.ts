import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;

        const evaluation = await prisma.corpusEvaluation.findUnique({
            where: { id },
            include: {
                assessment: {
                    include: {
                        company: {
                            include: {
                                jurisdiction: true
                            }
                        }
                    }
                }
            }
        });

        if (!evaluation) {
            return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
        }

        // Fetch Framework Version details separately if needed
        const frameworkVersion = await prisma.corpusFrameworkVersion.findUnique({
            where: { id: evaluation.frameworkVersionId },
            include: {
                framework: true
            }
        });

        return NextResponse.json({
            evaluation: {
                id: evaluation.id,
                statusId: evaluation.statusId,
                period: {
                    start: evaluation.periodStart,
                    end: evaluation.periodEnd
                }
            },
            assessment: evaluation.assessment,
            framework: frameworkVersion?.framework,
            version: frameworkVersion
        });
    } catch (error: any) {
        console.error('Error fetching evaluation context:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
