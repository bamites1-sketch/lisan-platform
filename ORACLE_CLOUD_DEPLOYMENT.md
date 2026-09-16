# 🎓 LiSAN Platform - Oracle Cloud Free Tier Deployment Guide

**Complete $0/month deployment using Oracle Cloud Always Free resources**

```
Architecture:
┌─────────────┐
│   Vercel    │  ← React Frontend (Free)
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│     Oracle Cloud VM (Free Tier)     │
│  ┌──────────────────────────────┐   │
│  │   Nginx (Reverse Proxy)      │   │
│  └────────────┬─────────────────┘   │
│               ▼                      │
│  ┌──────────────────────────────┐   │
│  │   Node.js / Express          │   │
│  │   (PM2 Process Manager)      │   │
│  └────────────┬─────────────────┘   │
│               ▼                      │
│  ┌──────────────────────────────┐   │
│  │   PostgreSQL Database        │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
       │
       ▼
┌─────────────────────────────────────┐
│  Oracle Object Storage (20GB Free)  │
│  • Audio recordings                 │
│  • Payment receipts                 │
│  • PDF resources                    │
└─────────────────────────────────────┘
```

---

## 📋 Prerequisites

- Oracle Cloud account ([signup.cloud.oracle.com](https://signup.cloud.oracle.com))
- Vercel account ([vercel.com](https://vercel.com))
- GitHub account
- SSH client (Windows: PuTTY, Mac/Linux: built-in terminal)

---

## Phase 1: Create Oracle Cloud VM (5 minutes)

### 1.1 — Create Compute Instance

1. Log in to Oracle Cloud Console
2. Navigate to **Compute** → **Instances** → **Create Instance**

**Configuration:**
- **Name:** `lisan-backend`
- **Compartment:** (root) or create new
- **Placement:** Leave default
- **Image:** `Canonical Ubuntu 22.04` (Always Free eligible)
- **Shape:** 
  - Click "Change Shape"
  - Select **VM.Standard.A1.Flex** (Ampere, ARM-based)
  - **OCPUs:** 2 (Always Free: up to 4 OCPUs total)
  - **Memory:** 12 GB (Always Free: up to 24 GB total)
- **Networking:**
  - Create new VCN: `lisan-vcn`
  - Create new subnet: `lisan-subnet`
  - **Assign public IP:** Yes ✓
- **SSH Keys:**
  - Select "Generate SSH key pair"
  - Download both **private key** and **public key**
  - Save as `lisan-oracle.key` and `lisan-oracle.key.pub`

3. Click **Create**
4. Wait ~60 seconds for provisioning
5. Copy the **Public IP Address** (e.g., `129.159.x.x`)

### 1.2 — Configure Firewall Rules

Still in Oracle Console:

1. Go to **Networking** → **Virtual Cloud Networks** → `lisan-vcn`
2. Click **Security Lists** → **Default Security List**
3. Click **Add Ingress Rules** and add these:

| Source CIDR | Protocol | Destination Port | Description |
|-------------|----------|------------------|-------------|
| `0.0.0.0/0` | TCP | `80` | HTTP |
| `0.0.0.0/0` | TCP | `443` | HTTPS |
| `0.0.0.0/0` | TCP | `22` | SSH |

4. Click **Add Ingress Rules**

---

## Phase 2: SSH into VM and Install Software (10 minutes)

### 2.1 — Connect via SSH

**Windows (PowerShell):**
```powershell
# Set key permissions (right-click key file → Properties → Security → Advanced → Disable inheritance)
ssh -i lisan-oracle.key ubuntu@YOUR_VM_PUBLIC_IP
```

**Mac/Linux:**
```bash
chmod 400 lisan-oracle.key
ssh -i lisan-oracle.key ubuntu@YOUR_VM_PUBLIC_IP
```

### 2.2 — Run Setup Script

Once connected to the VM:

```bash
# Download setup script
wget https://raw.githubusercontent.com/bamites1-sketch/lisan-platform/main/readpath-backend/deploy/oracle-setup.sh

# Make executable
chmod +x oracle-setup.sh

# Run setup
./oracle-setup.sh
```

This installs:
- Node.js 20
- PostgreSQL 15
- Nginx
- PM2
- Git
- Configures firewall (ufw)

**Expected time:** ~5 minutes

### 2.3 — Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In psql prompt:
CREATE DATABASE lisan;
CREATE USER lisan WITH PASSWORD 'your_strong_password_here';
GRANT ALL PRIVILEGES ON DATABASE lisan TO lisan;
\q
```

**Save this password** — you'll need it for the `.env` file.

---

## Phase 3: Oracle Object Storage Setup (5 minutes)

### 3.1 — Create Bucket

1. In Oracle Console → **Storage** → **Object Storage** → **Buckets**
2. Click **Create Bucket**
   - **Name:** `lisan-storage`
   - **Storage Tier:** Standard
   - **Encryption:** Oracle-managed keys
3. Click **Create**

### 3.2 — Generate Access Keys

1. Click your **Profile Icon** (top-right) → **My Profile**
2. Under **Resources** → **Customer Secret Keys**
3. Click **Generate Secret Key**
   - **Name:** `lisan-backend-key`
4. Copy and save:
   - **Access Key** (shows immediately)
   - **Secret Key** (shows only once — download/copy now!)

### 3.3 — Get Namespace

1. Go to **Tenancy Details** (Profile Icon → Tenancy: your-tenancy-name)
2. Copy **Object Storage Namespace** (e.g., `axwhatever123`)
3. Note your **Region** (e.g., `us-ashburn-1`)

---

## Phase 4: Deploy Backend Application (5 minutes)

### 4.1 — Clone and Configure

Back in your SSH session:

```bash
# Clone repository
cd /home/ubuntu
git clone https://github.com/bamites1-sketch/lisan-platform.git lisan-backend
cd lisan-backend/readpath-backend

# Copy production schema
cp prisma/schema.production.prisma prisma/schema.prisma

# Create .env file
cp deploy/.env.oracle.template .env
nano .env
```

### 4.2 — Fill in .env Values

```bash
DATABASE_URL="postgresql://lisan:YOUR_DB_PASSWORD@localhost:5432/lisan"
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://readpath-frontend.vercel.app

# Generate these in Node.js:
# node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
JWT_SECRET=YOUR_GENERATED_SECRET
JWT_REFRESH_SECRET=YOUR_GENERATED_SECRET_2

# Get from https://aistudio.google.com/apikey
GEMINI_API_KEY=YOUR_GEMINI_KEY
GEMINI_MODEL=gemini-2.0-flash-exp

# Oracle Object Storage (from Phase 3)
OCI_REGION=us-ashburn-1
OCI_NAMESPACE=YOUR_NAMESPACE_FROM_PHASE_3
OCI_BUCKET_NAME=lisan-storage
OCI_ACCESS_KEY_ID=YOUR_ACCESS_KEY_FROM_PHASE_3
OCI_SECRET_ACCESS_KEY=YOUR_SECRET_KEY_FROM_PHASE_3

# Setup key (any random string)
SETUP_KEY=lisan-setup-2026-xyz
```

**Save:** `Ctrl+O`, `Enter`, `Ctrl+X`

### 4.3 — Build and Deploy

```bash
# Install dependencies
npm install --production

# Generate Prisma client
npx prisma generate

# Build TypeScript
npm run build

# Run migrations
npx prisma migrate deploy

# Start with PM2
pm2 start dist/server.js --name lisan-backend --env production
pm2 save
pm2 startup  # Follow the sudo command it outputs
```

### 4.4 — Configure Nginx

```bash
# Copy nginx config
sudo cp deploy/nginx-lisan.conf /etc/nginx/sites-available/lisan

# Enable site
sudo ln -sf /etc/nginx/sites-available/lisan /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and restart
sudo nginx -t
sudo systemctl restart nginx
```

### 4.5 — Test Backend

```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs lisan-backend --lines 50

# Test health endpoint
curl http://localhost/health
```

You should see: `{"status":"ok","message":"ReadPath API is running"}`

**Get your public URL:**
```bash
echo "Your backend URL: http://$(curl -s ifconfig.me)"
```

---

## Phase 5: Create Admin User

### Option A — Via API (Recommended)

```bash
curl -X POST http://YOUR_VM_PUBLIC_IP/api/setup/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourschool.com",
    "password": "YourStrongPassword123!",
    "firstName": "Admin",
    "lastName": "User",
    "setupKey": "lisan-setup-2026-xyz"
  }'
```

### Option B — Via Script

```bash
cd /home/ubuntu/lisan-backend/readpath-backend
node create-admin.js
# Follow interactive prompts
```

---

## Phase 6: Deploy Frontend on Vercel (3 minutes)

The frontend is already connected to Vercel. You just need to update the API URL:

1. Go to [vercel.com](https://vercel.com) → **readpath-frontend** project
2. **Settings** → **Environment Variables**
3. Add/update:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `http://YOUR_VM_PUBLIC_IP` |

4. Set for: **Production**, **Preview**, **Development**
5. Go to **Deployments** → Click latest → **Redeploy**

**Wait ~2 minutes for build.**

---

## Phase 7: Verification Checklist

| Test | URL/Command | Expected Result |
|------|-------------|-----------------|
| **Backend health** | `curl http://YOUR_IP/health` | `{"status":"ok"}` |
| **Frontend loads** | `https://readpath-frontend.vercel.app` | Login page |
| **Admin login** | Login with your admin credentials | Dashboard loads |
| **File upload test** | Create student → Upload recording | No errors |
| **PM2 status** | `pm2 status` | `online` status |
| **Nginx status** | `sudo systemctl status nginx` | `active (running)` |
| **PostgreSQL** | `sudo systemctl status postgresql` | `active (running)` |

---

## 🎉 Deployment Complete!

Your platform is now running:

- **Frontend:** `https://readpath-frontend.vercel.app`
- **Backend:** `http://YOUR_VM_IP`
- **Database:** PostgreSQL on VM (local)
- **File Storage:** Oracle Object Storage

### Cost Breakdown

| Service | Tier | Monthly Cost |
|---------|------|--------------|
| Oracle VM (2 OCPU, 12GB RAM) | Always Free | **$0** |
| Oracle PostgreSQL (on VM) | Always Free | **$0** |
| Oracle Object Storage (20GB) | Always Free | **$0** |
| Vercel Frontend | Hobby | **$0** |
| **Total** | | **$0** 🎉 |

---

## 📊 Management Commands

### PM2 Commands
```bash
pm2 status              # Check status
pm2 logs lisan-backend  # View logs
pm2 restart lisan-backend  # Restart app
pm2 stop lisan-backend  # Stop app
pm2 start lisan-backend # Start app
```

### Nginx Commands
```bash
sudo systemctl status nginx   # Check status
sudo systemctl restart nginx  # Restart
sudo nginx -t                 # Test config
sudo tail -f /var/log/nginx/lisan-access.log  # View access logs
sudo tail -f /var/log/nginx/lisan-error.log   # View error logs
```

### Database Commands
```bash
sudo -u postgres psql lisan   # Connect to DB
\dt                           # List tables
\q                            # Quit
```

### Update Application
```bash
cd /home/ubuntu/lisan-backend
git pull origin main
cd readpath-backend
npm install --production
npm run build
npx prisma migrate deploy
pm2 restart lisan-backend
```

---

## 🔒 Optional: Set Up HTTPS (Let's Encrypt)

To use a custom domain with HTTPS:

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate (replace your-domain.com)
sudo certbot --nginx -d your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

Update Vercel env var:
- `VITE_API_URL` → `https://your-domain.com`

---

## 🆘 Troubleshooting

### Backend won't start
```bash
pm2 logs lisan-backend --lines 100
# Check for database connection errors, missing env vars
```

### Can't connect to backend from frontend
```bash
# Check firewall
sudo ufw status
# Should show: 80/tcp ALLOW, 443/tcp ALLOW

# Check nginx
sudo systemctl status nginx
sudo nginx -t
```

### Database connection error
```bash
# Test PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql -c "SELECT 1;"

# Check .env DATABASE_URL matches what you created
```

### File uploads fail
```bash
# Check Oracle Object Storage credentials
# Verify OCI_NAMESPACE, OCI_ACCESS_KEY_ID, OCI_SECRET_ACCESS_KEY in .env

# Test bucket access (from VM)
curl -X GET "https://${OCI_NAMESPACE}.compat.objectstorage.${OCI_REGION}.oraclecloud.com/${OCI_BUCKET_NAME}/" \
  --aws-sigv4 "aws:amz:${OCI_REGION}:s3" \
  --user "${OCI_ACCESS_KEY_ID}:${OCI_SECRET_ACCESS_KEY}"
```

---

## 📚 Additional Resources

- [Oracle Cloud Free Tier](https://www.oracle.com/cloud/free/)
- [Oracle Object Storage Docs](https://docs.oracle.com/en-us/iaas/Content/Object/home.htm)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Need help?** Check the logs first:
- Backend: `pm2 logs lisan-backend`
- Nginx: `sudo tail -f /var/log/nginx/lisan-error.log`
- System: `sudo journalctl -u lisan-backend -n 100`
