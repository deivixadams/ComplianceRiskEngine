const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();
const SALT_ROUNDS = 12;

async function createUser(email, password, fullName, roleCode) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    try {
        const user = await prisma.securityUser.create({
            data: {
                tenantId: '00000000-0000-0000-0000-000000000001',
                email,
                passwordHash,
                fullName,
                roleCode,
                isActive: true
            }
        });
        console.log(`User created: ${user.email} (${user.roleCode})`);
    } catch (e) {
        if (e.code === 'P2002') {
            console.log(`User already exists: ${email}`);
        } else {
            console.error(`Error creating user ${email}:`, e);
        }
    }
}

async function main() {
    console.log('--- Initializing Users ---');
    await createUser('admin@cre.com', '123456', 'Administrador Principal', 'ADMIN');
    await createUser('test@cre.com', '123456', 'Usuario de Prueba', 'OPERATOR');
    console.log('--- Done ---');
    await prisma.$disconnect();
}

main();
