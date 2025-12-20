# Quick Deploy Script (Run as Administrator)
# This deploys to C:\inetpub\wwwroot\secretapp (for secretapp.enzolopez.net)

Write-Host "🚀 Deploying to IIS..." -ForegroundColor Cyan

# Check admin
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "❌ Run as Administrator!" -ForegroundColor Red
    exit 1
}

# Stop IIS
Write-Host "Stopping IIS..." -ForegroundColor Yellow
Stop-Service W3SVC -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

# Clean destination
Write-Host "Cleaning C:\inetpub\wwwroot\secretapp..." -ForegroundColor Yellow
Remove-Item "C:\inetpub\wwwroot\secretapp\*" -Recurse -Force -ErrorAction SilentlyContinue

# Copy new build
Write-Host "Copying new build..." -ForegroundColor Yellow
Copy-Item -Path "dist\*" -Destination "C:\inetpub\wwwroot\secretapp\" -Recurse -Force

# Copy PDF Images folder
Write-Host "Copying PDF Images..." -ForegroundColor Yellow
if (Test-Path "PDF_Images") {
    Copy-Item -Path "PDF_Images" -Destination "C:\inetpub\wwwroot\secretapp\" -Recurse -Force
}

# Copy server files if they don't exist
if (-not (Test-Path "C:\inetpub\wwwroot\secretapp\package.json")) {
    Write-Host "Copying server files (package.json, server.js, ecosystem.config.cjs)..." -ForegroundColor Yellow
    Copy-Item -Path "package.json" -Destination "C:\inetpub\wwwroot\secretapp\" -Force
    Copy-Item -Path "server.js" -Destination "C:\inetpub\wwwroot\secretapp\" -Force
    Copy-Item -Path "ecosystem.config.cjs" -Destination "C:\inetpub\wwwroot\secretapp\" -Force
}

# Install backend dependencies if needed
Write-Host "Checking backend dependencies..." -ForegroundColor Yellow
$npmInstalled = Test-Path "C:\inetpub\wwwroot\secretapp\node_modules"
if (-not $npmInstalled) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    Push-Location "C:\inetpub\wwwroot\secretapp"
    npm install --production
    Pop-Location
} else {
    Write-Host "Backend dependencies already installed" -ForegroundColor Green
}

# Ensure logs directory exists
Write-Host "Ensuring logs directory exists..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "C:\inetpub\wwwroot\secretapp\logs" | Out-Null

# Restart PM2 backend
Write-Host "Restarting backend server..." -ForegroundColor Yellow
pm2 restart secretapp-backend 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend not running, starting it..." -ForegroundColor Yellow
    Push-Location "C:\inetpub\wwwroot\secretapp"
    pm2 start ecosystem.config.cjs
    pm2 save
    Pop-Location
}

# Verify PM2 backend is running
Start-Sleep -Seconds 2
$pm2Status = pm2 list | Select-String "secretapp-backend.*online"
if ($pm2Status) {
    Write-Host "Backend server is running" -ForegroundColor Green
} else {
    Write-Host "WARNING: Backend server may not be running properly" -ForegroundColor Yellow
    Write-Host "Check with: pm2 logs secretapp-backend" -ForegroundColor Yellow
}

# Start IIS
Write-Host "Starting IIS..." -ForegroundColor Yellow
Start-Service W3SVC

Write-Host ""
Write-Host "✅ Deployed!" -ForegroundColor Green
Write-Host "Frontend: https://secretapp.enzolopez.net" -ForegroundColor Cyan
Write-Host "Backend API: https://secretapp.enzolopez.net/api/test" -ForegroundColor Cyan
Write-Host ""
Write-Host "Clear cache: Ctrl+F5 or Ctrl+Shift+Delete" -ForegroundColor Yellow
