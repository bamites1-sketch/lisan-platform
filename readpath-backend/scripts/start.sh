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

# Initialize database safely (no data loss)
echo "📊 Setting up database..."
if ! npx prisma db push --schema prisma/schema.production.prisma; then
  echo "⚠️  Database setup failed, continuing anyway..."
fi

# Create default admin user if none exists
echo "👤 Checking admin user..."
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

(async () => {
  const prisma = new PrismaClient();
  try {
    const existing = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('LiSAN2026!', 12);
      await prisma.user.create({
        data: {
          email: 'admin@readpath.com',
          password: hashedPassword,
          role: 'ADMIN',
          status: 'ACTIVE',
          admin: {
            create: {
              firstName: 'Admin',
              lastName: 'User'
            }
          }
        }
      });
      console.log('✅ Admin user created (admin@readpath.com)');
    } else {
      console.log('✅ Admin user already exists');
    }
  } catch (error) {
    console.log('⚠️  Admin user setup notice:', error.message);
  } finally {
    await prisma.\$disconnect();
  }
})();
" || echo "⚠️  Admin check completed with notice"

# Start the application
echo "🎯 Starting the server..."
exec node dist/server.js