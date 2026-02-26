const { Client } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const SALT_ROUNDS = 12;
// Directly using the connection string found in d:\_CRE\.env
const connectionString = "postgresql://postgres:postgres@localhost:5432/cre_db?schema=corpus";

async function createUser(client, email, password, fullName, roleCode) {
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const id = crypto.randomUUID();
    const tenantId = '00000000-0000-0000-0000-000000000001';

    try {
        await client.query(
            'INSERT INTO security_users (id, tenant_id, email, password_hash, full_name, role_code, is_active, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())',
            [id, tenantId, email, passwordHash, fullName, roleCode, true]
        );
        console.log(`User created: ${email}`);
    } catch (e) {
        if (e.code === '23505') {
            console.log(`User already exists: ${email}`);
        } else {
            console.error(`Error creating user ${email}:`, e);
        }
    }
}

async function main() {
    const client = new Client({ connectionString });
    await client.connect();

    console.log('--- Initializing Users (Direct SQL) ---');
    await createUser(client, 'admin@cre.com', '123456', 'Administrador Principal', 'ADMIN');
    await createUser(client, 'test@cre.com', '123456', 'Usuario de Prueba', 'OPERATOR');
    console.log('--- Done ---');

    await client.end();
}

main();
