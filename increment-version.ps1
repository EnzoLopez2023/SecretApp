# increment-version.ps1
# This script increments the build number and updates version information

param(
    [string]$Type = "build",  # Options: major, minor, patch, build
    [string]$Message = ""
)

# Read current version.json
$versionPath = "version.json"
$packagePath = "package.json"

if (Test-Path $versionPath) {
    $versionInfo = Get-Content $versionPath | ConvertFrom-Json
} else {
    # Create initial version if doesn't exist
    $versionInfo = @{
        version = "1.0.0"
        build = 0
        timestamp = ""
        commit = ""
        branch = ""
    }
}

# Get current git info
try {
    $currentCommit = git rev-parse --short HEAD
    $currentBranch = git branch --show-current
} catch {
    $currentCommit = "unknown"
    $currentBranch = "unknown"
}

# Parse current version
$versionParts = $versionInfo.version -split '\.'
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]
$build = [int]$versionInfo.build

# Increment based on type
switch ($Type.ToLower()) {
    "major" {
        $major++
        $minor = 0
        $patch = 0
        $build = 1
    }
    "minor" {
        $minor++
        $patch = 0
        $build = 1
    }
    "patch" {
        $patch++
        $build = 1
    }
    "build" {
        $build++
    }
}

# Create new version info
$newVersion = "$major.$minor.$patch"
$newVersionInfo = @{
    version = $newVersion
    build = $build
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    commit = $currentCommit
    branch = $currentBranch
}

# Update version.json
$newVersionInfo | ConvertTo-Json -Depth 3 | Set-Content $versionPath

# Copy to public folder for development access
if (Test-Path "public") {
    Copy-Item $versionPath "public/version.json" -Force
}

# Update package.json version
if (Test-Path $packagePath) {
    $packageContent = Get-Content $packagePath | ConvertFrom-Json
    $packageContent.version = $newVersion
    $packageContent | ConvertTo-Json -Depth 10 | Set-Content $packagePath
}

# Display results
Write-Host "Version updated successfully!" -ForegroundColor Green
Write-Host "Version: $newVersion" -ForegroundColor Cyan
Write-Host "Build: $build" -ForegroundColor Cyan
Write-Host "Full Version: $newVersion.$build" -ForegroundColor Yellow
Write-Host "Commit: $currentCommit" -ForegroundColor Gray
Write-Host "Branch: $currentBranch" -ForegroundColor Gray

# Optional: Add and commit the version files
if ($Message) {
    Write-Host "`nCommitting version update..." -ForegroundColor Yellow
    git add version.json package.json
    git commit -m "chore: bump version to $newVersion build $build - $Message"
    Write-Host "Version committed with message: $Message" -ForegroundColor Green
}