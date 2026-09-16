// Quick script to create an admin user
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const password = await bcrypt.hash('password123', 10);
    
    // Check if admin already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'admin@readpath.com' }
    });

    if (existing) {
      console.log('✅ Admin user already exists!');
      console.log('Email: admin@readpath.com');
      console.log('Password: password123');
      return;
    }

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@readpath.com',
        password,
        role: 'ADMIN',
        admin: {
          create: {
            firstName: 'Admin',
            lastName: 'User'
          }
        }
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@readpath.com');
    console.log('Password: password123');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
