import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.$connect()
    .then(() => { console.log('OK: Connected to database'); return p.$disconnect(); })
    .catch(e => { console.error('FAIL:', e.message); process.exit(1); });
