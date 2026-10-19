const { PrismaClient } = require('@prisma/client');

process.env.DATABASE_URL = 'postgresql://lisan_db_xdfu_user:PTZgRmddw7cydHua6Y3eTfD5vxxR001A@dpg-dald6hv40ujc73djsb20-a.oregon-postgres.render.com/lisan_db_xdfu?sslmode=require';

const prisma = new PrismaClient();

async function test() {
  try {
    console.log('Connecting to database...');
    await prisma.$connect();
    console.log('✓ Connected to database');
    
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log(`📊 Tables found: ${tables.length}`);
    tables.forEach(t => console.log('  -', t.table_name));
    
    // Check if users table exists and has the right columns
    const columns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'`;
    console.log(`\n👤 Users table columns: ${columns.length}`);
    columns.forEach(c => console.log('  -', c.column_name));
    
    await prisma.$disconnect();
    console.log('\n✓ Test complete');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

test();
