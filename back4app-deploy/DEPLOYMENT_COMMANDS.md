# 🔧 LISAN Deployment - All Commands & URLs

Quick reference for all commands and URLs you'll need.

---

## 🔗 Important URLs

### Services
- **Cloudflare Dashboard:** https://dash.cloudflare.com/
- **Render Dashboard:** https://render.com/
- **Vercel Dashboard:** https://vercel.com/dashboard
- **Gemini API Key:** https://aistudio.google.com/apikey (optional)

### Your Live Sites
- **Frontend:** https://readpath-frontend.vercel.app
- **Backend:** https://YOUR-SERVICE-NAME.onrender.com (after deployment)

---

## 💻 Local Commands

### Generate JWT Secrets
```bash
cd readpath-backend
node generate-secrets.js
```

### Test Build Locally (optional)
```bash
cd readpath-backend
npm install
npm run build
```

### Test Development Server (optional)
```bash
cd readpath-backend
npm run dev
```

---

## 🐚 Render Shell Commands

After deployment, open Shell tab in Render and run these:

### Run Database Migrations
```bash
npx prisma migrate deploy
```

### Create Admin User
```bash
node dist/create-admin.js
```

### View Database (optional)
```bash
npx prisma studio
```

### Check Environment Variables (optional)
```bash
env | grep -E '(DATABASE|R2|JWT|FRONTEND)'
```

### View Logs (optional)
```bash
pm2 logs
```

---

## 📋 Environment Variables Template

Copy this to Render (replace values):

```bash
# Basic
NODE_ENV=production
PORT=10000

# Frontend
FRONTEND_URL=https://readpath-frontend.vercel.app

# Database (link from Render database)
DATABASE_URL=postgresql://user:pass@host:port/db

# Security (generate with: node generate-secrets.js)
JWT_SECRET=your_generated_64_char_secret_here
JWT_REFRESH_SECRET=your_generated_different_64_char_secret_here

# Cloudflare R2 (from Cloudflare dashboard)
R2_ACCOUNT_ID=your_32_char_account_id
R2_ACCESS_KEY_ID=your_access_key_from_api_token
R2_SECRET_ACCESS_KEY=your_secret_key_from_api_token
R2_BUCKET_NAME=lisan-storage
R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com

# Optional - Gemini AI
GEMINI_API_KEY=your_gemini_api_key_if_you_have
GEMINI_MODEL=gemini-2.0-flash-exp
```

---

## 🧪 Health Check Commands

### Backend Health
```bash
curl https://your-backend.onrender.com/health
```

Expected response:
```json
{"status":"ok","message":"ReadPath API is running"}
```

### Test Auth Endpoint
```bash
curl https://your-backend.onrender.com/api/auth/health
```

### Test With Authentication (after logging in)
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-backend.onrender.com/api/students
```

---

## 🔍 Debugging Commands

### View Recent Logs
In Render dashboard → Logs tab, or via Shell:
```bash
pm2 logs --lines 50
```

### Check Database Connection
```bash
node -e "const { PrismaClient } = require('@prisma/client'); \
  const prisma = new PrismaClient(); \
  prisma.$connect().then(() => console.log('✅ Connected')).catch(e => console.error('❌ Failed:', e));"
```

### Test R2 Connection (if issues)
```bash
node -e "console.log('R2 Config:', { \
  accountId: process.env.R2_ACCOUNT_ID?.substring(0,8) + '...', \
  bucketName: process.env.R2_BUCKET_NAME, \
  endpointSet: !!process.env.R2_ENDPOINT \
});"
```

### List Environment Variables
```bash
env | sort
```

---

## 🗄️ Database Commands

### View All Tables
```bash
npx prisma db pull
npx prisma studio
```

### Count Records
```bash
node -e "const { PrismaClient } = require('@prisma/client'); \
  const prisma = new PrismaClient(); \
  prisma.user.count().then(count => console.log('Users:', count));"
