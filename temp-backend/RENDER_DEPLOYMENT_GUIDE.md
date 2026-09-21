# LISAN Backend Deployment Guide - Render + Cloudflare R2

## ✅ What's Been Done

1. **R2 Integration Complete**
   - Voice recordings → Cloudflare R2
   - Payment receipts → Cloudflare R2
   - PDF resources → Cloudflare R2
   - All files use signed URLs (secure, temporary access)
   - No local filesystem dependency

2. **Backend Code Updated**
   - PostgreSQL-ready schema
   - Memory-based multer (no disk storage)
   - R2 upload/download/delete functions
   - Secure file access with authorization

3. **Deployment Files Created**
   - `render.yaml` - Render configuration
   - `schema.production.prisma` - PostgreSQL schema
   - Build scripts updated

---

## 🚀 Deployment Steps

### Step 1: Setup Cloudflare R2 (15 minutes)

**Follow the guide in `CLOUDFLARE_R2_SETUP.md`**

You need these 5 values:
1. `R2_ACCOUNT_ID` - From Cloudflare dashboard
2. `R2_ACCESS_KEY_ID` - From API token creation
3. `R2_SECRET_ACCESS_KEY` - From API token creation  
4. `R2_BUCKET_NAME` - Your bucket name (e.g., `lisan-storage`)
5. `R2_ENDPOINT` - `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`

**⚠️ Save these immediately - the secret key only shows once!**

---

### Step 2: Deploy to Render (10 minutes)

#### A. Create Render Account
1. Go to https://render.com
2. Sign up with GitHub
3. Connect your repository

#### B. Create New Web Service
1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repo: `abu-agency`
3. **Root Directory**: `readpath-backend`
4. **Environment**: `Node`
5. **Build Command**: `npm install && npx prisma generate && npm run build`
6. **Start Command**: `npm run start:prod`
7. **Plan**: `Starter` ($7/month)

#### C. Add Environment Variables

Click **"Environment"** and add these:

```bash
# Required - Production Settings
NODE_ENV=production
PORT=10000

# Required - Frontend URL (your Vercel deployment)
FRONTEND_URL=https://readpath-frontend.vercel.app

# Required - JWT Secrets (generate secure random strings)
JWT_SECRET=<GENERATE_SECURE_64_CHAR_STRING>
JWT_REFRESH_SECRET=<GENERATE_DIFFERENT_64_CHAR_STRING>

# Required - Cloudflare R2 (from Step 1)
R2_ACCOUNT_ID=your_account_id_from_cloudflare
R2_ACCESS_KEY_ID=your_access_key_from_cloudflare
R2_SECRET_ACCESS_KEY=your_secret_key_from_cloudflare
R2_BUCKET_NAME=lisan-storage
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com

# Optional - Gemini AI (for chat features)
GEMINI_API_KEY=your_gemini_key_if_you_have_one
GEMINI_MODEL=gemini-2.0-flash-exp

# DATABASE_URL - Will be auto-added when you create the database
```

**To generate secure JWT secrets:**
```bash
# On Windows PowerShell:
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 64 | % {[char]$_})
```

#### D. Create PostgreSQL Database
1. In your Render dashboard, click **"New +"** → **"PostgreSQL"**
2. **Name**: `lisan-db`
3. **Database**: `lisan`
4. **User**: `lisan`
5. **Plan**: `Starter` ($7/month)
6. Click **"Create Database"**

#### E. Link Database to Web Service
1. Go back to your web service
2. Click **"Environment"**
3. Add `DATABASE_URL`:
   - Click **"Add from Database"**
   - Select `lisan-db`
   - Choose **"Internal Database URL"** (faster, free bandwidth)

#### F. Deploy
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Watch the logs for errors

---

### Step 3: Run Database Migrations

After deployment succeeds:

1. Go to your web service in Render
2. Click **"Shell"** tab
3. Run:
```bash
npx prisma migrate deploy
```

