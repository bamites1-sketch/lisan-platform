# 🚀 Backend Deployment Guide

Your frontend is now live at: **https://readpath-frontend.vercel.app**

The backend needs to be deployed to: **https://lisan-backend-nl8c.onrender.com**

## 🔧 Option 1: Fix Existing Render Deployment (Recommended)

### Step 1: Update Render Database Schema

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Find service**: `lisan-backend-nl8c`
3. **Go to Shell tab**
4. **Run these commands**:

```bash
# Navigate to project directory
cd /opt/render/project/src

# Replace the schema with PostgreSQL version
cp prisma/schema.production.prisma prisma/schema.prisma

# Generate Prisma client
npx prisma generate

# Deploy migrations
npx prisma migrate deploy

# Create admin user
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('LiSAN2026!', 12);
    const user = await prisma.user.create({
      data: {
        email: 'admin@lisan.com',
        password: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE'
      }
    });
    await prisma.admin.create({
      data: {
        userId: user.id,
        firstName: 'Admin',
        lastName: 'User'
      }
    });
    console.log('✅ Admin user created');
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('✅ Admin user already exists');
    } else {
      console.error('❌ Error:', error.message);
    }
  } finally {
    await prisma.\$disconnect();
  }
}
createAdmin();
"
```

5. **Restart the service** (click Manual Deploy)

### Step 2: Test Backend

After restart, test:
```bash
curl https://lisan-backend-nl8c.onrender.com/health
# Should return: {"status":"ok","message":"ReadPath API is running"}

curl -X POST https://lisan-backend-nl8c.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@lisan.com","password":"LiSAN2026!"}'
# Should return success with token
```

---

## 🔧 Option 2: Deploy New Backend to Render

If Option 1 doesn't work, deploy a fresh backend:

### Step 1: Create New Render Service

1. **Go to**: https://dashboard.render.com
2. **Click**: "New Web Service"
3. **Connect**: Your GitHub repository
4. **Settings**:
   - **Name**: `readpath-backend-fixed`
   - **Root Directory**: `readpath-backend`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npm run start:prod`

### Step 2: Add Environment Variables

```
NODE_ENV=production
PORT=10000
DATABASE_URL=[Auto-filled by Render PostgreSQL]
FRONTEND_URL=https://readpath-frontend.vercel.app
JWT_SECRET=a28f056f0eb23fd1fcb09f42e3967daca296dd6a8f70b70e137bd03b49a54b53c2f50b9f462bc3401fe3d3f45d331ed069d0d881ea8797ed97cc3cf6e3dc377d
JWT_REFRESH_SECRET=4fb224f78a9657e795240678728982a9b009ec8068fbb16225513c6c50520bd9d8440592eba4d8f89a5468c2119f805baad5ded748d1d54d47324b3ded62a6f5
SETUP_KEY=lisan2026
```

### Step 3: Create PostgreSQL Database

1. **Create Database**: Name it `readpath-db`
2. **Copy Database URL** to `DATABASE_URL` environment variable

### Step 4: Update Frontend

If you create a new backend with different URL:
1. Update `VITE_API_URL` in Vercel environment variables
2. Redeploy frontend

---

## 🔧 Option 3: Quick Deploy to Vercel (Alternative)

Deploy backend to Vercel as serverless function:

### Step 1: Prepare Backend for Vercel

```bash
cd readpath-backend

# Install Vercel CLI if not installed
npm install -g vercel

# Deploy
vercel --prod
```

### Step 2: Update Frontend API URL

Update Vercel environment variable `VITE_API_URL` to your new Vercel backend URL.

---

## 🧪 Testing After Deployment

Once backend is deployed and working:

1. **Test Backend Health**:
   ```
   curl https://your-backend-url.com/health
   ```

2. **Test Login**:
   ```
   curl -X POST https://your-backend-url.com/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@lisan.com","password":"LiSAN2026!"}'
   ```

3. **Test Website**:
   - Go to: https://readpath-frontend.vercel.app
   - Login with: admin@lisan.com / LiSAN2026!
   - Should work without "service unavailable" error

---

## 🎯 Current Status

✅ **Frontend**: Deployed and working at https://readpath-frontend.vercel.app
❌ **Backend**: Needs database fix at https://lisan-backend-nl8c.onrender.com
🔑 **Admin Credentials**: admin@lisan.com / LiSAN2026!

---

## 💡 Need Help?

If you get stuck:
1. Check Render service logs for errors
2. Verify all environment variables are set
3. Make sure PostgreSQL database is connected
4. Test each step individually

The local version works perfectly, so we just need to replicate that setup in production!