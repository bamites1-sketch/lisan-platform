# Set Vercel environment variable
$value = "https://readpathbackend-fm8jnxat.b4a.run"

Write-Host "Setting VITE_API_URL in Vercel..." -ForegroundColor Cyan
Write-Host "Value: $value" -ForegroundColor Yellow

# Use echo to pipe the value
$value | vercel env add VITE_API_URL production --force

Write-Host ""
Write-Host "Done! Now redeploy with:" -ForegroundColor Green
Write-Host "vercel --prod" -ForegroundColor Yellow