```

### Backup Database (Render dashboard)
- Go to your database
- Click "Backups" tab
- Click "Create Backup"

### Restore Database (Render dashboard)
- Go to your database
- Click "Backups" tab
- Select backup → Restore

---

## 🔄 Redeployment Commands

### Trigger Redeploy (via git)
```bash
git add .
git commit -m "Update backend"
git push origin main
```

Render will auto-deploy on push to main branch.

### Manual Deploy (Render dashboard)
- Go to your web service
- Click "Manual Deploy"
- Select branch
- Click "Deploy"

### Clear Build Cache (if needed)
In Render dashboard:
- Settings → Build & Deploy
- Click "Clear Build Cache"
- Manual Deploy

---

## 📊 Monitoring Commands

### Check Service Status
```bash
curl -I https://your-backend.onrender.com/health
```

### View Response Times
In Render dashboard → Metrics tab

### Check Disk Usage
```bash
df -h
```

### Check Memory Usage
```bash
free -m
```

### View Active Connections
```bash
netstat -an | grep :10000
```

---

## 🔐 Security Commands

### Generate New JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Hash Password Manually (if needed)
```bash
node -e "const bcrypt = require('bcrypt'); \
  bcrypt.hash('your_password', 10).then(hash => console.log(hash));"
```

### Check SSL Certificate
```bash
curl -vI https://your-backend.onrender.com 2>&1 | grep -E '(SSL|TLS|certificate)'
```

---

## 📁 File Storage Commands

### Test R2 Upload (via API)
```bash
# Upload test file
curl -X POST https://your-backend.onrender.com/api/recordings/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@test.wav" \
  -F "passageTitle=Test Recording"
```

### List R2 Files (if needed - requires AWS CLI)
```bash
# Install: brew install awscli (Mac) or choco install awscli (Windows)
aws s3 ls s3://lisan-storage --endpoint-url=$R2_ENDPOINT
```

---

## 🚨 Emergency Commands

### Restart Service (Render dashboard)
- Go to web service
- Click "Manual Deploy" → "Clear Build Cache + Deploy"

### Rollback Deployment (Render dashboard)
- Go to web service
- Click "Events" tab
- Find previous successful deploy
- Click "Redeploy"

### Force Database Reconnect
```bash
npx prisma generate && npx prisma db push
```

### Check for Database Locks
```bash
node -e "const { PrismaClient } = require('@prisma/client'); \
  const prisma = new PrismaClient(); \
  prisma.\$queryRaw\`SELECT * FROM pg_stat_activity WHERE state = 'active';\` \
  .then(console.log);"
```

---

## 📞 Support Links

### Render Docs
- https://render.com/docs

### Cloudflare R2 Docs
- https://developers.cloudflare.com/r2/

### Prisma Docs
- https://www.prisma.io/docs

### Express.js Docs
- https://expressjs.com/

---

## 🎯 Quick Troubleshooting

### "Cannot connect to database"
```bash
# Check DATABASE_URL is set
echo $DATABASE_URL

# Test connection
npx prisma db pull
```

### "R2 upload failed"
```bash
# Check R2 variables
env | grep R2

# Verify bucket exists in Cloudflare dashboard
```

### "CORS error from frontend"
```bash
# Check FRONTEND_URL matches exactly
echo $FRONTEND_URL

# Should be: https://readpath-frontend.vercel.app (no trailing slash)
```

### "Build fails"
```bash
# Clear cache and rebuild
# In Render: Settings → Clear Build Cache → Deploy
```

---

## ✅ Post-Deployment Verification

Run these in order:

1. **Health check:**
   ```bash
   curl https://your-backend.onrender.com/health
   ```

2. **Login test:**
   Visit frontend and login

3. **Upload test:**
   Upload a voice recording

4. **Database test:**
   ```bash
   npx prisma studio
   ```

5. **R2 test:**
   Play back a recording

---

## 📝 Notes

- Save all commands you use for future reference
- Document any custom modifications
- Keep environment variables backed up securely
- Set up monitoring alerts in Render
- Schedule regular database backups

**Keep this file handy for maintenance!**
