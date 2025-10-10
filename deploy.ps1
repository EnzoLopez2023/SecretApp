#requires -RunAsAdministrator

Write-Host "🚀 Starting SecretApp deployment" -ForegroundColor Cyan

# Change to project directory
Set-Location -Path "C:\Source\Repo\SecretApp"

# Build full deployment package
Write-Host "📦 Building application (npm run build:full)" -ForegroundColor Yellow
npm run build:full

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed. Aborting deployment." -ForegroundColor Red
    exit 1
}

# Stop IIS (W3SVC service)
Write-Host "⛔ Stopping IIS (W3SVC)" -ForegroundColor Yellow
Stop-Service -Name W3SVC -Force

# Deploy dist contents to IIS site folder
Write-Host "📁 Copying build artifacts to IIS site" -ForegroundColor Yellow
xcopy /E /Y "C:\Source\Repo\SecretApp\dist\*" "C:\inetpub\wwwroot\secretapp\" | Out-Null

# Restart backend API via PM2
Write-Host "🔄 Restarting PM2 backend" -ForegroundColor Yellow
pm2 restart secretapp-backend

# Start IIS service again
Write-Host "▶️ Starting IIS (W3SVC)" -ForegroundColor Yellow
Start-Service -Name W3SVC

# Health checks
Write-Host "🔍 Running API health checks..." -ForegroundColor Cyan

# Test API base
curl.exe -k https://secretapp.enzolopez.net/api/test | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Base health check failed" -ForegroundColor Red
} else {
    Write-Host "✅ Base health check passed" -ForegroundColor Green
}

# Test projects endpoint
curl.exe -k https://secretapp.enzolopez.net/api/projects | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Projects endpoint reachable" -ForegroundColor Green
} else {
    Write-Host "❌ Projects endpoint failed" -ForegroundColor Red
}

# Test inventory endpoint
curl.exe -k https://secretapp.enzolopez.net/api/inventory | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Inventory endpoint reachable" -ForegroundColor Green
} else {
    Write-Host "❌ Inventory endpoint failed" -ForegroundColor Red
}

Write-Host "🏁 Deployment script complete" -ForegroundColor Cyan

# Build full deployment package
npm run build:full

# Stop IIS (W3SVC service)
Stop-Service -Name W3SVC -Force

# Deploy dist contents to IIS site folder
xcopy /E /Y "C:\Source\Repo\SecretApp\dist\*" "C:\inetpub\wwwroot\secretapp\"

# Restart backend API via PM2
pm2 restart secretapp-backend

# Start IIS service again
Start-Service -Name W3SVC

# Health checks
Write-Host "Running API health checks..." -ForegroundColor Cyan

# Test API base
curl.exe -k https://secretapp.enzolopez.net/api/test

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
