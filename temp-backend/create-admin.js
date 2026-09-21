/**
 * Interactive admin creation script.
 * Usage: node create-admin.js
 * (Run from the readpath-backend directory after `npx prisma generate`)
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const readline = require('readline');

const prisma = new PrismaClient();

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

async function createAdmin() {
  try {
    // Check if admin already exists
    const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (existing) {
      console.log('✅ An admin user already exists:', existing.email);
      console.log('   Use the admin dashboard to manage users.');
      return;
    }

    console.log('\n─── Create Initial Admin User ───\n');
    const email     = (await ask('Admin email:     ')).trim().toLowerCase();
    const firstName = (await ask('First name:      ')).trim();
    const lastName  = (await ask('Last name:       ')).trim();
    const password  = (await ask('Password (min 8 chars): ')).trim();

    if (!email || !firstName || !lastName || !password) {
      console.error('❌ All fields are required.'); return;
    }
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

    console.log('\n✅ Admin user created successfully!');
    console.log('   Email:', email);
    console.log('   You can now log in at the frontend.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createAdmin();
