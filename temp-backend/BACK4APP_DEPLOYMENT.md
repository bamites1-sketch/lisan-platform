# 🚀 Deploy ReadPath Backend to Back4app Containers

This guide walks you through deploying your ReadPath backend to Back4app Containers with zero-sleep, always-on hosting.

## 📋 Prerequisites

1. **GitHub Repository**: Your code must be pushed to GitHub
2. **Back4app Account**: Sign up at [back4app.com](https://www.back4app.com)
3. **Environment Variables**: Prepare your production environment variables

## 🛠️ Step 1: Prepare Your Environment Variables

Create your production environment variables based on `.env.production.example`:

### Required Variables:
```bash
NODE_ENV=production
PORT=3000
DATABASE_URL="file:./production.db"
FRONTEND_URL="https://your-vercel-app.vercel.app"
JWT_SECRET="generate-a-super-secure-secret-here"
JWT_REFRESH_SECRET="generate-another-super-secure-secret-here"
```

### Optional (but recommended for file uploads):
```bash
CLOUDFLARE_ACCOUNT_ID="your-account-id"
CLOUDFLARE_ACCESS_KEY_ID="your-access-key"
CLOUDFLARE_SECRET_ACCESS_KEY="your-secret-key"
CLOUDFLARE_BUCKET_NAME="readpath-uploads"
CLOUDFLARE_REGION="auto"
```

## 🔐 Step 2: Generate Secure Secrets

Run this in your terminal to generate secure secrets:

```bash
# For JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"

# For JWT_REFRESH_SECRET  
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(64).toString('hex'))"
```

## 🌐 Step 3: Deploy to Back4app

1. **Go to Back4app Dashboard**
   - Visit [www.back4app.com](https://www.back4app.com)
   - Sign up or log in
   - Click "Create New App"
   - Choose "Container as a Service"

2. **Connect Your Repository**
   - Click "Connect Git Repository"
   - Select your GitHub account
   - Choose your ReadPath repository
   - Select the `readpath-backend` folder as the root directory

3. **Configure Build Settings**
   - **Build Command**: Leave empty (Dockerfile handles this)
   - **Start Command**: Leave empty (Dockerfile handles this)
   - **Port**: 3000
   - **Health Check Path**: `/health`

4. **Add Environment Variables**
   - Go to "Environment Variables" tab
   - Add all your production environment variables
   - **Important**: Don't add `PORT` - Back4app handles this automatically

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (usually 2-5 minutes)
   - Your backend will be available at: `https://your-app-name.back4app.io`

## 🎯 Step 4: Update Frontend Configuration

Update your Vercel frontend to use the new backend URL:

```bash
# In your frontend .env.production or Vercel environment variables
NEXT_PUBLIC_API_URL="https://your-app-name.back4app.io"
```

## ✅ Step 5: Verify Deployment

1. **Check Health Endpoint**:
   ```bash
   curl https://your-app-name.back4app.io/health
   ```

2. **Test API Endpoints**:
   ```bash
   curl https://your-app-name.back4app.io/api/auth/health
   ```

3. **Check Logs**: Monitor the Back4app dashboard for any startup issues

## 🔄 Step 6: Auto-Deploy Setup

Back4app automatically redeploys when you push to your main branch. To customize this:

1. Go to "Deployments" tab in Back4app dashboard
2. Configure branch settings
3. Set up deployment notifications (optional)

## 📊 Database Considerations

### SQLite (Default - Good for Start)
- Your current setup uses SQLite
- Perfect for initial deployment and testing
- Data persists between deployments
- No additional setup required

### PostgreSQL (Recommended for Production)
When ready to scale:
1. Go to Back4app "Database" tab
2. Create a PostgreSQL database
3. Update `DATABASE_URL` to use PostgreSQL connection string
4. Redeploy your container

## 🚀 Benefits of This Setup

✅ **Always-On**: No sleeping - your API responds 24/7  
✅ **Auto-Deploy**: Push to GitHub → automatic deployment  
✅ **SSL/HTTPS**: Included automatically  
✅ **Custom Domain**: Add your own domain easily  
✅ **Monitoring**: Built-in logs and metrics  
✅ **Scaling**: Easy vertical/horizontal scaling when needed  

## 🐛 Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify `Dockerfile` syntax
- Check Back4app build logs

### App Won't Start
- Verify environment variables are set correctly
- Check that `PORT=3000` is not set (Back4app manages this)
- Review startup logs in Back4app dashboard

### Database Issues
- Ensure `DATABASE_URL` is correct
- Check if migrations ran successfully
- Verify file permissions for SQLite

### CORS Issues
- Make sure `FRONTEND_URL` includes your Vercel domain
- Update CORS settings in `server.ts` if needed

## 📝 Next Steps

1. **Custom Domain**: Add your own domain in Back4app dashboard
2. **Monitoring**: Set up error tracking (Sentry)
3. **Backup**: Configure database backups
4. **Scaling**: Monitor usage and scale as needed

## 🎉 You're Live!

Your ReadPath backend is now running 24/7 on Back4app Containers with zero-sleep guarantees. Students and teachers can access your platform anytime without delays!

---

**Support**: If you need help, check Back4app documentation or contact their support team.