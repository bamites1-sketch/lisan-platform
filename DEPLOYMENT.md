# ReadPath Platform - Production Deployment Guide

## 🚀 Live Production URLs

- **Frontend**: https://readpath-frontend.vercel.app
- **Backend API**: https://readpath-backend.vercel.app
- **Database**: Neon PostgreSQL (us-east-1)

---

## ✅ Deployment Status

**Status**: LIVE & OPERATIONAL  
**Last Deployed**: September 24, 2026  
**Health Status**: All systems operational ✅

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                              │
│  https://readpath-frontend.vercel.app                   │
│  • React + TypeScript + Vite                            │
│  • Vercel CDN (Global)                                  │
│  • Auto HTTPS/SSL                                       │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ HTTPS (CORS Protected)
                  │
┌─────────────────▼───────────────────────────────────────┐
│                    BACKEND API                           │
│  https://readpath-backend.vercel.app                    │
│  • Node.js + Express + TypeScript                       │
│  • Vercel Serverless Functions                          │
│  • Rate Limited, Helmet Security                        │
└─────────────────┬───────────────────────────────────────┘
                  │
                  │ SSL/TLS Connection
                  │
┌─────────────────▼───────────────────────────────────────┐
│               DATABASE (PostgreSQL)                      │
│  Neon PostgreSQL - us-east-1                            │
│  • Connection Pooling                                   │
│  • Automatic Backups                                    │
│  • SSL Required                                         │
└─────────────────────────────────────────────────────────┘
```

---

## Production Configuration

### Frontend Environment Variables
```env
VITE_API_URL=https://readpath-backend.vercel.app
```

### Backend Environment Variables (Vercel Secrets)
```env
DATABASE_URL=postgresql://[REDACTED]@[REDACTED].neon.tech/neondb?sslmode=require
JWT_SECRET=[REDACTED]
JWT_REFRESH_SECRET=[REDACTED]
FRONTEND_URL=https://readpath-frontend.vercel.app
NODE_ENV=production
SETUP_KEY=[REDACTED]
GEMINI_API_KEY=[REDACTED] (Optional)
GEMINI_MODEL=gemini-1.5-flash (Optional)
```

---

## Default Admin Credentials

**⚠️ IMPORTANT**: Change these credentials immediately after first login!

```
Email: admin@lisan.com
Password: LiSAN2026!
```

**To change admin password**:
1. Login to frontend
2. Go to Profile Settings
3. Update password
4. All existing tokens will be invalidated

---

## Deployment Workflow

### Automatic Deployments (Configured) ✅

**Frontend**:
- Push to `main` branch → Auto deploy to production
- Vercel monitors: `readpath-frontend/` directory
- Build command: `npm run build`
- Output: `dist/`

**Backend**:
- Push to `main` branch → Auto deploy to production
- Vercel monitors: `readpath-backend/` directory
- Build command: `npm run vercel-build`
- Output: `dist/` + API routes

### Manual Deployment (If Needed)

```bash
# Frontend
cd readpath-frontend
vercel --prod

# Backend
cd readpath-backend
vercel --prod
```

---

## Database Management

### Connection Details
- **Provider**: Neon (Serverless PostgreSQL)
- **Region**: us-east-1 (AWS)
- **Connection Type**: Pooled
- **SSL**: Required

### Backup Strategy
- **Automatic**: Neon provides automatic backups
- **Frequency**: Continuous (point-in-time recovery)
- **Retention**: 7 days (Neon free tier)

### Manual Backup (Optional)
```bash
cd readpath-backend
npx prisma db pull
npx prisma migrate dev --name backup_YYYYMMDD
```

---

## Health Check Endpoints

### Backend Health
```bash
curl https://readpath-backend.vercel.app/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "ReadPath API is running"
}
```

### Frontend Health
Simply visit: https://readpath-frontend.vercel.app

---

## Monitoring & Logs

### View Production Logs
```bash
# Backend logs
cd readpath-backend
vercel logs --prod

# Frontend logs
cd readpath-frontend
vercel logs --prod
```

### View Deployments
```bash
vercel ls
```

---

## Troubleshooting

### Issue: Login fails with 500 error
**Diagnosis**: Database connection issue  
**Solution**:
```bash
cd readpath-backend
vercel env ls production
# Verify DATABASE_URL is set and contains correct hostname
```

### Issue: CORS error in browser
**Diagnosis**: Frontend URL not whitelisted  
**Solution**:
```bash
cd readpath-backend
vercel env ls production
# Verify FRONTEND_URL matches actual frontend URL
```

### Issue: JWT token errors
**Diagnosis**: JWT secrets mismatch  
**Solution**:
```bash
# Ensure JWT_SECRET and JWT_REFRESH_SECRET are different
# Both must be set in production environment
```

---

## Scaling Considerations

### Current Setup (Production)
- **Concurrent Users**: ~100 simultaneous (Vercel free tier)
- **Database Connections**: Pooled (5 connections)
- **Rate Limits**: 60 auth requests, 1500 API requests per 15min

### To Scale Up
1. **Upgrade Vercel Plan**: Pro tier for higher limits
2. **Upgrade Neon Plan**: More storage and compute
3. **Enable CDN Caching**: Static assets and API responses
4. **Add Redis**: For session storage and caching

---

## Maintenance Schedule

### Weekly
- [ ] Check Vercel deployment logs for errors
- [ ] Monitor Neon database usage and storage

### Monthly  
- [ ] Review rate limit logs for abuse patterns
- [ ] Check Neon backup status
- [ ] Audit user access logs

### Quarterly
- [ ] Update npm dependencies (`npm audit fix`)
- [ ] Review and update CORS whitelist
- [ ] Security audit

### Annually
- [ ] Rotate JWT secrets
- [ ] Rotate database credentials
- [ ] Review and renew SSL certificates (automatic via Vercel)

---

## Rollback Procedure

### If Deployment Breaks Production

```bash
# 1. Check recent deployments
vercel ls

# 2. Find last working deployment URL
# Example: https://readpath-backend-abc123-...vercel.app

# 3. Promote it to production
vercel alias set <deployment-url> readpath-backend.vercel.app

# 4. Verify
curl https://readpath-backend.vercel.app/health
```

---

## Emergency Contacts

- **Platform Issues**: Vercel Status - https://vercel-status.com
- **Database Issues**: Neon Status - https://neonstatus.com
- **Developer Contact**: [Your Email]

---

**Status**: ✅ ALL SYSTEMS OPERATIONAL
