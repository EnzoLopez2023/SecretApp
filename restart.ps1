#requires -RunAsAdministrator
cd C:\Source\Repo\SecretApp\
Write-Host "Restarting SecretApp services (no build/deploy)" -ForegroundColor Cyan

# Stop IIS (W3SVC service)
Write-Host "Stopping IIS (W3SVC)" -ForegroundColor Yellow
Stop-Service -Name W3SVC -Force

# Ensure logs directory exists
Write-Host "Ensuring logs directory exists..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "C:\inetpub\wwwroot\secretapp\logs" | Out-Null

# Restart backend API via PM2
Write-Host "Restarting PM2 backend..." -ForegroundColor Yellow
pm2 restart workshop-studio-backend 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "Backend not running, starting it..." -ForegroundColor Yellow
    Push-Location "C:\inetpub\wwwroot\secretapp"
    pm2 start ecosystem.config.cjs
    pm2 save
    Pop-Location
}

# Verify PM2 backend is running
Start-Sleep -Seconds 2
$pm2Status = pm2 list | Select-String "workshop-studio-backend.*online"
if ($pm2Status) {
    Write-Host "Backend server is running" -ForegroundColor Green
} else {
    Write-Host "WARNING: Backend server may not be running properly" -ForegroundColor Yellow
    Write-Host "Check with: pm2 logs workshop-studio-backend" -ForegroundColor Yellow
}

# Start IIS service again
Write-Host "Starting IIS (W3SVC)" -ForegroundColor Yellow
Start-Service -Name W3SVC

# Health checks
Write-Host "Running API health checks..." -ForegroundColor Cyan

# Test API base
Start-Sleep -Seconds 2
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

Write-Host "Restart complete" -ForegroundColor Cyan
Write-Host "Frontend: https://secretapp.enzolopez.net" -ForegroundColor Green
Write-Host "Check PM2 status: pm2 list" -ForegroundColor Yellow
Write-Host "Check PM2 logs: pm2 logs workshop-studio-backend" -ForegroundColor Yellow
