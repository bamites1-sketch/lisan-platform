# 🔍 LISAN Backend Audit Report

**Date:** $(Get-Date)  
**Purpose:** Pre-deployment cost & compatibility analysis

---

## 1️⃣ ACTUAL BACKEND FRAMEWORK & ENTRY POINT

### Framework
- **Technology:** Node.js + Express + TypeScript
- **Entry Point:** `src/server.ts`
- **Compiled Output:** `dist/server.js`
- **Port:** 5000 (configurable via PORT env var)

### Key Features
- JWT authentication
- CORS with credentials
- Rate limiting
- Helmet security headers
- Cookie parser
- Error handling middleware

### Routes
15 route modules:
- auth, students, assessments, profiles, learning, practice
- chat, parents, teachers, admin, recordings
- notifications, contact, payments, setup

---

## 2️⃣ ACTUAL DATABASE TECHNOLOGY

### Current Setup (Development)
- **Provider:** SQLite
- **File:** `prisma/dev.db` (local file)
- **ORM:** Prisma v5.7.0
- **Schema:** `prisma/schema.prisma`

### Database Configuration
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

Current DATABASE_URL: `file:./dev.db`

### ⚠️ MIGRATION REQUIRED FOR PRODUCTION

**SQLite → PostgreSQL required:**
- SQLite is file-based (not suitable for cloud hosting)
- Render needs PostgreSQL
- Schema already prepared: `prisma/schema.production.prisma`

**Changes needed:**
1. Update `schema.prisma` provider to `postgresql`
2. Update DATABASE_URL to PostgreSQL connection string
3. Run migrations

---

## 3️⃣ ACTUAL BUILD/START COMMANDS

### From package.json:

**Development:**
```bash
npm run dev
# → ts-node-dev --respawn --transpile-only src/server.ts
```

**Build:**
```bash
npm run build
# → prisma generate && tsc
```

**Production Start:**
```bash
npm run start:prod
# → NODE_ENV=production node dist/server.js
```

**Database Migrations:**
```bash
npm run prisma:migrate:prod
# → prisma migrate deploy
```

### Build Output
- TypeScript compiles to `dist/` directory
- Source maps included
- Declaration files generated

---

## 4️⃣ CAN RENDER FREE RUN THIS BACKEND?

### Render Free Tier Limitations

**✅ Technically Compatible:**
- Runs Node.js ✓
- Can run Express ✓
- Can connect to external DB ✓

**❌ CRITICAL FREE TIER ISSUES:**

1. **15-Minute Sleep** 🚫
   - Service sleeps after 15 min inactivity
   - First request after sleep: 30-50 sec cold start
   - **UNUSABLE for educational platform**
   - Students would face constant delays

2. **512MB RAM Limit** ⚠️
   - Might work but tight for:
     - Prisma client
     - File uploads (multer memory storage)
     - Multiple concurrent users
   - Could crash under load

3. **No Persistent Disk** 🚫
   - Already solved with R2
   - But SQLite dev.db won't work anyway

4. **Shared CPU** ⚠️
   - Slow performance
   - Throttled under load

### ⚠️ RECOMMENDATION: FREE TIER NOT SUITABLE

For a school platform with students submitting work, the 15-minute sleep makes the free tier **unusable** in practice.

---

## 5️⃣ WHAT WILL COST MONEY

### Option A: Minimum Cost (Recommended)

| Service | Tier | Cost/Month | Why Needed |
|---------|------|------------|------------|
| **Render Web** | Starter | **$7** | Always-on, no sleep |
| **Render PostgreSQL** | Free | **$0** | 1GB storage, 97 MB RAM |
| **Cloudflare R2** | Free tier | **$0-1** | 10GB free storage |
| **Vercel** | Hobby | **$0** | Already deployed |
| **TOTAL** | | **$7-8/month** | ✅ Best value |

**Free PostgreSQL details:**
- 1GB storage (enough for ~10k students)
- Expires after 90 days without paid service
- But renews if you have ANY paid service (web)
- No backups (manual export needed)

### Option B: Production Grade

