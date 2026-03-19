import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    // framework_doc_view is in the corpus schema
    const result = await prisma.$queryRaw`SELECT * FROM corpus.framework_doc_view LIMIT 20`;
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
