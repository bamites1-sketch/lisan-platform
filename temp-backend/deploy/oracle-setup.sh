#!/bin/bash
# Oracle Cloud VM Setup Script for LiSAN Backend
# Run this on a fresh Oracle Cloud Ubuntu 22.04 VM (Always Free tier)

set -e

echo "=========================================="
echo "LiSAN Backend - Oracle Cloud Setup"
echo "=========================================="

# Update system
echo "→ Updating system packages..."
sudo apt-get update
sudo apt-get upgrade -y

# Install Node.js 20.x
echo "→ Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 15
echo "→ Installing PostgreSQL 15..."
sudo apt-get install -y postgresql postgresql-contrib

# Install Nginx
echo "→ Installing Nginx..."
sudo apt-get install -y nginx

# Install PM2 globally
echo "→ Installing PM2 process manager..."
sudo npm install -g pm2

# Install Git
echo "→ Installing Git..."
sudo apt-get install -y git

# Configure firewall
echo "→ Configuring firewall..."
sudo apt-get install -y ufw
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw --force enable

echo "=========================================="
echo "✅ System setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run: sudo -u postgres psql"
echo "2. Create database: CREATE DATABASE lisan;"
echo "3. Create user: CREATE USER lisan WITH PASSWORD 'your_password';"
echo "4. Grant privileges: GRANT ALL PRIVILEGES ON DATABASE lisan TO lisan;"
echo "5. Exit psql: \\q"
echo ""
echo "Then run: ./oracle-deploy.sh"
