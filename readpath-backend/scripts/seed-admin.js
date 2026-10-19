const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@lisan.com';
  const password = 'LiSAN2026!';
  const hashedPassword = await bcrypt.hash(password, 12);

  console.log('Upserting admin user:', email);
  const adminUser = await prisma.user.upsert({
    where: { email },
    update: {
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
    create: {
      email,
      password: hashedPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      admin: {
        create: {
          firstName: 'Super',
          lastName: 'Admin',
        },
      },
    },
    include: { admin: true },
  });

  console.log('✅ Admin user created/updated successfully:');
  console.log({
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    status: adminUser.status,
    adminProfile: adminUser.admin
  });

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('❌ Failed to seed admin:', err);
  process.exit(1);
});
