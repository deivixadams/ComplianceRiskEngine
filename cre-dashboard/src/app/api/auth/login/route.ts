import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
        }

        // Find the user
        const user = await prisma.securityUser.findUnique({
            where: { email }
        });

        if (!user || !user.isActive) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Verify password
        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Return user info (excluding password hash)
        const { passwordHash: _, ...userWithoutPassword } = user;

        // Note: In a real app, we would set a JWT cookie here
        // For now, we return the user data
        return NextResponse.json({
            success: true,
            user: userWithoutPassword,
            message: 'Login successful'
        });

    } catch (error: any) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
