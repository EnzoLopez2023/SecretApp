# Quick Deploy Script for MyShop Image Feature
# This script copies updated files to production and restarts services

Write-Host "🚀 Deploying MyShop Image Feature Updates..." -ForegroundColor Cyan
Write-Host ""

# Define paths
$repoPath = "C:\Source\Repo\SecretApp"
$prodPath = "C:\inetpub\wwwroot\secretapp"

# Step 1: Copy updated server.js
Write-Host "📦 Copying server.js..." -ForegroundColor Yellow
Copy-Item "$repoPath\server.js" -Destination "$prodPath\server.js" -Force
Write-Host "✅ server.js updated" -ForegroundColor Green
Write-Host ""

# Step 2: Build frontend
Write-Host "🔨 Building frontend..." -ForegroundColor Yellow
Set-Location $repoPath
npm run build
Write-Host "✅ Frontend built" -ForegroundColor Green
Write-Host ""

# Step 3: Copy build files
Write-Host "📦 Copying build files..." -ForegroundColor Yellow
if (Test-Path "$repoPath\dist") {
    Copy-Item "$repoPath\dist\*" -Destination "$prodPath\dist\" -Recurse -Force
    Write-Host "✅ Build files copied" -ForegroundColor Green
} else {
    Write-Host "❌ Build folder not found!" -ForegroundColor Red
}
Write-Host ""

# Step 4: Restart backend
Write-Host "🔄 Restarting backend server..." -ForegroundColor Yellow
Set-Location $prodPath
pm2 restart secretapp-backend
Write-Host "✅ Backend restarted" -ForegroundColor Green
Write-Host ""

# Step 5: Show status
Write-Host "📊 Checking service status..." -ForegroundColor Yellow
pm2 status
Write-Host ""

Write-Host "✨ Deployment complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor White
Write-Host "   Frontend: http://localhost" -ForegroundColor Gray
Write-Host "   Backend:  http://localhost:3001" -ForegroundColor Gray
Write-Host ""
Write-Host "📝 What's New:" -ForegroundColor White
Write-Host "   ✓ Image upload functionality" -ForegroundColor Gray
Write-Host "   ✓ Image gallery view" -ForegroundColor Gray
Write-Host "   ✓ Full-screen image modal" -ForegroundColor Gray
Write-Host "   ✓ Image deletion in edit mode" -ForegroundColor Gray
Write-Host ""
