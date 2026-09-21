const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creating admin user in local database...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('LiSAN2026!', 12);
    
    // Check if admin already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@lisan.com' }
    });

    if (existingUser) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create user
    const user = await prisma.user.create({
      data: {
        email: 'admin@lisan.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });

    // Create admin profile
    await prisma.admin.create({
      data: {
        userId: user.id,
        firstName: 'Admin',
        lastName: 'User'
      }
    });

    console.log('🎉 Admin user created successfully!');
    console.log('📧 Email: admin@lisan.com');
    console.log('🔑 Password: LiSAN2026!');

  } catch (error) {
    console.error('❌ Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();