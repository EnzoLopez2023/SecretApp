# Deployment Scripts Updated ✅

Both deployment scripts have been updated to include backend checks and fixes to prevent the 502 errors.

## Updated Scripts

### 1. `quick-deploy.ps1` ✅
**Purpose**: Fast deployment (no rebuild, just deploy pre-built files)

**New Features Added**:
- ✅ Check for node_modules, install if missing
- ✅ Create logs directory automatically
- ✅ Smart PM2 restart (restart if running, start if stopped)
- ✅ Verify backend is online after deployment
- ✅ Show both frontend and backend URLs

**Usage**:
```powershell
# First, build the app
npm run build

# Then deploy (run as Administrator)
.\quick-deploy.ps1
```

### 2. `deploy.ps1` ✅
**Purpose**: Full deployment (builds app, then deploys)

**New Features Added**:
- ✅ Check for node_modules, install if missing
- ✅ Create logs directory automatically  
- ✅ Smart PM2 restart (restart if running, start if stopped)
- ✅ Verify backend is online after deployment
- ✅ Existing health checks for API endpoints

**Usage**:
```powershell
# Run as Administrator (builds and deploys in one step)
.\deploy.ps1
```

## What Both Scripts Now Do

### 📦 **Frontend Deployment**
1. Stop IIS service
2. Clean deployment directory
3. Copy built files from `dist/` to `C:\inetpub\wwwroot\secretapp\`
4. Start IIS service

### 🔧 **Backend Deployment** (NEW!)
1. **Check Dependencies**
   - Test if `node_modules` exists
   - If missing: run `npm install --production`
   - If exists: skip installation (saves time)

2. **Create Logs Directory**
   - Ensure `logs/` directory exists
   - PM2 needs this for error and output logs

3. **Smart PM2 Management**
   - Try to restart existing process
   - If restart fails: start new process
   - Save PM2 configuration for persistence

4. **Verification**
   - Wait 2 seconds for startup
   - Check if backend is actually online
   - Display status message

## Before vs After

### ❌ Before (Old Scripts)
```powershell
# Just restart PM2
pm2 restart secretapp-backend

# Problems:
# - No check if node_modules exist
# - No logs directory creation
# - No verification if restart succeeded
# - Backend would crash immediately
```

### ✅ After (Updated Scripts)
```powershell
# Check dependencies
if (node_modules missing) {
    npm install --production
}

# Create logs directory
New-Item logs/ -Force

# Smart restart/start
pm2 restart || pm2 start ecosystem.config.cjs

# Verify it's running
Check: pm2 list | grep "online"
```

## Output Example

When you run either script, you'll see:

```
🚀 Deploying to IIS...
Stopping IIS...
Cleaning C:\inetpub\wwwroot\secretapp...
Copying new build...
Checking backend dependencies...
Backend dependencies already installed ✓
Ensuring logs directory exists...
Restarting backend server...
Backend server is running ✓
Starting IIS...

✅ Deployed!
Frontend: https://secretapp.enzolopez.net
Backend API: https://secretapp.enzolopez.net/api/test

Clear cache: Ctrl+F5 or Ctrl+Shift+Delete
```

## Key Improvements

### 1. **Prevents 502 Errors**
   - Missing node_modules was causing backend crashes
   - Scripts now ensure dependencies are installed

### 2. **Prevents PM2 Crashes**
   - Missing logs directory caused instant crashes
   - Scripts now create directory automatically

### 3. **Smarter Process Management**
   - Old: Just blindly restart (would fail if not running)
   - New: Try restart, fall back to start if needed

### 4. **Better Feedback**
   - Old: No indication if backend started successfully
   - New: Verifies and reports backend status

### 5. **Faster Deployments**
   - Only installs node_modules if they're missing
   - Subsequent deployments skip the npm install step

## Testing the Updated Scripts

### Test `quick-deploy.ps1`
```powershell
# 1. Build first
npm run build

# 2. Deploy (as Administrator)
.\quick-deploy.ps1

# 3. Verify
curl https://secretapp.enzolopez.net/api/test
# Should return: {"success":true,"message":"Connected to MySQL database!"}
```

### Test `deploy.ps1`
```powershell
# Run as Administrator (builds and deploys)
.\deploy.ps1

# Verify
curl https://secretapp.enzolopez.net/api/test
# Should return: {"success":true,"message":"Connected to MySQL database!"}
```

## Troubleshooting

If backend still doesn't start:

1. **Check PM2 logs**:
   ```powershell
   cd C:\inetpub\wwwroot\secretapp
   pm2 logs secretapp-backend
   ```

2. **Check if port 3001 is in use**:
   ```powershell
   netstat -ano | findstr :3001
   ```

3. **Manually verify node_modules**:
   ```powershell
   Test-Path C:\inetpub\wwwroot\secretapp\node_modules
   ```

4. **Check MySQL connection**:
   ```powershell
   # From deployment directory
   node -e "require('./server.js')"
   ```

## Future Deployments

Both scripts are now production-ready and handle:
- ✅ Frontend build and deployment
- ✅ Backend dependency management
- ✅ PM2 process management
- ✅ Automatic error recovery
- ✅ Verification and reporting

Just run one of the scripts and everything will be configured correctly!

## Summary

| Feature | Old Scripts | New Scripts |
|---------|-------------|-------------|
| Install node_modules | ❌ | ✅ Auto-detect and install |
| Create logs directory | ❌ | ✅ Auto-create |
| Smart PM2 restart | ❌ | ✅ Restart or start as needed |
| Verify backend online | ❌ | ✅ Check and report status |
| Production mode | ❌ | ✅ Uses --production flag |
| Error recovery | ❌ | ✅ Falls back to start if restart fails |

**Both deployment scripts are now bulletproof!** 🛡️
