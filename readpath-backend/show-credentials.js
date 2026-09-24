const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showCredentials() {
  try {
    console.log('🔍 Checking existing users in database...\n');
    
    const users = await prisma.user.findMany({
      include: {
        admin: true,
        teacher: true,
        parent: true,
        student: true
      }
    });

    if (users.length === 0) {
      console.log('📝 No users found. Creating admin user...\n');
      
      // Create admin if no users exist
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123456', 12);
      
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@readpath.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE'
        }
      });

      await prisma.admin.create({
        data: {
          userId: adminUser.id,
          firstName: 'Admin',
          lastName: 'ReadPath'
        }
      });

      console.log('✅ Admin user created!');
      console.log('📧 Email: admin@readpath.com');
      console.log('🔑 Password: admin123456\n');
      return;
    }

    console.log('👥 Available Users:\n');
    
    users.forEach(user => {
      let profile = '';
      let name = '';
      
      if (user.admin) {
        profile = 'ADMIN';
        name = `${user.admin.firstName} ${user.admin.lastName}`;
      } else if (user.teacher) {
        profile = 'TEACHER';
        name = `${user.teacher.firstName} ${user.teacher.lastName}`;
      } else if (user.parent) {
        profile = 'PARENT';
        name = `${user.parent.firstName} ${user.parent.lastName}`;
      } else if (user.student) {
        profile = 'STUDENT';
        name = `${user.student.firstName} ${user.student.lastName}`;
      }
      
      console.log(`🔹 ${profile}: ${name}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🔑 Password: admin123456 (or LiSAN2026! for admin@lisan.com)`);
      console.log(`   📊 Status: ${user.status}\n`);
    });

    console.log('🌐 Frontend URL: http://localhost:3000');
    console.log('🔗 Backend URL: http://localhost:5000');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

showCredentials();