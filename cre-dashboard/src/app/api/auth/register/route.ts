import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, password, fullName, roleCode, tenantId } = await request.json();

        if (!email || !password || !tenantId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check if user already exists
        const existingUser = await prisma.securityUser.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 400 });
        }

        // Hash the password
        const passwordHash = await hashPassword(password);

        // Create the user
        const newUser = await prisma.securityUser.create({
            data: {
                tenantId,
                email,
                passwordHash,
                fullName,
                roleCode: roleCode || 'OPERATOR',
                isActive: true
            }
        });

        return NextResponse.json({
            success: true,
            userId: newUser.id,
            message: 'User created successfully'
        });

    } catch (error: any) {
        console.error('Registration error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
