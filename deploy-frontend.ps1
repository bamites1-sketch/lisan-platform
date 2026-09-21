# Deploy Frontend to Vercel
Write-Host "🚀 DEPLOYING FRONTEND TO VERCEL" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Navigate to frontend directory
Set-Location "readpath-frontend"

# Build the project first
Write-Host "`n1️⃣ Building frontend..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Deploy to Vercel
    Write-Host "`n2️⃣ Deploying to Vercel..." -ForegroundColor Cyan
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "================================" -ForegroundColor Green
        Write-Host "🌐 Your website: https://readpath-frontend.vercel.app" -ForegroundColor Yellow
        Write-Host "🔧 Backend URL configured: https://lisan-backend-nl8c.onrender.com" -ForegroundColor Yellow
        Write-Host "`n📝 NEXT STEPS:" -ForegroundColor Cyan
        Write-Host "1. Fix the backend (Render deployment)" -ForegroundColor White
        Write-Host "2. Test the live website" -ForegroundColor White
    } else {
        Write-Host "❌ Deployment failed!" -ForegroundColor Red
        Write-Host "Check the error above and try again." -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "Fix the build errors before deploying." -ForegroundColor Red
}

# Return to root directory
Set-Location ".."