| Service | Tier | Cost/Month | What You Get |
|---------|------|------------|--------------|
| **Render Web** | Starter | **$7** | Always-on |
| **Render PostgreSQL** | Starter | **$7** | Daily backups |
| **Cloudflare R2** | Pay-as-you-go | **$0-2** | Unlimited bandwidth |
| **Vercel** | Hobby | **$0** | CDN |
| **TOTAL** | | **$14-16/month** | Daily backups |

### Option C: Absolute Minimum (Not Recommended)

| Service | Tier | Cost/Month | Issues |
|---------|------|------------|--------|
| **Render Web** | Free | **$0** | 15-min sleep 🚫 |
| **Render PostgreSQL** | Free | **$0** | 90-day expiry |
| **Cloudflare R2** | Free | **$0-1** | 10GB limit |
| **TOTAL** | | **$0-1/month** | Unusable UX |

### Cost Breakdown by Feature

**Backend hosting (required):**
- Free: Sleeps (unusable) = $0
- Starter: Always-on = $7 ✅

**Database (required):**
- Free: 1GB, no backups = $0
- Starter: 10GB + backups = $7

**File storage (required):**
- R2 free tier: 10GB = $0
- Typical usage: <5GB = $0-1

**Bandwidth:**
- Render: 100GB free, then $0.10/GB
- R2: **Zero egress fees** (huge savings)

---

## 6️⃣ CHANGES REQUIRED FOR R2

### Already Completed ✅

1. **R2 SDK installed:**
   ```json
   "@aws-sdk/client-s3": "^3.1133.0",
   "@aws-sdk/s3-request-presigner": "^3.1133.0"
   ```

2. **R2 storage service created:**
   - `src/lib/r2storage.ts`
   - Upload, download, delete, signed URLs
   - Validation & security

3. **Controllers updated:**
   - `recording.controller.ts` - R2 upload/download
   - `payment.controller.ts` - R2 receipt storage
   - `admin.controller.ts` - R2 PDF resources
   - `assessment.controller.ts` - R2 audio storage

4. **Multer changed:**
   - From disk storage → memory storage
   - Files buffer to memory, then R2
   - No local filesystem writes

5. **Routes updated:**
   - New signed URL endpoints
   - Authorization checks before URL generation

### Still Required ❌

**Environment variables needed:**
```bash
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_api_key
R2_SECRET_ACCESS_KEY=your_r2_secret
R2_BUCKET_NAME=lisan-storage
R2_ENDPOINT=https://your-account.r2.cloudflarestorage.com
```

**Setup steps:**
1. Create Cloudflare R2 bucket
2. Generate API token
3. Add variables to Render

**No code changes needed** - R2 integration is complete.

---

## 📊 COST COMPARISON SUMMARY

### Recommended: Option A ($7-8/month)

**Costs:**
- Render Web Starter: $7
- Render DB Free: $0
- R2: $0-1
- **Total: $7-8/month**

**What you get:**
- ✅ Always-on backend
- ✅ 1GB PostgreSQL
- ✅ 10GB file storage
- ⚠️ No automated backups
- ⚠️ Manual DB export needed

**Good for:**
- Starting out
- <100 students
- You do manual weekly backups

### If Budget Allows: Option B ($14-16/month)

**Additional $7 gets you:**
- ✅ Daily automated backups
- ✅ 10GB database (vs 1GB)
- ✅ Point-in-time recovery
- ✅ Better performance
- ✅ Peace of mind

**Good for:**
- School production use
- 100+ students
- Mission-critical data

---

## 🎯 DEPLOYMENT CHANGES NEEDED

### 1. Database Migration

**Change schema.prisma:**
```prisma
datasource db {
  provider = "postgresql"  // was: "sqlite"
  url      = env("DATABASE_URL")
}
```

**Remove SQLite dependency:**
```bash
npm uninstall sqlite3
```

### 2. Update DATABASE_URL

**From:** `file:./dev.db`  
**To:** Render PostgreSQL connection string

### 3. Environment Variables

