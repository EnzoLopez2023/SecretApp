# deploy-with-version.ps1
# Build and deploy script that includes version tracking

param(
    [string]$VersionType = "build",
    [string]$DeployMessage = "Deployment"
)

Write-Host "🚀 Starting deployment with version tracking..." -ForegroundColor Green

# Step 1: Increment version
Write-Host "`n📦 Incrementing version..." -ForegroundColor Yellow
.\increment-version.ps1 -Type $VersionType -Message $DeployMessage

# Step 2: Get version info for display
$versionInfo = Get-Content "version.json" | ConvertFrom-Json
$fullVersion = "$($versionInfo.version).$($versionInfo.build)"

Write-Host "`n🔨 Building application..." -ForegroundColor Yellow
npm run build:full

# Step 3: Copy version info to dist folder for runtime access
Write-Host "`n📋 Copying version info to dist..." -ForegroundColor Yellow
Copy-Item "version.json" "dist/version.json" -Force

# Step 4: Display deployment summary
Write-Host "`n✅ Deployment preparation complete!" -ForegroundColor Green
Write-Host "Version: $fullVersion" -ForegroundColor Cyan
Write-Host "Build timestamp: $($versionInfo.timestamp)" -ForegroundColor Gray
Write-Host "Files ready in dist/ folder for IIS deployment" -ForegroundColor Yellow

# Step 5: Optional - Push to git
$pushChoice = Read-Host "`nPush changes to git? (y/n)"
if ($pushChoice -eq "y" -or $pushChoice -eq "Y") {
    Write-Host "Pushing to git..." -ForegroundColor Yellow
    git push origin main
    Write-Host "✅ Pushed to git successfully!" -ForegroundColor Green
}

Write-Host "`n🎉 Ready to deploy version $fullVersion to IIS!" -ForegroundColor Green