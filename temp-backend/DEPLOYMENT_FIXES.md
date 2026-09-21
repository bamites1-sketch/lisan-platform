# Vercel Deployment Fixes

## Issues Resolved

The deployment was failing with these errors:
1. **Cannot find module '/var/task/readpath-backend/dist/server.js'** - Build artifacts were missing
2. **Cannot find module 'typescript'** - TypeScript wasn't available in production environment

## Changes Made

### 1. Package.json Updates
- **Moved `typescript` and `prisma` to production dependencies** - Vercel needs these to build the project during deployment
- **Added `vercel-build` script** - Vercel will automatically run this script during deployment
- **Removed `postinstall` script** - This was interfering with the build process

### 2. Server.ts Updates
- **Conditional server startup** - Only call `app.listen()` in local development, not in serverless (Vercel) environment
- This prevents conflicts since Vercel handles the server lifecycle

### 3. api/index.js Simplification
- **Removed fallback logic** - Now directly requires the compiled `dist/server.js`
- Cleaner error messages if compilation fails

### 4. vercel.json Updates
- **Removed custom buildCommand** - Vercel now uses the standard `vercel-build` npm script
- Simplified configuration to rely on Vercel's defaults

### 5. Added .vercelignore
- **Excludes unnecessary files** from deployment:
  - Source TypeScript files (only compiled JS is needed)
  - Development database files
  - Test scripts
  - Migration files (Prisma schema is sufficient)

## Deployment Process

When you push to your repository:

1. Vercel detects the change
2. Runs `npm install` (installs all dependencies including TypeScript and Prisma)
3. Runs `vercel-build` script → `prisma generate && tsc`
4. Deploys the compiled `dist/` folder and `api/index.js` entry point
5. Your API is live at your Vercel URL

## Testing Locally

To verify the build works locally:

```bash
cd readpath-backend
npm run build
node dist/server.js
```

## Environment Variables

Make sure these are set in Vercel dashboard:
- `DATABASE_URL` - Your production database connection string
- `JWT_SECRET` - Secret for JWT token signing
- `JWT_REFRESH_SECRET` - Secret for refresh token signing
- `FRONTEND_URL` - Your frontend URL for CORS
- `NODE_ENV=production`
- `VERCEL=1` (automatically set by Vercel)

## Next Steps

1. Wait for Vercel to complete the automatic redeployment
2. Check the deployment logs in Vercel dashboard
3. Test your API endpoints
4. If issues persist, check Vercel logs for specific error messages
