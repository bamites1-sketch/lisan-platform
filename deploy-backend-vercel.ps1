# Deploy Backend to Vercel (Alternative Option)
Write-Host "🚀 DEPLOYING BACKEND TO VERCEL" -ForegroundColor Green
Write-Host "===============================" -ForegroundColor Green

# Navigate to backend directory
Set-Location "readpath-backend"

# Build the project first
Write-Host "`n1️⃣ Preparing backend for Vercel..." -ForegroundColor Cyan

# Make sure we use SQLite for Vercel (not PostgreSQL)
Write-Host "   Setting up SQLite schema for Vercel deployment..." -ForegroundColor Yellow

# Generate and build
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" -ForegroundColor Green
    
    # Deploy to Vercel
    Write-Host "`n2️⃣ Deploying backend to Vercel..." -ForegroundColor Cyan
    vercel --prod
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`n🎉 BACKEND DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
        Write-Host "====================================" -ForegroundColor Green
        Write-Host "📝 NEXT STEPS:" -ForegroundColor Cyan
        Write-Host "1. Note your new backend URL from the output above" -ForegroundColor White
        Write-Host "2. Update VITE_API_URL in Vercel frontend environment variables" -ForegroundColor White
        Write-Host "3. Redeploy the frontend" -ForegroundColor White
        Write-Host "4. Test the website" -ForegroundColor White
        Write-Host "`n🔑 Admin Credentials:" -ForegroundColor Cyan
        Write-Host "Email: admin@lisan.com" -ForegroundColor Yellow
        Write-Host "Password: LiSAN2026!" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Backend deployment failed!" -ForegroundColor Red
        Write-Host "Try the Render option instead (see BACKEND_DEPLOYMENT_GUIDE.md)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    Write-Host "Check the errors above." -ForegroundColor Red
}

# Return to root directory
Set-Location ".."