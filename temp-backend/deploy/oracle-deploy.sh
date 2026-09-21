#!/bin/bash
# Oracle Cloud Deployment Script for LiSAN Backend
# Run this after oracle-setup.sh

set -e

echo "=========================================="
echo "LiSAN Backend - Deployment"
echo "=========================================="

# Variables
APP_DIR="/home/ubuntu/lisan-backend"
REPO_URL="https://github.com/bamites1-sketch/lisan-platform.git"

# Clone or update repository
if [ -d "$APP_DIR" ]; then
    echo "→ Updating repository..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "→ Cloning repository..."
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# Navigate to backend directory
cd "$APP_DIR/readpath-backend"

# Copy production schema
echo "→ Setting up production database schema..."
cp prisma/schema.production.prisma prisma/schema.prisma

# Install dependencies
echo "→ Installing dependencies..."
npm install --production

# Generate Prisma client
echo "→ Generating Prisma client..."
npx prisma generate

# Build TypeScript
echo "→ Building application..."
npm run build

# Run database migrations
echo "→ Running database migrations..."
npx prisma migrate deploy

# Configure PM2
echo "→ Configuring PM2..."
pm2 stop lisan-backend || true
pm2 delete lisan-backend || true
pm2 start dist/server.js --name lisan-backend --env production
pm2 save
pm2 startup

# Setup Nginx
echo "→ Configuring Nginx..."
sudo cp "$APP_DIR/readpath-backend/deploy/nginx-lisan.conf" /etc/nginx/sites-available/lisan
sudo ln -sf /etc/nginx/sites-available/lisan /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "=========================================="
echo "✅ Deployment complete!"
echo "=========================================="
echo ""
echo "Your backend is running on:"
echo "- Local: http://localhost:5000"
echo "- Public: http://$(curl -s ifconfig.me)"
echo ""
echo "PM2 status: pm2 status"
echo "PM2 logs: pm2 logs lisan-backend"
echo "PM2 restart: pm2 restart lisan-backend"
