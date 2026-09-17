#!/bin/bash
# PostgreSQL Database Setup Script
# Creates database, user, and configures access

set -e

echo "=================================================="
echo "PostgreSQL Database Setup"
echo "=================================================="
echo ""

# Generate a strong password if not provided
DB_PASSWORD="${DB_PASSWORD:-$(openssl rand -base64 32)}"
DB_NAME="readpath_db"
DB_USER="readpath_user"

echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password: $DB_PASSWORD"
echo ""
echo "⚠️  SAVE THIS PASSWORD - You'll need it for DATABASE_URL"
echo ""

# Create PostgreSQL user and database
sudo -u postgres psql <<EOF
-- Create user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';

-- Create database
CREATE DATABASE $DB_NAME OWNER $DB_USER;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;

-- Connect to database and grant schema privileges
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;

-- Show databases
\l
EOF

echo ""
echo "✓ Database setup complete!"
echo ""
echo "Your DATABASE_URL is:"
echo "postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
echo ""

# Secure PostgreSQL - only allow local connections
echo "Configuring PostgreSQL for local access only..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

echo "✓ PostgreSQL secured - only localhost connections allowed"
echo ""

# Block external PostgreSQL access
sudo ufw delete allow 5432/tcp 2>/dev/null || true
echo "✓ Firewall configured - PostgreSQL not accessible from outside"
echo ""
