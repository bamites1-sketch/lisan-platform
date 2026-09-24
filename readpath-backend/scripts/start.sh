#!/bin/sh
set -e

echo "🚀 Starting ReadPath Backend..."

# Set default DATABASE_URL if not provided (Back4App SQLite)
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="file:./production.db"
  echo "📊 Using default SQLite database"
fi

# Ensure production environment
export NODE_ENV=production
export PORT=3000

# Initialize database
echo "📊 Setting up database..."
if ! npx prisma db push --force-reset --accept-data-loss; then
  echo "⚠️  Database setup failed, continuing anyway..."
fi

# Create admin user
echo "👤 Creating admin user..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  try {
    const hashedPassword = await bcrypt.hash('LiSAN2026!', 10);
    await prisma.user.upsert({
      where: { email: 'admin@readpath.com' },
      update: {},
      create: {
        email: 'admin@readpath.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE',
        profile: {
          create: {
            firstName: 'Admin',
            lastName: 'User'
          }
        }
      }
    });
    console.log('✅ Admin user ready');
  } catch (error) {
    console.log('⚠️  Admin user setup:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" || echo "⚠️  Admin setup failed, continuing..."

# Start the application
echo "🎯 Starting the server..."
exec node dist/server.js