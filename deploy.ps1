#requires -RunAsAdministrator

Write-Host "Starting SecretApp deployment" -ForegroundColor Cyan

# Change to project directory
Set-Location -Path "C:\Source\Repo\SecretApp"

# Increment version
Write-Host "Incrementing build version..." -ForegroundColor Yellow
.\increment-version.ps1 -Type build

# Build full deployment package
Write-Host "Building application (npm run build:full)" -ForegroundColor Yellow
npm run build:full

if ($LASTEXITCODE -ne 0) {
    Write-Host "Build failed. Aborting deployment." -ForegroundColor Red
    exit 1
}

# Stop IIS (W3SVC service)
Write-Host "Stopping IIS (W3SVC)" -ForegroundColor Yellow
Stop-Service -Name W3SVC -Force

# Deploy dist contents to IIS site folder
Write-Host "Copying build artifacts to IIS site" -ForegroundColor Yellow
xcopy /E /Y "C:\Source\Repo\SecretApp\dist\*" "C:\inetpub\wwwroot\secretapp\" | Out-Null

# Copy version.json to site for runtime access
Write-Host "Copying version info..." -ForegroundColor Yellow
xcopy /Y "C:\Source\Repo\SecretApp\version.json" "C:\inetpub\wwwroot\secretapp\" | Out-Null

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

# Restart backend API via PM2
Write-Host "Restarting PM2 backend..." -ForegroundColor Yellow
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

# Start IIS service again
Write-Host "Starting IIS (W3SVC)" -ForegroundColor Yellow
Start-Service -Name W3SVC

# Health checks
Write-Host "Running API health checks..." -ForegroundColor Cyan

# Test API base
curl.exe -k https://secretapp.enzolopez.net/api/test | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Base health check failed" -ForegroundColor Red
} else {
    Write-Host "Base health check passed" -ForegroundColor Green
}

# Test projects endpoint
curl.exe -k https://secretapp.enzolopez.net/api/projects | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Projects endpoint reachable" -ForegroundColor Green
} else {
    Write-Host "Projects endpoint failed" -ForegroundColor Red
}

# Test inventory endpoint
curl.exe -k https://secretapp.enzolopez.net/api/inventory | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Inventory endpoint reachable" -ForegroundColor Green
} else {
    Write-Host "Inventory endpoint failed" -ForegroundColor Red
}

# Display deployed version
$versionInfo = Get-Content "version.json" | ConvertFrom-Json
$fullVersion = "$($versionInfo.version).$($versionInfo.build)"

Write-Host "Deployment script complete" -ForegroundColor Cyan
Write-Host "Deployed version: $fullVersion" -ForegroundColor Green
Write-Host "Build timestamp: $($versionInfo.timestamp)" -ForegroundColor Green
