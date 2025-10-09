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

# Start IIS
Write-Host "Starting IIS..." -ForegroundColor Yellow
Start-Service W3SVC

Write-Host ""
Write-Host "✅ Deployed!" -ForegroundColor Green
Write-Host "Test at: http://secretapp.enzolopez.net" -ForegroundColor Cyan
Write-Host ""
Write-Host "Clear cache: Ctrl+F5 or Ctrl+Shift+Delete" -ForegroundColor Yellow
