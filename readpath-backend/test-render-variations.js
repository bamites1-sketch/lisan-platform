const { PrismaClient } = require('@prisma/client');

const base = 'postgresql://lisan_db_xdfu_user:PTZgRmddw7cydHua6Y3eTfD5vxxR001A@dpg-dald6hv40ujc73djsb20-a.oregon-postgres.render.com/lisan_db_xdfu';

const variations = [
  `${base}?sslmode=require`,
  `${base}?sslmode=no-verify`,
  `${base}?sslmode=prefer`,
  `${base}?sslmode=require&connect_timeout=15`,
  `${base}?sslmode=require&connection_limit=1`
];

async function testAll() {
  for (const url of variations) {
    console.log('\n--- Testing variation:', url.split('?')[1]);
    const p = new PrismaClient({
      datasources: { db: { url } },
      log: ['error', 'warn']
    });
    try {
      await p.$connect();
      console.log('✓ Connected successfully!');
      const tables = await p.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
      console.log('Tables count:', tables.length);
      console.log('Tables:', tables.map(t => t.table_name));
      const users = await p.user.findMany();
      console.log('Users found:', users.map(u => ({ email: u.email, role: u.role })));
      await p.$disconnect();
      return url; // Stop on first success!
    } catch (e) {
      console.error('Failed:', e.message);
    } finally {
      await p.$disconnect().catch(() => {});
    }
  }
}

testAll();