**Required:**
- DATABASE_URL (from Render)
- R2_* (5 variables from Cloudflare)
- JWT_SECRET (generated)
- JWT_REFRESH_SECRET (generated)
- FRONTEND_URL (Vercel)

### 4. Run Migrations

After deployment:
```bash
npx prisma migrate deploy
```

---

## ✅ DEPLOYMENT READINESS

### Ready ✅
- [x] R2 integration complete
- [x] TypeScript build configured
- [x] Production start script
- [x] Environment variable template
- [x] JWT secrets generated
- [x] Documentation complete

### Needs Action ❌
- [ ] Choose cost tier
- [ ] Update schema to PostgreSQL
- [ ] Create R2 bucket
- [ ] Get R2 credentials
- [ ] Deploy to Render
- [ ] Run migrations

---

## 💡 RECOMMENDATIONS

### For Minimum Cost ($7-8/month):

1. **Use Render Free PostgreSQL**
   - Sufficient for starting out
   - Must have paid web service ($7)
   - Set calendar reminder: backup DB monthly

2. **Monitor Usage**
   - Check R2 storage monthly
   - Should stay well under 10GB free tier

3. **Manual Backup Strategy**
   ```bash
   # Run monthly:
   pg_dump DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

### For Production ($14-16/month):

1. **Use Render Starter PostgreSQL**
   - Daily automated backups
   - 7-day retention
   - Better performance

2. **Set Up Monitoring**
   - Render provides basic metrics
   - Watch for memory issues

3. **No backup needed**
   - Automated daily backups included

---

## 🚨 CRITICAL DECISIONS NEEDED

### Decision 1: Database Tier

**Option A: Free PostgreSQL ($0)**
- Pros: Saves $7/month
- Cons: No backups, manual export needed, 1GB limit
- Good for: Testing, small deployments

**Option B: Starter PostgreSQL ($7)**
- Pros: Daily backups, 10GB, peace of mind
- Cons: $7/month
- Good for: Production use

**I recommend:** Start with Free, upgrade if you get >50 students

### Decision 2: Backup Strategy (if Free DB)

**Manual backups required:**
- Weekly exports to local machine
- Store backups in Google Drive/Dropbox
- Test restore process once

### Decision 3: Monitoring

**Free tier monitoring:**
- Check Render dashboard weekly
- Watch for memory issues
- Monitor R2 usage monthly

---

## 📋 ACTUAL DEPLOYMENT CHECKLIST

Once you approve the plan:

1. [ ] Choose database tier (Free or Starter)
2. [ ] Update schema.prisma to PostgreSQL
3. [ ] Create Cloudflare R2 bucket
4. [ ] Get R2 API credentials
5. [ ] Create Render PostgreSQL database
6. [ ] Create Render Web Service
7. [ ] Add all environment variables
8. [ ] Deploy
9. [ ] Run migrations
10. [ ] Create admin user
11. [ ] Test file uploads
12. [ ] Update Vercel frontend URL

---

## 💰 FINAL COST ESTIMATE

### Minimum Viable ($7-8/month)
- Render Web Starter: $7
- Render DB Free: $0
- R2: $0-1
- **Annual: $84-96**

### Production Ready ($14-16/month)
- Render Web Starter: $7
- Render DB Starter: $7
- R2: $0-2
- **Annual: $168-192**

**Both are significantly cheaper than AWS/Azure equivalents.**

---

## 🎯 AWAITING YOUR APPROVAL

**Please confirm:**

1. **Which database tier?**
   - [ ] Free PostgreSQL ($0, no backups)
   - [ ] Starter PostgreSQL ($7, daily backups)

2. **Manual backups acceptable?** (if Free DB)
   - [ ] Yes, I'll export weekly
   - [ ] No, need automated backups

3. **Total monthly budget approved?**
   - [ ] $7-8 (minimum)
   - [ ] $14-16 (production)

**After approval, I'll:**
1. Update schema to PostgreSQL
2. Prepare exact deployment commands
3. Guide you through R2 setup
4. Deploy backend

**Do not proceed until you confirm the tier selection.**
