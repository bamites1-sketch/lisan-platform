# 🚀 LISAN Backend - Quick Start Deployment

## Prerequisites Checklist

Before deploying, you need:

- [ ] GitHub account (for Render)
- [ ] Cloudflare account (for R2)
- [ ] Vercel account (already done - frontend is live)
- [ ] Credit card for Render ($14/month)

---

## Three-Step Deployment

### 1️⃣ Setup Cloudflare R2 (15 minutes)

**Go to Cloudflare dashboard:**
1. Create R2 bucket named `lisan-storage`
2. Create API token with Read & Write permissions
3. **Save these 5 values:**
   ```
   R2_ACCOUNT_ID=abc123...
   R2_ACCESS_KEY_ID=def456...
   R2_SECRET_ACCESS_KEY=ghi789...
   R2_BUCKET_NAME=lisan-storage
   R2_ENDPOINT=https://abc123...r2.cloudflarestorage.com
   ```

**Full guide:** `CLOUDFLARE_R2_SETUP.md`

---

### 2️⃣ Deploy to Render (20 minutes)

**Go to render.com:**

#### A. Create Database
1. New + → PostgreSQL
2. Name: `lisan-db`
3. Plan: Starter ($7/month)
4. Create

#### B. Create Web Service
1. New + → Web Service
2. Connect GitHub repo
3. Root Directory: `readpath-backend`
4. Build: `npm install && npx prisma generate && npm run build`
5. Start: `npm run start:prod`
6. Plan: Starter ($7/month)

#### C. Add Environment Variables
```bash
NODE_ENV=production
PORT=10000
FRONTEND_URL=https://readpath-frontend.vercel.app
DATABASE_URL=[Link from database]

# Generate these with: node generate-secrets.js
JWT_SECRET=your_64_char_secret_here
JWT_REFRESH_SECRET=your_different_64_char_secret_here

# From Cloudflare R2 (Step 1)
R2_ACCOUNT_ID=your_value
R2_ACCESS_KEY_ID=your_value
R2_SECRET_ACCESS_KEY=your_value
R2_BUCKET_NAME=lisan-storage
R2_ENDPOINT=https://your_account.r2.cloudflarestorage.com

# Optional - for AI chat
GEMINI_API_KEY=your_key_if_you_have
```

#### D. Deploy & Setup Database
1. Deploy (wait 5-10 min)
2. Open Shell tab, run:
   ```bash
   npx prisma migrate deploy
   node dist/create-admin.js
   ```

**Full guide:** `RENDER_DEPLOYMENT_GUIDE.md`

---

### 3️⃣ Update Vercel (2 minutes)

**Go to vercel.com:**
1. Open `readpath-frontend` project
2. Settings → Environment Variables
3. Update `VITE_API_URL`:
   ```
   VITE_API_URL=https://lisan-backend.onrender.com
   ```
   *(Replace with YOUR actual Render URL)*
4. Deployments → Redeploy

---

## ✅ Verify Deployment

Test these URLs:

1. **Backend Health:**
   ```
   https://your-app.onrender.com/health
   ```
   Should return: `{"status":"ok"}`

2. **Frontend:**
   ```
   https://readpath-frontend.vercel.app
   ```
   Should load and you can login

3. **End-to-End:**
   - Login as admin
   - Upload a voice recording
   - Check it plays back
   - Upload a PDF resource
   - Download it

---

## 🔥 Common Issues

### Build Fails on Render
- Check all environment variables are set
- Verify DATABASE_URL is linked
- Check build logs for missing dependencies

### R2 Upload Fails
- Verify all 5 R2 variables are correct
- Check bucket exists in Cloudflare
- Verify API token has write permissions

### Frontend Can't Connect
- Check FRONTEND_URL in Render matches exactly
- Verify VITE_API_URL in Vercel is correct
- Check CORS isn't blocking requests

---

## 💰 Monthly Cost

| Service | Cost |
|---------|------|
| Render Web | $7 |
| Render DB | $7 |
| Cloudflare R2 | $0-2 |
| Vercel | Free |
| **Total** | **$14-16** |

---

## 📚 Full Documentation

- **`CLOUDFLARE_R2_SETUP.md`** - Detailed R2 setup with screenshots
- **`RENDER_DEPLOYMENT_GUIDE.md`** - Step-by-step deployment
- **`DEPLOYMENT_COMPLETE.md`** - What was changed & why

---

## 🎯 You're Done!

After completing these 3 steps, your LISAN platform is fully deployed:

✅ Backend on Render  
✅ Frontend on Vercel  
✅ Database on Render PostgreSQL  
✅ Files on Cloudflare R2  

**Your stack is production-ready and scalable!** 🚀
