# Security Policy

## Production Security Status ✅

**Last Audit**: September 24, 2026  
**Status**: SECURED & PRODUCTION-READY

## Deployment Architecture

### Frontend
- **Platform**: Vercel
- **URL**: https://readpath-frontend.vercel.app
- **Environment**: Production
- **SSL/TLS**: Enforced (Vercel automatic HTTPS)

### Backend
- **Platform**: Vercel Serverless
- **URL**: https://readpath-backend.vercel.app
- **Environment**: Production
- **SSL/TLS**: Enforced (Vercel automatic HTTPS)

### Database
- **Provider**: Neon PostgreSQL
- **Region**: us-east-1 (AWS)
- **Connection**: Pooled connection with SSL required
- **Backups**: Automatic (Neon managed)

## Security Measures Implemented

### 1. Authentication & Authorization ✅
- **JWT Access Tokens**: HS256 signing, 15-minute expiry
- **JWT Refresh Tokens**: Separate secret, 7-day expiry, HttpOnly cookies
- **Password Hashing**: bcrypt with salt rounds = 10
- **Role-Based Access Control**: STUDENT | PARENT | TEACHER | ADMIN
- **Token Invalidation**: Password change invalidates all existing tokens

### 2. Network Security ✅
- **HTTPS Only**: All traffic encrypted (TLS 1.2+)
- **CORS Protection**: Whitelist-based origin validation
- **Helmet.js**: Security headers (CSP, HSTS, X-Frame-Options, etc.)
- **HSTS**: Strict-Transport-Security with 1-year max-age
- **Rate Limiting**: 
  - Auth endpoints: 60 requests per 15 min per IP
  - API endpoints: 1500 requests per 15 min per IP

### 3. Database Security ✅
- **SSL/TLS Required**: All database connections encrypted
- **Connection Pooling**: Limited concurrent connections
- **Prepared Statements**: Prisma ORM prevents SQL injection
- **Row-Level Security**: User data isolated by role
- **Cascade Deletes**: Proper foreign key constraints

### 4. API Security ✅
- **Input Validation**: express-validator on all endpoints
- **Body Size Limits**: 1MB max payload
- **Cookie Security**: HttpOnly, Secure, SameSite=Strict
- **Trust Proxy**: Vercel proxy headers trusted for IP detection

### 5. Secrets Management ✅
- **Environment Variables**: All secrets in Vercel environment (not in code)
- **.gitignore**: All .env files excluded from version control
- **No Hardcoded Secrets**: All credentials in environment variables
- **Separate Dev/Prod**: Different secrets for each environment

## Environment Variables (Production)

### Backend (Vercel Secrets)
```
DATABASE_URL          - Neon PostgreSQL connection string
JWT_SECRET            - Access token signing secret
JWT_REFRESH_SECRET    - Refresh token signing secret (DIFFERENT from JWT_SECRET)
FRONTEND_URL          - CORS-allowed frontend origin
NODE_ENV              - "production"
SETUP_KEY             - One-time admin creation key
GEMINI_API_KEY        - (Optional) AI features
GEMINI_MODEL          - (Optional) AI model version
```

### Frontend (Vercel Config)
```
VITE_API_URL          - Backend API URL (https://readpath-backend.vercel.app)
```

## Security Best Practices

### ✅ Implemented
- [x] HTTPS enforced on all endpoints
- [x] Strong password hashing (bcrypt)
- [x] JWT with short expiry times
- [x] HttpOnly cookies for refresh tokens
- [x] CORS whitelist validation
- [x] Rate limiting on all routes
- [x] SQL injection protection (Prisma ORM)
- [x] XSS protection (Helmet CSP)
- [x] Environment variables for secrets
- [x] Database connection over SSL
- [x] Input validation and sanitization
- [x] Security headers (HSTS, CSP, etc.)
- [x] Error handling without information leakage

### 🔒 Access Control
- Admin-only routes: Protected by role middleware
- Student data: Accessible only by student, their parent, assigned teacher, or admin
- Parent data: Accessible only by parent, their students' teachers, or admin
- Teacher data: Accessible only by teacher or admin

## Incident Response

### In Case of Security Breach
1. **Rotate all JWT secrets** in Vercel environment variables
2. **Change database password** in Neon dashboard
3. **Update DATABASE_URL** in Vercel with new credentials
4. **Force password reset** for all affected users
5. **Review audit logs** in Vercel and Neon dashboards
6. **Notify affected users** per data protection regulations

### Emergency Access Revocation
```bash
# Rotate JWT secrets immediately (invalidates all tokens)
vercel env rm JWT_SECRET production
vercel env rm JWT_REFRESH_SECRET production
vercel env add JWT_SECRET production
vercel env add JWT_REFRESH_SECRET production
```

## Monitoring & Maintenance

### Recommended Actions
- **Weekly**: Review Vercel deployment logs for errors
- **Monthly**: Audit Neon database backups and storage usage
- **Quarterly**: Review and update dependencies (`npm audit fix`)
- **Annually**: Rotate JWT secrets and database credentials

### Security Audits
- Last security audit: September 24, 2026
- Next scheduled audit: December 24, 2026

## Contact

For security issues, contact: [Your Contact Email]

---

**Project Status**: ✅ PRODUCTION-READY & SECURED
