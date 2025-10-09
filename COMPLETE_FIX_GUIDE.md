# 🔧 COMPLETE FIX - Step by Step

## 📋 Summary
Your app is failing to load because:
1. ✅ Build is correct (runtime check working)
2. ✅ Files have correct paths
3. ❌ Files not deployed (need Administrator)
4. ❌ PM2 daemon error (backend may not be running)

---

## 🚀 Fix Steps (DO THESE IN ORDER)

### **Step 1: Fix PM2 Backend**

**Run PowerShell as Administrator**, then:

```powershell
cd C:\Source\Repo\SecretApp

# Kill any stuck PM2 processes
taskkill /F /IM PM2.exe 2>$null
taskkill /F /IM node.exe /FI "WINDOWTITLE eq*PM2*" 2>$null

# Delete PM2 cache
Remove-Item C:\Users\enzol\.pm2\rpc.sock -Force -ErrorAction SilentlyContinue
Remove-Item C:\Users\enzol\.pm2\pub.sock -Force -ErrorAction SilentlyContinue

# Restart PM2
pm2 kill
Start-Sleep -Seconds 2
pm2 start server.js --name server
pm2 save
pm2 list

# Should show "server" as "online"
```

### **Step 2: Deploy Frontend**

**Still in Administrator PowerShell:**

```powershell
cd C:\Source\Repo\SecretApp

# Stop IIS
Stop-Service W3SVC -Force

# Wait
Start-Sleep -Seconds 2

# Clean old files
Remove-Item "C:\inetpub\wwwroot\secretapp\*" -Recurse -Force

# Copy new build
Copy-Item -Path "dist\*" -Destination "C:\inetpub\wwwroot\secretapp\" -Recurse -Force

# Verify files copied
Get-ChildItem C:\inetpub\wwwroot\secretapp

# Should show: assets/, index.html, web.config, vite.svg

# Start IIS
Start-Service W3SVC

Write-Host ""
Write-Host "✅ Deployed!" -ForegroundColor Green
Write-Host "Test at: http://secretapp.enzolopez.net" -ForegroundColor Cyan
```

### **Step 3: Test**

1. **Clear browser cache:**
   - Press `Ctrl + Shift + Delete`
   - Select "Cached images and files"
   - Click "Clear data"

2. **Hard refresh:**
   - Press `Ctrl + F5`

3. **Visit:**
   ```
   http://secretapp.enzolopez.net
   ```

4. **Open browser console (F12):**
   - Look for any red errors
   - Check Network tab for 404s

5. **Test backend:**
   ```
   http://secretapp.enzolopez.net:3001/api/projects
   ```
   Should return JSON

---

## 🧪 Diagnostic Tests

### **Test 1: Check deployed files**
```powershell
Get-Content C:\inetpub\wwwroot\secretapp\index.html | Select-String "DA09k6fa"
```
**Expected:** Should find `index-DA09k6fa.js`

### **Test 2: Check assets exist**
```powershell
Test-Path C:\inetpub\wwwroot\secretapp\assets\index-DA09k6fa.js
```
**Expected:** `True`

### **Test 3: Test IIS is serving files**
Visit: `http://secretapp.enzolopez.net/vite.svg`
**Expected:** See Vite logo

### **Test 4: Check backend**
```powershell
pm2 list
```
**Expected:** `server` status `online`

```powershell
curl http://localhost:3001/api/projects
```
**Expected:** JSON response

---

## 🔍 What Each File Does

### **index.html** (Entry point)
- Loads React app
- Points to `/assets/index-DA09k6fa.js`

### **index-DA09k6fa.js** (Main app bundle)
- Contains all React code
- Has runtime check: `window.location.hostname === 'localhost'`
- If NOT localhost → renders App directly (no login)
- If localhost → shows login page

### **web.config** (IIS configuration)
- Rewrites all routes to `/index.html` (SPA routing)
- Proxies `/api/*` to Node.js on port 3001

### **server.js** (Backend API)
- Runs on port 3001
- Provides `/api/projects` endpoints
- Connects to MySQL database

---

## ❓ Troubleshooting

### **Still blank after deploy?**

1. **Check browser console (F12 → Console tab):**
   - Look for JavaScript errors
   - Look for "Failed to load" messages

2. **Check network tab (F12 → Network tab):**
   - Refresh page
   - Look for red items (failed requests)
   - Check if `index-DA09k6fa.js` loads (should be 200 OK)

3. **Verify correct file deployed:**
   ```powershell
   Get-Content C:\inetpub\wwwroot\secretapp\index.html
   ```
   Should show:
   ```html
   <script type="module" crossorigin src="/assets/index-DA09k6fa.js"></script>
   ```

### **Backend not working?**

```powershell
# Check PM2 status
pm2 list

# If "errored" or "stopped":
pm2 delete server
pm2 start server.js --name server

# Check logs
pm2 logs server --lines 50
```

### **Can't access from other computers?**

Check Windows Firewall:
```powershell
# Check if port 3001 rule exists
Get-NetFirewallRule -DisplayName "*3001*"

# If not, create it:
New-NetFirewallRule -DisplayName "Node.js Backend Port 3001" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
```

---

## ✅ Expected Result

After completing all steps:

1. **Visit:** `http://secretapp.enzolopez.net`
2. **See:** Full app interface (no login page)
3. **Test:** All navigation buttons work
4. **Test:** Woodworking Projects loads data from database

---

## 📝 Quick Reference

| Component | Status Check | Fix Command |
|-----------|-------------|-------------|
| **Frontend** | Visit URL | Deploy as Admin |
| **Backend** | `pm2 list` | `pm2 restart server` |
| **IIS** | Test file loads | `Restart-Service W3SVC` |
| **Database** | Click Test button in app | Check MySQL service |

---

## 🆘 If Nothing Works

1. **Take screenshot of browser console errors**
2. **Run these commands and save output:**
   ```powershell
   pm2 list
   Get-ChildItem C:\inetpub\wwwroot\secretapp
   Get-Content C:\inetpub\wwwroot\secretapp\index.html | Select-String "assets"
   Test-NetConnection localhost -Port 3001
   ```

3. **Check if files match:**
   ```powershell
   # This should match the deployed version
   Get-Content dist\index.html | Select-String "assets"
   Get-Content C:\inetpub\wwwroot\secretapp\index.html | Select-String "assets"
   ```

---

## 🎯 Next Steps

**RUN THIS NOW:**

```powershell
# Open PowerShell as Administrator
# Then run these commands:

cd C:\Source\Repo\SecretApp

# Fix PM2
pm2 kill
pm2 start server.js --name server
pm2 save

# Deploy frontend
Stop-Service W3SVC -Force
Remove-Item "C:\inetpub\wwwroot\secretapp\*" -Recurse -Force
Copy-Item -Path "dist\*" -Destination "C:\inetpub\wwwroot\secretapp\" -Recurse -Force
Start-Service W3SVC

# Test
Write-Host "✅ Done! Test at: http://secretapp.enzolopez.net" -ForegroundColor Green
Write-Host "Clear cache: Ctrl+F5" -ForegroundColor Yellow
```

**Then test in browser!**

---

## ✨ Summary

The code is correct - you just need to:
1. Fix PM2 (backend)
2. Deploy as Administrator (frontend)
3. Clear browser cache
4. Test!

**Everything is ready to go - just follow the steps above!** 🚀
