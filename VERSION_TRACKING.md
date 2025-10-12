# Version Tracking System

This project includes an automated version tracking system to help track builds deployed to IIS.

## Version Format
- **Version**: `major.minor.patch` (semantic versioning)
- **Build**: Auto-incrementing build number
- **Full Version**: `major.minor.patch.build` (e.g., `1.0.0.15`)

## Usage

### Quick Commands
```bash
# Increment build number only (most common)
npm run version:build

# Increment patch version (1.0.0 → 1.0.1, build resets to 1)
npm run version:patch

# Increment minor version (1.0.0 → 1.1.0, build resets to 1)
npm run version:minor

# Increment major version (1.0.0 → 2.0.0, build resets to 1)
npm run version:major
```

### Deployment Commands
```bash
# Build and deploy with build increment
npm run deploy

# Build and deploy with patch increment
npm run deploy:patch

# Build and deploy with minor increment
npm run deploy:minor
```

### Manual PowerShell Commands
```powershell
# Increment build and commit changes
.\increment-version.ps1 -Type build -Message "Bug fixes"

# Full deployment with version increment
.\deploy-with-version.ps1 -VersionType patch -DeployMessage "Feature release"
```

## Files Created
- `version.json` - Contains version information
- `increment-version.ps1` - PowerShell script to increment versions
- `deploy-with-version.ps1` - Deployment script with version tracking
- `src/utils/version.ts` - Utility functions for version info
- `src/components/VersionDisplay.tsx` - Component to display version in app

## Workflow
1. Make your code changes
2. Run `npm run version:build` to increment build number
3. Run `npm run deploy` to build and prepare for IIS deployment
4. Deploy the `dist/` folder to your IIS server
5. The version info will be available at `/version.json` on your deployed site

## Version Display in App
Import and use the VersionDisplay component anywhere in your app:
```tsx
import VersionDisplay from './components/VersionDisplay';

// In your component
<VersionDisplay variant="chip" size="small" />
```

## IIS Deployment
After running the deploy script, copy the entire `dist/` folder contents to your IIS website directory. The version information will be accessible at `yoursite.com/version.json`.