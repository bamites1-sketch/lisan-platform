/**
 * Auto create admin user without prompts
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existing) {
      console.log('✅ An admin user already exists:', existing.email);
      console.log('   Use the admin dashboard to manage users.');
      return;
    }

    console.log('Creating admin user...');
    
    const email = 'admin@lisan.com';
    const firstName = 'Admin';
    const lastName = 'User';
    const password = 'LiSAN2026!';

    if (password.length < 8) {
      console.error('❌ Password must be at least 8 characters.'); return;
    }

    const hashed = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        email,
        password: hashed,
        role: 'ADMIN',
        admin: { create: { firstName, lastName } },
      },
    });

    console.log('✅ Admin user created successfully!');
    console.log('   Email:', email);
    console.log('   Password:', password);
    console.log('   You can now log in at the frontend.');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();