#!/bin/sh
set -e

echo "🚀 Starting ReadPath Backend..."

# Ensure DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable is required"
  exit 1
fi

# Run database migrations with better error handling
echo "📊 Running database migrations..."
if ! npx prisma migrate deploy --schema=./prisma/schema.prisma; then
  echo "⚠️  Migration failed, creating database..."
  npx prisma db push --schema=./prisma/schema.prisma --force-reset || true
fi

# Start the application
echo "🎯 Starting the server..."
exec node dist/server.js