#!/bin/bash
# Oracle Cloud Ubuntu ARM64 Setup Script for ReadPath Backend
# This script installs all dependencies and configures the server

set -e  # Exit on error

echo "=================================================="
echo "ReadPath Backend - Oracle Cloud Setup"
echo "=================================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}→ $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run as root. Run as ubuntu user with sudo."
    exit 1
fi

# Update system
print_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y
print_success "System updated"

# Install Node.js 20.x (LTS)
print_info "Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
print_success "Node.js $(node -v) installed"
print_success "npm $(npm -v) installed"

# Install PostgreSQL
print_info "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
print_success "PostgreSQL installed and running"

# Install Nginx
print_info "Installing Nginx..."
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
print_success "Nginx installed and running"

# Install Certbot for SSL
print_info "Installing Certbot for SSL certificates..."
sudo apt install -y certbot python3-certbot-nginx
print_success "Certbot installed"

# Install PM2 globally
print_info "Installing PM2 process manager..."
sudo npm install -g pm2
print_success "PM2 installed"

# Setup PM2 to start on boot
print_info "Configuring PM2 startup..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu
print_success "PM2 startup configured"

# Install build essentials (for native modules)
print_info "Installing build essentials..."
sudo apt install -y build-essential python3
print_success "Build tools installed"

# Configure firewall
print_info "Configuring firewall..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5432/tcp  # PostgreSQL (internal only - will restrict later)
echo "y" | sudo ufw enable
print_success "Firewall configured"

# Create application directory
print_info "Creating application directory..."
sudo mkdir -p /var/www/readpath-backend
sudo chown -R ubuntu:ubuntu /var/www/readpath-backend
print_success "Application directory created"

# Create uploads directory with proper permissions
print_info "Creating uploads directory..."
mkdir -p /var/www/readpath-backend/uploads
chmod 755 /var/www/readpath-backend/uploads
print_success "Uploads directory created"

# Create logs directory
print_info "Creating logs directory..."
mkdir -p /var/www/readpath-backend/logs
print_success "Logs directory created"

echo ""
print_success "Base system setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure PostgreSQL database"
echo "2. Clone your repository"
echo "3. Configure environment variables"
echo "4. Setup Nginx reverse proxy"
echo "5. Obtain SSL certificate"
echo "6. Deploy application"
echo ""
