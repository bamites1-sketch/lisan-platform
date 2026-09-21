#!/bin/bash
# SSL Certificate Setup with Let's Encrypt
# Run this after DNS is pointing to your server

set -e

echo "=================================================="
echo "SSL Certificate Setup"
echo "=================================================="
echo ""

# Check if domain is provided
if [ -z "$1" ]; then
    echo "Usage: ./setup-ssl.sh YOUR_DOMAIN [EMAIL]"
    echo "Example: ./setup-ssl.sh api.lisanplatform.com admin@lisanplatform.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-""}

# Validate domain format
if [[ ! $DOMAIN =~ ^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo "Error: Invalid domain format"
    exit 1
fi

echo "Domain: $DOMAIN"
echo "Email: ${EMAIL:-Not provided}"
echo ""

# Check if DNS is pointing to this server
SERVER_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN | tail -n1)

echo "Server IP: $SERVER_IP"
echo "Domain resolves to: $DOMAIN_IP"
echo ""

if [ "$SERVER_IP" != "$DOMAIN_IP" ]; then
    echo "⚠️  WARNING: Domain does not point to this server!"
    echo "Please update your DNS A record to point $DOMAIN to $SERVER_IP"
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create Nginx configuration
echo "Creating Nginx configuration..."
sudo cp /var/www/readpath-backend/readpath-backend/deploy/nginx-config.template /etc/nginx/sites-available/readpath-backend
sudo sed -i "s/DOMAIN/$DOMAIN/g" /etc/nginx/sites-available/readpath-backend

# Enable site
sudo ln -sf /etc/nginx/sites-available/readpath-backend /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
echo "✓ Nginx configured"
echo ""

# Create certbot directory
sudo mkdir -p /var/www/certbot

# Obtain SSL certificate
echo "Obtaining SSL certificate from Let's Encrypt..."
if [ -n "$EMAIL" ]; then
    sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email --redirect
else
    sudo certbot --nginx -d $DOMAIN --register-unsafely-without-email --agree-tos --redirect
fi

echo ""
echo "✓ SSL certificate installed!"
echo ""

# Test certificate auto-renewal
echo "Testing certificate auto-renewal..."
sudo certbot renew --dry-run

echo ""
echo "✓ SSL setup complete!"
echo ""
echo "Your backend is now accessible at: https://$DOMAIN"
echo ""
echo "Certificate will auto-renew. Check renewal with:"
echo "sudo certbot renew --dry-run"
echo ""
