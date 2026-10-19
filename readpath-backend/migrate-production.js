const { execSync } = require('child_process');

// This script will be run manually to push schema to production database
console.log('🚀 Starting production database migration...\n');

try {
  // Get the DATABASE_URL from Vercel environment
  console.log('📋 Using DATABASE_URL from environment...');
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable not found!');
  }
  
  console.log('✓ DATABASE_URL found\n');
  
  // Push schema to database
  console.log('📤 Pushing schema to production database...');
  execSync('npx prisma db push --accept-data-loss --skip-generate', {
    stdio: 'inherit',
    env: { ...process.env }
  });
  
  console.log('\n✅ Migration completed successfully!');
  console.log('\n🎉 Production database is now up to date.');
  
} catch (error) {
  console.error('\n❌ Migration failed:', error.message);
  process.exit(1);
}
