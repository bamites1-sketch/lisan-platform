#!/bin/bash
# Deployment Script for ReadPath Backend
# Run this script to deploy or update the application

set -e

echo "=================================================="
echo "ReadPath Backend Deployment"
echo "=================================================="
echo ""

APP_DIR="/var/www/readpath-backend"
REPO_URL="https://github.com/bamites1-sketch/lisan-platform.git"
BRANCH="main"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_success() { echo -e "${GREEN}✓ $1${NC}"; }
print_info() { echo -e "${YELLOW}→ $1${NC}"; }
print_error() { echo -e "${RED}✗ $1${NC}"; }

# Check if this is first deployment or update
if [ -d "$APP_DIR/.git" ]; then
    print_info "Updating existing deployment..."
    cd $APP_DIR
    
    # Stash any local changes
    git stash
    
    # Pull latest changes
    git pull origin $BRANCH
    print_success "Code updated"
else
    print_info "First time deployment - cloning repository..."
    
    # Clone repository
    cd /var/www
    git clone $REPO_URL readpath-backend
    cd readpath-backend
    
    # Switch to backend directory context
    cd readpath-backend
    print_success "Repository cloned"
fi

# Navigate to backend directory
cd $APP_DIR/readpath-backend

# Check if .env exists
if [ ! -f "$APP_DIR/.env" ]; then
    print_error ".env file not found!"
    echo "Please create $APP_DIR/.env file with production variables"
    echo "Use the template at deploy/env.production.template"
    exit 1
fi

# Install dependencies
print_info "Installing dependencies..."
npm ci --omit=dev
print_success "Dependencies installed"

# Generate Prisma client
print_info "Generating Prisma client..."
npx prisma generate
print_success "Prisma client generated"

# Run database migrations
print_info "Running database migrations..."
npx prisma migrate deploy
print_success "Database migrations applied"

# Build TypeScript
print_info "Building application..."
npm run build
print_success "Build complete"

# Create uploads directory if not exists
mkdir -p $APP_DIR/uploads
chmod 755 $APP_DIR/uploads

# Restart application with PM2
print_info "Restarting application..."

if pm2 list | grep -q "readpath-backend"; then
    # App exists, restart it
    pm2 restart readpath-backend
else
    # First time, start with PM2
    pm2 start $APP_DIR/readpath-backend/dist/server.js \
        --name readpath-backend \
        --instances 1 \
        --env production \
        --error $APP_DIR/logs/pm2-error.log \
        --output $APP_DIR/logs/pm2-output.log \
        --time
    
    # Save PM2 configuration
    pm2 save
fi

print_success "Application restarted"

# Show status
echo ""
pm2 status readpath-backend

echo ""
print_success "Deployment complete!"
echo ""
echo "Check logs with: pm2 logs readpath-backend"
echo "Check status with: pm2 status"
echo ""
