# Deploy New Backend to Vercel
Write-Host "🚀 CREATING NEW BACKEND DEPLOYMENT" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green

# Create a temporary deployment directory
$tempDir = "temp-backend-deploy"
Write-Host "`n1️⃣ Creating temporary deployment directory..." -ForegroundColor Cyan

if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory $tempDir

# Copy backend files
Write-Host "2️⃣ Copying backend files..." -ForegroundColor Cyan
Copy-Item "readpath-backend/*" "$tempDir/" -Recurse -Force

# Navigate to temp directory
Set-Location $tempDir

# Update package.json name to avoid conflicts
Write-Host "3️⃣ Updating package.json..." -ForegroundColor Cyan
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.name = "readpath-backend-production"
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

# Deploy to Vercel
Write-Host "4️⃣ Deploying to Vercel..." -ForegroundColor Cyan
vercel --prod --yes

$exitCode = $LASTEXITCODE

# Cleanup
Set-Location ".."
Remove-Item $tempDir -Recurse -Force

if ($exitCode -eq 0) {
    Write-Host "`n🎉 BACKEND DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "📝 NEXT STEPS:" -ForegroundColor Cyan
    Write-Host "1. Copy the backend URL from the output above" -ForegroundColor White
    Write-Host "2. Update frontend VITE_API_URL to the new backend URL" -ForegroundColor White
    Write-Host "3. Redeploy frontend" -ForegroundColor White
    Write-Host "4. Test the website" -ForegroundColor White
} else {
    Write-Host "`n❌ BACKEND DEPLOYMENT FAILED!" -ForegroundColor Red
    Write-Host "Check the errors above." -ForegroundColor Red
}