This creates all database tables.

---

### Step 4: Create First Admin User

In the Render Shell, run:

```bash
node dist/create-admin.js
```

Follow prompts to create your admin account.

---

### Step 5: Update Vercel Frontend

1. Go to https://vercel.com/dashboard
2. Open your `readpath-frontend` project
3. Go to **Settings** → **Environment Variables**
4. Update `VITE_API_URL`:

```bash
VITE_API_URL=https://lisan-backend.onrender.com
```

**Replace `lisan-backend` with YOUR actual Render service name**

5. Go to **Deployments** → Click **"..."** → **"Redeploy"**

---

## ✅ Verification Checklist

Test these after deployment:

### Backend Health
- [ ] Visit `https://your-app.onrender.com/health`
- [ ] Should return `{"status":"ok","message":"ReadPath API is running"}`

### Authentication
- [ ] Login as admin at frontend
- [ ] Check you can access admin dashboard
- [ ] Verify JWT tokens work

### File Uploads
- [ ] Student uploads a voice recording
- [ ] Check recording appears in teacher/admin dashboard
- [ ] Click to play recording (should generate signed URL)
- [ ] Admin uploads a PDF resource
- [ ] Student can download the PDF
- [ ] Admin uploads payment receipt
- [ ] Admin can view payment receipts

### Database
- [ ] Create a student account
- [ ] Create an assessment
- [ ] Submit an assessment
- [ ] View notifications
- [ ] Check all data persists after restart

---

## 🔥 Important Notes

### Render Free Tier Limitation
- **Free instances sleep after 15 minutes of inactivity**
- First request after sleep takes 30-50 seconds
- **Starter plan ($7/month) stays always-on**

### R2 Costs
- **10GB free storage** per month
- **Zero egress fees** (unlike AWS S3)
- Typical cost: **$0-2/month** for small school

### Database Backups
- Render Starter PostgreSQL includes daily backups
- Keep 7 days of backups
- Can restore any time

### Security
- All file URLs expire after 1 hour
- Files are private by default
- Only authenticated users can access
- No hardcoded secrets anywhere

---

## 🐛 Troubleshooting

### Build Fails
```bash
# Check node version in render.yaml matches package.json
# Render uses Node 20 by default
```

### Database Connection Errors
```bash
# Ensure DATABASE_URL is set correctly
# Check database is in same region as web service
# Verify database is running
```

### R2 Upload Fails
```bash
# Verify all 5 R2 environment variables are set
# Check R2 bucket exists
# Verify API token has read/write permissions
# Test R2 credentials in Cloudflare dashboard
```

### CORS Errors
```bash
# Verify FRONTEND_URL matches your Vercel domain exactly
# Include https://
# No trailing slash
```

---

## 📊 Your Deployment URLs

After deployment, you'll have:

**Frontend**: https://readpath-frontend.vercel.app  
**Backend**: https://YOUR-SERVICE-NAME.onrender.com  
**Database**: Internal PostgreSQL (not public)  
**File Storage**: Cloudflare R2 (not public)

---

## 💰 Monthly Costs

| Service | Plan | Cost |
|---------|------|------|
| Render Web Service | Starter | $7 |
| Render PostgreSQL | Starter | $7 |
| Cloudflare R2 | Pay-as-you-go | $0-2 |
| Vercel | Hobby | Free |
| **Total** | | **~$14-16/month** |

---

## 🎯 Next Steps After Deployment

1. Create your first admin account
2. Add student/teacher test accounts
3. Upload sample content (passages, assessments)
4. Test voice recording end-to-end
5. Test payment submission flow
6. Set up monitoring (Render provides basic monitoring)
7. Configure custom domain (optional)

---

## 📞 Support

If deployment fails:
1. Check Render logs in dashboard
2. Verify all environment variables are set
3. Confirm R2 credentials are correct
4. Test database connection
5. Check frontend CORS settings

The backend is ready to deploy! Follow this guide step by step.
