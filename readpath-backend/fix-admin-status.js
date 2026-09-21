const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminStatus() {
  try {
    await prisma.user.update({
      where: { email: 'admin@lisan.com' },
      data: { status: 'ACTIVE' }
    });
    console.log('✅ Admin status updated to ACTIVE');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminStatus();