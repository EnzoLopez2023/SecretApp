# 🔧 BLANK PAGE FIX - Final Instructions

## 🎯 The Problem

Your domain `secretapp.enzolopez.net` is pointing to `C:\inetpub\wwwroot\secretapp`, but the files were built with the wrong base path.

## ✅ The Fix (Already Applied)

I've rebuilt your app with the correct settings:
- ✅ `vite.config.ts` - Set `base: '/'` (root path)
- ✅ `web.config` - Fixed rewrite rules  
- ✅ Build completed - Files in `dist/` folder are correct

## 🚀 Deploy Instructions

### **Run PowerShell as Administrator**

1. **Close current PowerShell**
2. **Search for "PowerShell"** in Start Menu
3. **Right-click** → **Run as Administrator**
4. **Navigate to project:**
   ```powershell
   cd C:\Source\Repo\SecretApp
   ```

5. **Run deploy script:**
   ```powershell
   .\quick-deploy.ps1
   ```

### **OR Deploy Manually:**

```powershell
# In Administrator PowerShell:
cd C:\Source\Repo\SecretApp

# Stop IIS
Stop-Service W3SVC -Force

# Wait a moment
Start-Sleep -Seconds 2

# Delete old files
Remove-Item "C:\inetpub\wwwroot\secretapp\*" -Recurse -Force

# Copy new files
Copy-Item -Path "dist\*" -Destination "C:\inetpub\wwwroot\secretapp\" -Recurse -Force

# Start IIS
Start-Service W3SVC

Write-Host "✅ Deployed!" -ForegroundColor Green
```

## 🧪 Test After Deployment

1. **Clear browser cache:**
   - Press: **Ctrl + Shift + Delete**
   - Select: "Cached images and files"
   - Click: "Clear data"
   
   **OR** use hard refresh: **Ctrl + F5**

2. **Visit:** `http://secretapp.enzolopez.net`

3. **Expected Result:** App loads with full interface!

## 🔍 What Changed

### **Before (Wrong):**
```html
<!-- Old build with /secretapp/ prefix -->
<script src="/secretapp/assets/index-xxx.js"></script>
```

Browser looks for: `http://secretapp.enzolopez.net/secretapp/assets/index-xxx.js`  
Server path: `C:\inetpub\wwwroot\secretapp\secretapp\assets\...` ❌ (doesn't exist)

### **After (Correct):**
```html
<!-- New build with / prefix -->
<script src="/assets/index-xxx.js"></script>
```

Browser looks for: `http://secretapp.enzolopez.net/assets/index-xxx.js`  
Server path: `C:\inetpub\wwwroot\secretapp\assets\...` ✅ (exists!)

## 🎯 Summary

**Issue:** Files built with wrong base path (`/secretapp/`) when domain points to root  
**Fix:** Rebuilt with `base: '/'` for root deployment  
**Action:** Deploy as Administrator using script above  
**Result:** App will load correctly!

---

## 🆘 Still Blank After Deploy?

If you still see a blank page AFTER deploying as Administrator:

### **1. Verify files deployed:**
```powershell
Get-ChildItem C:\inetpub\wwwroot\secretapp
```

Should show:
- `assets/` folder
- `index.html`
- `web.config`
- `vite.svg`

### **2. Check index.html content:**
```powershell
Get-Content C:\inetpub\wwwroot\secretapp\index.html
```

Should show:
```html
<script type="module" crossorigin src="/assets/index-DsIqzRf-.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-xggFP_g7.css">
```

(Note: `/assets/` not `/secretapp/assets/`)

### **3. Open browser console (F12):**
- Look for red errors
- Check if assets are loading
- Look for 404 errors

### **4. Test backend:**
```powershell
pm2 status
```

Should show `server` is `online`

Test API:
```
http://secretapp.enzolopez.net:3001/api/projects
```

Should return JSON data

---

## ✅ Everything is Ready

**The build is correct - just needs deployment as Administrator!**

Run this in Administrator PowerShell:
```powershell
cd C:\Source\Repo\SecretApp
.\quick-deploy.ps1
```

Then clear cache (Ctrl+F5) and test!
