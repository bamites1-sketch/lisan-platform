# Deploy ReadPath Backend to Render

## Quick Deploy Steps

### 1. Push Your Code to GitHub

```bash
cd readpath-backend
git add .
git commit -m "Prepare backend for Render deployment"
git push
```

### 2. Create Render Account & New Web Service

1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (`lisan-platform`)
4. Configure the service:

   **Basic Settings:**
   - **Name:** `readpath-backend`
   - **Region:** Oregon (US West) or closest to you
   - **Branch:** `main`
   - **Root Directory:** `readpath-backend`  ← **IMPORTANT**
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npm start`

   **Plan:**
   - Select **Free** tier (you can upgrade later)

### 3. Set Up PostgreSQL Database

**Option A: Render PostgreSQL (Recommended)**

1. In Render Dashboard, click **"New +"** → **"PostgreSQL"**
2. Configure:
   - **Name:** `readpath-db`
   - **Database:** `readpath`
   - **User:** `readpath_user`
   - **Region:** Same as your web service
   - **Plan:** Free
3. Click **"Create Database"**
4. Copy the **Internal Database URL** (looks like `postgresql://user:pass@host/db`)

**Option B: External PostgreSQL (Railway, Supabase, etc.)**

Use any PostgreSQL provider and get your connection string.

### 4. Configure Environment Variables

In your Render web service dashboard, go to **Environment** tab and add:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Required |
| `PORT` | `5000` | Auto-set by Render usually |
| `DATABASE_URL` | `postgresql://user:pass@host/db` | Your PostgreSQL connection string |
| `JWT_SECRET` | `your-super-secret-jwt-key-change-this` | Generate a strong random string |
| `JWT_REFRESH_SECRET` | `your-super-secret-refresh-key-different` | Different from JWT_SECRET |
| `FRONTEND_URL` | `https://readpath-frontend.vercel.app` | Your frontend URL (comma-separated for multiple) |
| `GEMINI_API_KEY` | `your-gemini-api-key` | From https://aistudio.google.com/apikey |
| `GEMINI_MODEL` | `gemini-3.5-flash` | Optional, defaults to this |

**Important:** Click **"Save Changes"** after adding all variables.

### 5. Update Database Schema for PostgreSQL

Your current schema uses SQLite. For production with PostgreSQL:

**Option 1: Use the production schema (Recommended)**

```bash
# In readpath-backend directory
cp prisma/schema.production.prisma prisma/schema.prisma
git add prisma/schema.prisma
git commit -m "Switch to PostgreSQL schema for production"
git push
```

Render will automatically redeploy.

**Option 2: Manual Migration**

After deploying, run migrations:

```bash
# In Render dashboard, open "Shell" tab
npx prisma migrate deploy
```

### 6. Create Initial Admin User

After deployment, access the Render Shell:

1. Go to your service dashboard
2. Click **"Shell"** tab
3. Run:

```bash
node create-admin.js
```

Or use the `/api/setup` endpoint (one-time only):

```bash
curl -X POST https://readpath-backend.onrender.com/api/setup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "firstName": "Admin",
    "lastName": "User"
  }'
```

### 7. Test Your Deployment

```bash
# Health check
curl https://readpath-backend.onrender.com/health

# Should return: {"status":"ok","message":"ReadPath API is running"}
```

### 8. Update Frontend to Use Production Backend

Update your frontend environment variables (Vercel):

```
VITE_API_URL=https://readpath-backend.onrender.com
```

Or whatever your Render URL is.

---

## Your Backend URL

After deployment, your backend will be accessible at:

**🔗 https://readpath-backend.onrender.com**

(Or custom domain if you configure one)

---

## Important Notes

### Free Tier Limitations

- **Cold Starts:** Free tier services spin down after 15 minutes of inactivity
- First request after inactivity may take 30-60 seconds
- **Database:** Free PostgreSQL has 1GB storage limit
- **Automatic Deploys:** Enabled by default on push to main branch

### Upgrade for Production

For production use, consider:
- **Starter Plan** ($7/month): No cold starts, custom domains
- **PostgreSQL Standard** ($7/month): 10GB storage, daily backups

### File Uploads

⚠️ **Important:** Render's free tier uses ephemeral storage. Uploaded files (audio recordings, PDFs) will be deleted on each deploy.

**Solutions:**
1. Use **Render Disks** (Paid plans)
2. Use **Cloud Storage:** AWS S3, Cloudflare R2, or Supabase Storage
3. Use **Vercel Blob Storage** for file uploads

---

## Troubleshooting

### Build Fails

Check **Logs** tab in Render dashboard. Common issues:
- Missing environment variables
- TypeScript compilation errors
- Prisma schema issues

### Database Connection Errors

- Verify `DATABASE_URL` is set correctly
- Make sure you're using the **Internal Database URL** if using Render PostgreSQL
- Check database is running in Render dashboard

### App Crashes on Start

- Check **Logs** tab for error messages
- Verify all required environment variables are set
- Make sure `dist/server.js` was built successfully

---

## Alternative: Deploy to Railway

Railway is another excellent option:

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select `readpath-backend` directory
4. Railway auto-detects the `railway.toml` configuration
5. Add a PostgreSQL database from Railway marketplace
6. Set environment variables same as above
7. Deploy!

**Your URL:** `https://readpath-backend.up.railway.app`

---

## Next Steps

- [ ] Deploy backend to Render
- [ ] Set up PostgreSQL database
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Create admin user
- [ ] Update frontend API URL
- [ ] Test all endpoints
- [ ] Set up custom domain (optional)
