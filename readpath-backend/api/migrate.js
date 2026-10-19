const { PrismaClient } = require('@prisma/client');

// Temporary migration endpoint - REMOVE AFTER USE
module.exports = async (req, res) => {
  // Security check - only allow specific setup key
  const setupKey = req.query.key || req.body?.key;
  
  if (setupKey !== process.env.SETUP_KEY) {
    return res.status(403).json({ error: 'Forbidden - Invalid setup key' });
  }

  try {
    const prisma = new PrismaClient();
    
    // Test connection
    await prisma.$connect();
    console.log('✓ Connected to database');
    
    // Check current tables
    const tables = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log(`Current tables: ${tables.length}`);
    
    // Check if users table has required columns
    const userColumns = await prisma.$queryRaw`SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users'`;
    const hasPassword = userColumns.some(c => c.column_name === 'password');
    const hasStatus = userColumns.some(c => c.column_name === 'status');
    
    await prisma.$disconnect();
    
    return res.json({
      success: true,
      message: 'Database schema check complete',
      data: {
        tablesCount: tables.length,
        tables: tables.map(t => t.table_name),
        userTableColumns: userColumns.map(c => c.column_name),
        hasRequiredColumns: {
          password: hasPassword,
          status: hasStatus
        }
      }
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({
      error: 'Migration failed',
      message: error.message
    });
  }
};
