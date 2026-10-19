const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

process.env.DEBUG = 'prisma:client*';

async function testUrl(url) {
  console.log('\n--- Testing with URL ---');
  console.log(url.replace(/:[^:@]+@/, ':***@'));
  const prisma = new PrismaClient({
    datasources: { db: { url } },
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    const result = await prisma.$queryRaw`SELECT 1 as num`;
    console.log('Query result:', result);
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
    console.log('Users:', users);
    await prisma.$disconnect();
    return true;
  } catch (err) {
    console.error('Failed:', err.message);
    await prisma.$disconnect().catch(() => {});
    return false;
  }
}

async function main() {
  const url = process.env.DATABASE_URL;
  await testUrl(url);
}

main();
