# LiSAN Deployment - Final Steps

## ✅ Backend Status
**DEPLOYED & RUNNING:** https://lisan-backend-nl8c.onrender.com

## 🔄 Manual Steps Required

### Step 1: Database Migration
1. Go to https://dashboard.render.com
2. Click your `lisan-backend-nl8c` service
3. Click "Shell" tab
4. Run: `npx prisma migrate deploy`

### Step 2: Add Environment Variable
1. In Render dashboard, go to "Environment" tab
2. Add variable:
   - **Key:** `SETUP_KEY`
   - **Value:** `lisan2026`
3. Click "Save Changes" (restarts service)

### Step 3: Create Admin User
Run this command in your terminal:
```bash
curl -X POST https://lisan-backend-nl8c.onrender.com/api/setup/create-admin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@lisan.com",
    "password": "LiSAN2026!",
    "firstName": "Admin",
    "lastName": "User",
    "setupKey": "lisan2026"
  }'
```

### Step 4: Deploy Frontend
1. Go to https://vercel.com/dashboard
2. Click "New Project" → Import from GitHub
3. **IMPORTANT:** Set Root Directory to `readpath-frontend`
4. Add environment variable:
   - **Key:** `VITE_API_URL` 
   - **Value:** `https://lisan-backend-nl8c.onrender.com`
5. Deploy

## 🎯 Final Result
- **Backend:** https://lisan-backend-nl8c.onrender.com
- **Frontend:** Will be https://your-project.vercel.app
- **Admin Login:** admin@lisan.com / LiSAN2026!

## 🧪 Test Backend
```bash
curl https://lisan-backend-nl8c.onrender.com/health
```
Should return: `{"status":"ok","message":"ReadPath API is running"}`