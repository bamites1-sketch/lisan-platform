# 🔐 Back4app Environment Variables

Copy and paste these **EXACT** environment variables into Back4app:

## Required Variables:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=file:./production.db
FRONTEND_URL=https://readpath-frontend.vercel.app
JWT_SECRET=a28f056f0eb23fd1fcb09f42e3967daca296dd6a8f70b70e137bd03b49a54b53c2f50b9f462bc3401fe3d3f45d331ed069d0d881ea8797ed97cc3cf6e3dc377d
JWT_REFRESH_SECRET=4fb224f78a9657e795240678728982a9b009ec8068fbb16225513c6c50520bd9d8440592eba4d8f89a5468c2119f805baad5ded748d1d54d47324b3ded62a6f5
```

## Optional (for file uploads - add later if needed):
```
CLOUDFLARE_ACCOUNT_ID=your-account-id
CLOUDFLARE_ACCESS_KEY_ID=your-access-key
CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
CLOUDFLARE_BUCKET_NAME=readpath-uploads
CLOUDFLARE_REGION=auto
```

---

## 📋 Back4app Configuration Steps:

1. **App Name**: `readpath-backend`
2. **GitHub Repository**: Select your repo
3. **Root Directory**: `readpath-backend`
4. **Build Command**: Leave empty (Dockerfile handles this)
5. **Start Command**: Leave empty (Dockerfile handles this)
6. **Port**: 3000
7. **Health Check Path**: `/health`

## 🎯 After Deployment:

Your backend will be available at: `https://YOUR-APP-NAME.back4app.io`

## ⚡ Update Frontend:

Once backend is live, update your frontend environment variable:
- Go to Vercel dashboard
- Add environment variable: `VITE_API_URL` = `https://your-backend-url.back4app.io`
- Redeploy frontend

---

**📞 Need help?** Just let me know if you need assistance with any step!