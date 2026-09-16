# ReadPath Deployment Summary

## Current Status

✅ **Frontend:** Deployed on Vercel
- URL: `https://readpath-frontend.vercel.app`
- Status: Working

⏳ **Backend:** Ready for deployment (Render recommended)
- Code: Pushed to GitHub
- Status: Awaiting deployment

---

## Quick Deploy Backend to Render

### Step 1: Go to Render

Visit: **[render.com](https://render.com)**
- Sign up or log in with GitHub

### Step 2: Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo: `bamites1-sketch/lisan-platform`
3. Click **"Connect"** next to your repository

### Step 3: Configure Service

Fill in these settings:

| Setting | Value |
|---------|-------|
| **Name** | `readpath-backend` |
| **Region** | Oregon (US West) |
| **Branch** | `main` |
| **Root Directory** | `readpath-backend` ⚠️ **IMPORTANT** |
| **Runtime** | Node |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npm start` |
| **Plan** | Free |

### Step 4: Add PostgreSQL Database

1. Click **"New +"** → **"PostgreSQL"**
2. Name: `readpath-db`
3. Plan: **Free**
4. Region: Same as web service
5. Click **"Create Database"**
6. **Copy the Internal Database URL** (you'll need it next)

### Step 5: Set Environment Variables

In your web service, go to **"Environment"** tab and add these:

```env
NODE_ENV=production
DATABASE_URL=<paste-your-postgresql-url-here>
JWT_SECRET=readpath-super-secret-jwt-key-2026-change-this
JWT_REFRESH_SECRET=readpath-super-secret-refresh-key-2026-different
FRONTEND_URL=https://readpath-frontend.vercel.app
GEMINI_API_KEY=AIzaSyAb8RN6J0-JOXIaheRy8WP1s4bNw8-KGA37lvCPahwq5KjPFIug
GEMINI_MODEL=gemini-3.5-flash
```

⚠️ **Important:** Change the JWT secrets to something more secure for production!

Click **"Save Changes"**

### Step 6: Deploy!

Click **"Create Web Service"** or **"Manual Deploy"**

Render will:
- Install dependencies
- Generate Prisma client
- Build TypeScript
- Start your server

Wait 2-3 minutes for deployment to complete.

### Step 7: Get Your Backend URL

Once deployed, Render will show your URL:

**🔗 `https://readpath-backend.onrender.com`** (or similar)

### Step 8: Test Your Backend

```bash
curl https://readpath-backend.onrender.com/health
```

Should return: `{"status":"ok","message":"ReadPath API is running"}`

### Step 9: Update Frontend

In your Vercel frontend project settings:
1. Go to **Settings** → **Environment Variables**
2. Add or update:
   ```
   VITE_API_URL=https://readpath-backend.onrender.com
   ```
3. Redeploy frontend

### Step 10: Create Admin User

Use the setup endpoint (one-time only):

```bash
curl -X POST https://readpath-backend.onrender.com/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "YourSecurePassword123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

---

## Final URLs

Once deployed, you'll have:

- **Frontend:** `https://readpath-frontend.vercel.app`
- **Backend:** `https://readpath-backend.onrender.com`

---

## Important Notes

### ⚠️ Free Tier Limitations

- **Cold starts:** Backend sleeps after 15min inactivity
- First request after sleep takes ~30-60 seconds
- **File storage:** Ephemeral (files deleted on redeploy)
- **Database:** 1GB limit on free tier

### 🚀 For Production

Consider upgrading to:
- **Render Starter:** $7/month (no cold starts)
- **PostgreSQL Standard:** $7/month (10GB + backups)

### 📦 File Uploads Solution

For production file uploads (audio, PDFs), use:
- **AWS S3** or **Cloudflare R2** (recommended)
- **Vercel Blob Storage**
- **Supabase Storage**

---

## Need Help?

- Read the detailed guide: `readpath-backend/RENDER_DEPLOYMENT.md`
- Check deployment logs in Render dashboard
- Test API endpoints with curl or Postman

---

## Alternative: Railway

If you prefer Railway over Render:

1. Go to [railway.app](https://railway.app)
2. **"New Project"** → **"Deploy from GitHub"**
3. Select `readpath-backend` folder
4. Add PostgreSQL from marketplace
5. Set same environment variables
6. Deploy!

**URL:** `https://readpath-backend.up.railway.app`

---

## Checklist

- [ ] Create Render account
- [ ] Deploy web service
- [ ] Create PostgreSQL database
- [ ] Set all environment variables
- [ ] Wait for build to complete
- [ ] Test /health endpoint
- [ ] Create admin user
- [ ] Update frontend API URL
- [ ] Test login from frontend

**Good luck with your deployment! 🚀**
