# ✅ LISAN Deployment Checklist

Print this and check off each step as you complete it.

---

## 📋 Phase 1: Cloudflare R2 Setup

**Guide:** `readpath-backend/CLOUDFLARE_R2_SETUP.md`

- [ ] Created Cloudflare account (if needed)
- [ ] Created R2 bucket named: `lisan-storage`
- [ ] Created R2 API token with Read & Write permissions
- [ ] Saved R2_ACCOUNT_ID: `_______________________`
- [ ] Saved R2_ACCESS_KEY_ID: `_______________________`
- [ ] Saved R2_SECRET_ACCESS_KEY: `_______________________`
- [ ] Saved R2_BUCKET_NAME: `lisan-storage`
- [ ] Saved R2_ENDPOINT: `_______________________`

**⚠️ Keep these credentials secure!**

---

## 📋 Phase 2: Generate JWT Secrets

Run in terminal:
```bash
cd readpath-backend
node generate-secrets.js
```

- [ ] Generated JWT_SECRET
- [ ] Generated JWT_REFRESH_SECRET
- [ ] Saved both secrets securely

---

## 📋 Phase 3: Render Database Setup

**At render.com:**

- [ ] Created Render account
- [ ] Connected GitHub account
- [ ] Created new PostgreSQL database:
  - [ ] Name: `lisan-db`
  - [ ] Database name: `lisan`
  - [ ] User: `lisan`
  - [ ] Plan: Starter ($7/month)
- [ ] Database is running (green status)
- [ ] Copied Internal Database URL

---

## 📋 Phase 4: Render Web Service Setup

**At render.com:**

- [ ] Created new Web Service
- [ ] Connected to GitHub repo: `abu-agency`
- [ ] Root Directory: `readpath-backend`
- [ ] Build Command: `npm install && npx prisma generate && npm run build`
- [ ] Start Command: `npm run start:prod`
- [ ] Plan: Starter ($7/month)

---

## 📋 Phase 5: Environment Variables

**In Render web service settings:**

### Basic Settings
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`
- [ ] `FRONTEND_URL` = `https://readpath-frontend.vercel.app`

### Database
- [ ] `DATABASE_URL` = [Linked from lisan-db database]

### Security (from Phase 2)
- [ ] `JWT_SECRET` = [Your generated secret]
- [ ] `JWT_REFRESH_SECRET` = [Your other generated secret]

### Cloudflare R2 (from Phase 1)
- [ ] `R2_ACCOUNT_ID` = [From Cloudflare]
- [ ] `R2_ACCESS_KEY_ID` = [From Cloudflare]
- [ ] `R2_SECRET_ACCESS_KEY` = [From Cloudflare]
- [ ] `R2_BUCKET_NAME` = `lisan-storage`
- [ ] `R2_ENDPOINT` = [From Cloudflare]

### Optional
- [ ] `GEMINI_API_KEY` = [If you have one]
- [ ] `GEMINI_MODEL` = `gemini-2.0-flash-exp`

---

## 📋 Phase 6: Deploy Backend

**In Render:**

- [ ] Clicked "Create Web Service"
- [ ] Deployment started
- [ ] Waited for deployment (5-10 minutes)
- [ ] Deployment succeeded (green checkmark)
- [ ] Noted backend URL: `https://____________.onrender.com`

---

## 📋 Phase 7: Database Migration

**In Render Shell:**

- [ ] Opened web service Shell tab
- [ ] Ran: `npx prisma migrate deploy`
- [ ] Migration succeeded (no errors)
- [ ] All tables created

---

## 📋 Phase 8: Create Admin User

**In Render Shell:**

- [ ] Ran: `node dist/create-admin.js`
- [ ] Entered admin email: `_______________________`
- [ ] Entered admin password: `_______________________`
- [ ] Entered first name: `_______________________`
- [ ] Entered last name: `_______________________`
- [ ] Admin created successfully

---

## 📋 Phase 9: Update Vercel Frontend

**At vercel.com:**

- [ ] Opened `readpath-frontend` project
- [ ] Went to Settings → Environment Variables
- [ ] Updated `VITE_API_URL` to: `https://____________.onrender.com`
- [ ] Went to Deployments tab
- [ ] Clicked Redeploy
- [ ] Redeployment succeeded

---

## 📋 Phase 10: Verification Tests

### Backend Health
- [ ] Visited: `https://your-backend.onrender.com/health`
- [ ] Received: `{"status":"ok","message":"ReadPath API is running"}`

### Admin Login
- [ ] Visited: `https://readpath-frontend.vercel.app`
- [ ] Logged in with admin credentials
- [ ] Accessed admin dashboard successfully

### File Upload Tests
- [ ] Created test student account
- [ ] Recorded and uploaded voice recording
- [ ] Recording appears in admin dashboard
- [ ] Can play back recording
- [ ] Uploaded PDF resource in admin
- [ ] Can download PDF resource
- [ ] Submitted payment receipt
- [ ] Can view payment receipt in admin

### Database Tests
- [ ] Created test assessment
- [ ] Assigned assessment to student
- [ ] Student can see assignment
- [ ] Submitted assessment
- [ ] Data persists after page refresh
- [ ] Notifications working

---

## 📋 Phase 11: Post-Deployment

- [ ] Documented backend URL
- [ ] Documented admin credentials (securely)
- [ ] Tested on mobile device
- [ ] Tested on different browsers
- [ ] Created backup of database
- [ ] Invited teacher for testing
- [ ] Invited student for testing
- [ ] All features working correctly

---

## 🎉 Deployment Complete!

Date completed: `_______________`

Deployed by: `_______________`

**Your LISAN platform is now live!**

### URLs
- **Frontend:** https://readpath-frontend.vercel.app
- **Backend:** https://____________.onrender.com
- **Admin Email:** _______________

### Next Steps
- [ ] Bulk import students (if needed)
- [ ] Upload course content
- [ ] Configure assessment templates
- [ ] Train teachers on platform
- [ ] Announce launch to students
- [ ] Set up monitoring alerts
- [ ] Plan first content update

---

## 💰 Monthly Billing

- Render Web Service: $7/month
- Render PostgreSQL: $7/month
- Cloudflare R2: ~$0-2/month
- **Total: ~$14-16/month**

Billing starts: `_______________`

---

## 🆘 Emergency Contacts

If something breaks:

1. Check Render logs (Dashboard → Logs)
2. Check environment variables are set
3. Verify database is running
4. Test R2 connectivity
5. Review deployment guides for troubleshooting

**Keep this checklist for future reference!**
