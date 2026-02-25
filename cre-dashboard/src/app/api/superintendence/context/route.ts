import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const companies = await prisma.$queryRaw`SELECT id, name, code FROM corpus_company WHERE status_id = 1`;
        const jurisdictions = await prisma.$queryRaw`SELECT id, name, code FROM corpus_jurisdiction`;
        const frameworks = await prisma.$queryRaw`SELECT id, name, code FROM corpus_framework`;
        const frameworkVersions = await prisma.corpusFrameworkVersion.findMany({
            where: { isActive: true },
            select: { id: true, version: true }
        });

        return NextResponse.json({
            companies,
            jurisdictions,
            frameworks,
            frameworkVersions
        });
    } catch (error: any) {
        console.error('Error fetching superintendence context:', error);
        return NextResponse.json({ error: 'Failed to fetch context' }, { status: 500 });
    }
}
