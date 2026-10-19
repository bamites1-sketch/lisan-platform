const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Check what columns actually exist in users table
  const cols = await prisma.$queryRaw`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'users' 
    ORDER BY ordinal_position
  `;
  console.log('=== users table columns ===');
  cols.forEach(c => console.log(' ', c.column_name, '-', c.data_type));

  // Check if password column exists
  const hasPwd = cols.some(c => c.column_name === 'password');
  console.log('\nHas password column:', hasPwd);

  if (!hasPwd) {
    console.log('\nAttempting to add missing password column...');
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT ''`;
    console.log('Column added! Now need to set actual hashed passwords.');
    
    // Check current users
    const users = await prisma.$queryRaw`SELECT id, email, role FROM users LIMIT 10`;
    console.log('\nExisting users:');
    users.forEach(u => console.log(' ', u.email, '-', u.role));
  }
}

main()
  .catch(e => console.error('Error:', e.message))
  .finally(() => prisma.$disconnect());
