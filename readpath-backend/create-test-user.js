// Quick script to create test users
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUsers() {
  try {
    const password = await bcrypt.hash('test123', 10);
    
    // Check if test user already exists
    const existing = await prisma.user.findUnique({
      where: { email: 'test@example.com' }
    });

    if (existing) {
      console.log('✅ Test user already exists!');
      console.log('Email: test@example.com');
      console.log('Password: test123');
      return;
    }

    // Create test student user
    const student = await prisma.user.create({
      data: {
        email: 'test@example.com',
        password,
        role: 'STUDENT',
        student: {
          create: {
            firstName: 'Test',
            lastName: 'Student',
            grade: 'GRADE_3',
            xp: 100,
            streakDays: 5
          }
        }
      }
    });

    console.log('✅ Test student user created successfully!');
    console.log('Email: test@example.com');
    console.log('Password: test123');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUsers();