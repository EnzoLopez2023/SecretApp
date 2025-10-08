# Complete Development & Deployment Guide - SecretApp
## From Scratch Setup Guide for IIS Production Deployment

**Last Updated:** October 8, 2025  
**Application:** SecretApp - React/Node.js/MySQL Full Stack App  
**Features:** Halloween Movie Selector, Woodworking Projects CRUD with file uploads

---

## 📋 Table of Contents

1. [Development Environment Setup](#development-environment-setup)
2. [IIS Server Prerequisites](#iis-server-prerequisites)
3. [MySQL Database Setup](#mysql-database-setup)
4. [Application Configuration](#application-configuration)
5. [Building for Production](#building-for-production)
6. [IIS Deployment](#iis-deployment)
7. [PM2 Process Manager Setup](#pm2-process-manager-setup)
8. [Testing & Verification](#testing--verification)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Maintenance & Updates](#maintenance--updates)

---

## 1. Development Environment Setup

### **Prerequisites on Development Machine:**

1. **Node.js (v22.20.0 or later)**
   - Download: https://nodejs.org/
   - Verify: `node --version` should show v22.20.0+
   - Verify: `npm --version`

2. **Git (for version control)**
   - Download: https://git-scm.com/
   - Verify: `git --version`

3. **VS Code (recommended)**
   - Download: https://code.visualstudio.com/

### **Clone and Setup Project:**

```powershell
# Clone the repository
git clone https://github.com/EnzoLopez2023/SecretApp.git
cd SecretApp

# Install dependencies
npm install

# The project uses ES modules (type: "module" in package.json)
```

### **Key Dependencies Installed:**

**Frontend:**
- react: ^19.1.1
- react-dom: ^19.1.1
- vite: ^7.1.9 (build tool)
- typescript: ~6.0.1
- tailwindcss: ^4.1.14
- lucide-react: ^0.544.0 (icons)

**Backend:**
- express: ^5.1.0 (API server)
- cors: ^2.8.5 (CORS support)
- mysql2: ^3.15.2 (MySQL driver)

**Process Management:**
- pm2 (installed globally on IIS server)

### **Development Scripts:**

```json
{
  "dev": "vite",                    // Start dev server (port 5173)
  "server": "node server.js",       // Start backend (port 3001)
  "build": "tsc -b && vite build",  // TypeScript + Vite build
  "build:full": "npm run build && xcopy /Y server.js dist\\ && xcopy /Y web.config dist\\ && xcopy /Y package.json dist\\ && xcopy /Y ecosystem.config.cjs dist\\",
  "preview": "vite preview"
}
```

### **Project Structure:**

```
SecretApp/
├── src/
│   ├── App.tsx                      # Main routing component
│   ├── ChatApp.tsx                  # Navigation hub
│   ├── HalloweenMovieSelector.tsx  # Plex movie browser
│   ├── WoodworkingProjects.tsx     # MySQL CRUD app
│   ├── services/
│   │   └── projectService.ts       # MySQL API service layer
│   └── utils/
│       └── sharepointService.ts    # DEPRECATED - not used
├── server.js                        # Express backend API
├── package.json
├── vite.config.ts
├── tsconfig.json
├── web.config                       # IIS configuration
├── ecosystem.config.cjs             # PM2 configuration
├── MYSQL_SETUP.md                   # Database setup guide
└── dist/                            # Build output (created by build)
```

---

## 2. IIS Server Prerequisites

### **Required Software on IIS Server:**

#### **A. Windows Server / Windows 10/11 with IIS**

**Install IIS:**
1. Open "Turn Windows features on or off"
2. Check "Internet Information Services"
3. Expand and check:
   - Web Management Tools → IIS Management Console
   - World Wide Web Services → Application Development Features → All items
   - World Wide Web Services → Common HTTP Features → All items
4. Click OK and restart

**Verify IIS:**
- Open IIS Manager: `inetmgr` in Run dialog
- Default website should be running
- Browse to http://localhost - should see IIS default page

#### **B. URL Rewrite Module (Optional - we bypassed this)**

Download from: https://www.iis.net/downloads/microsoft/url-rewrite

**Note:** We ended up NOT using URL Rewrite proxy because it requires Application Request Routing (ARR). Instead, the app connects directly to port 3001.

#### **C. Node.js on IIS Server**

**Install Node.js v22.20.0+:**
1. Download Windows installer: https://nodejs.org/
2. Run installer with default options
3. **Important:** Check "Automatically install necessary tools" (includes build tools)
4. Restart PowerShell after installation

**Verify:**
```powershell
node --version   # Should show v22.20.0+
npm --version    # Should show 10.x.x+
```

#### **D. PM2 Process Manager (Global Install)**

PM2 keeps the Node.js backend running and auto-restarts on crashes.

```powershell
# Install PM2 globally
npm install -g pm2

# Install PM2 Windows startup service
npm install -g pm2-windows-startup
pm2-startup install

# Verify
pm2 --version
```

#### **E. MySQL Server 8.0+**

**Download MySQL:**
1. Visit: https://dev.mysql.com/downloads/mysql/
2. Download MySQL Community Server (Windows x64)
3. Use MySQL Installer for easier setup

**Installation Steps:**
1. Run MySQL Installer
2. Choose "Server Only" or "Full" installation
3. Configuration:
   - Server Configuration Type: **Development Computer** (or Dedicated Server)
   - Port: **3306** (default)
   - Root Password: Set a strong password (save it!)
   - Windows Service: **MySQL80** (start at system startup)
   - Create Windows Service: **Yes**
4. Complete installation

**Verify MySQL is Running:**
```powershell
# Check Windows Service
Get-Service MySQL80

# Should show "Running"
```

**MySQL Workbench (Optional but Recommended):**
- Included in full MySQL installer
- GUI for managing databases, running queries
- Very helpful for debugging

---

## 3. MySQL Database Setup

### **Step 1: Access MySQL**

**Option A: Using MySQL Command Line:**
```powershell
# Open MySQL Command Line Client (from Start Menu)
# Enter root password when prompted
```

**Option B: Using MySQL Workbench:**
1. Open MySQL Workbench
2. Connect to "Local instance MySQL80"
3. Use root password

### **Step 2: Create Database and User**

Run these SQL commands:

```sql
-- Create the database
CREATE DATABASE woodworking_projects;

-- Create the application user
CREATE USER 'secretapp'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON woodworking_projects.* TO 'secretapp'@'localhost';
FLUSH PRIVILEGES;

-- Switch to the new database
USE woodworking_projects;
```

### **Step 3: Create Tables**

```sql
-- Projects table
CREATE TABLE projects (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    materials TEXT,
    description TEXT,
    status ENUM('planned', 'in-progress', 'completed') DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Project files table (files stored as LONGBLOB in database)
CREATE TABLE project_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_data LONGBLOB NOT NULL,
    file_type VARCHAR(100),
    file_size INT NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_project_id ON project_files(project_id);
```

### **Step 4: Verify Tables**

```sql
-- Check tables were created
SHOW TABLES;

-- Should show:
-- +-------------------------------+
-- | Tables_in_woodworking_projects|
-- +-------------------------------+
-- | project_files                 |
-- | projects                      |
-- +-------------------------------+

-- Check projects table structure
DESCRIBE projects;

-- Check project_files table structure  
DESCRIBE project_files;
```

### **Step 5: Configure MySQL for Large Files**

By default, MySQL limits packet size to 64MB. To upload larger files:

```sql
-- Check current setting
SHOW VARIABLES LIKE 'max_allowed_packet';

-- Increase to 100MB (optional, if you need large file uploads)
SET GLOBAL max_allowed_packet=104857600;
```

**Make it permanent:**
Edit `my.ini` file (usually in `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`):

```ini
[mysqld]
max_allowed_packet=100M
```

Restart MySQL service:
```powershell
Restart-Service MySQL80
```

### **Step 6: Test Connection**

```sql
-- Test that user can access database
-- Login as secretapp user in MySQL Workbench
-- Connection name: secretapp
-- Username: secretapp
-- Password: YourSecurePassword123!
-- Database: woodworking_projects

-- Run test query
SELECT 'Database connection successful!' AS message;
```

---

## 4. Application Configuration

### **Backend Configuration (server.js)**

The backend connects to MySQL and provides REST APIs:

**MySQL Connection Settings:**

```javascript
// In server.js - Update these to match your MySQL setup
const pool = mysql.createPool({
  host: 'localhost',           // MySQL server (usually localhost)
  user: 'secretapp',           // Database user we created
  password: 'YourSecurePassword123!',  // Password from Step 3.2
  database: 'woodworking_projects',    // Database name
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})
```

**Backend runs on port 3001** (configured in server.js):
```javascript
const PORT = 3001
app.listen(PORT, () => {
  console.log(`🚀 SharePoint API Server running on http://localhost:${PORT}`)
})
```

### **Frontend Configuration**

The frontend uses environment detection to choose API URLs:

**Development Mode:**
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend: `http://localhost:3001/api`

**Production Mode:**
- Frontend: Served by IIS (e.g., `http://your-server/secretapp`)
- Backend: Direct connection to `http://your-server:3001/api` (bypasses IIS proxy)

**API URL Configuration (src/services/projectService.ts):**

```typescript
constructor() {
  // Automatically detects environment and uses correct backend URL
  const productionUrl = window.location.hostname === 'localhost' 
    ? 'http://localhost:3001/api'
    : `http://${window.location.hostname}:3001/api`
  
  this.apiUrl = import.meta.env.DEV ? 'http://localhost:3001/api' : productionUrl
}
```

### **IIS Configuration (web.config)**

The `web.config` file configures IIS to serve the React SPA:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- React SPA routing - serve index.html for all non-file requests -->
        <rule name="React Routes" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
            <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
            <add input="{REQUEST_URI}" pattern="^/api/" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
    
    <defaultDocument>
      <files>
        <clear />
        <add value="index.html" />
      </files>
    </defaultDocument>
  </system.webServer>
</configuration>
```

**Important:** We removed the API proxy rule because it didn't work reliably. The app connects directly to port 3001.

### **PM2 Configuration (ecosystem.config.cjs)**

PM2 manages the Node.js backend process:

```javascript
module.exports = {
  apps: [{
    name: 'secretapp-backend',
    script: './server.js',
    instances: 1,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/error.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

---

## 5. Building for Production

### **Build Process Overview**

The build creates a `dist` folder with all files needed for deployment.

### **Step 1: Clean Build**

```powershell
# On development machine
cd C:\Source\Repo\SecretApp

# Clean any previous build (optional)
Remove-Item -Recurse -Force dist -ErrorAction SilentlyContinue

# Build production bundle
npm run build:full
```

**What `build:full` does:**
1. Compiles TypeScript (`tsc -b`)
2. Bundles React app with Vite (`vite build`)
3. Copies `server.js` to dist
4. Copies `web.config` to dist
5. Copies `package.json` to dist
6. Copies `ecosystem.config.cjs` to dist

### **Step 2: Verify Build Output**

Check the `dist` folder:

```
dist/
├── index.html                    # Main HTML file
├── assets/
│   ├── index-[hash].js          # Bundled JavaScript
│   └── index-[hash].css         # Bundled CSS
├── server.js                     # Backend API
├── web.config                    # IIS configuration
├── package.json                  # Dependencies list
└── ecosystem.config.cjs          # PM2 config
```

**Build Size:** ~730 KB (bundled JavaScript)

### **Step 3: Test Build Locally (Optional)**

```powershell
# Preview production build
npm run preview

# This runs on port 4173 usually
# Test at http://localhost:4173
```

---

## 6. IIS Deployment

### **Step 1: Create IIS Website**

**Option A: Using IIS Manager (GUI):**

1. Open IIS Manager (`inetmgr`)
2. Right-click "Sites" → "Add Website"
3. Settings:
   - **Site name:** secretapp
   - **Physical path:** `C:\inetpub\wwwroot\secretapp`
   - **Binding:**
     - Type: http
     - IP Address: All Unassigned
     - Port: 80 (or choose different port)
     - Host name: (leave empty or enter your domain)
4. Click OK

**Option B: Using PowerShell:**

```powershell
# Run as Administrator
Import-Module WebAdministration

# Create directory
New-Item -ItemType Directory -Path "C:\inetpub\wwwroot\secretapp" -Force

# Create website
New-Website -Name "secretapp" -PhysicalPath "C:\inetpub\wwwroot\secretapp" -Port 80 -Force

# Start website
Start-Website -Name "secretapp"
```

### **Step 2: Set Application Pool**

1. In IIS Manager, click "Application Pools"
2. Find "secretapp" pool
3. Right-click → "Basic Settings"
4. Set **.NET CLR version:** "No Managed Code" (important for static files)
5. Click OK

### **Step 3: Copy Files to IIS**

**From development machine, copy dist folder:**

```powershell
# Copy entire dist contents to IIS server
xcopy /E /Y C:\Source\Repo\SecretApp\dist\* \\YOUR-IIS-SERVER\c$\inetpub\wwwroot\secretapp\

# OR if running on same machine:
xcopy /E /Y C:\Source\Repo\SecretApp\dist\* C:\inetpub\wwwroot\secretapp\
```

**Files on IIS Server should be:**
```
C:\inetpub\wwwroot\secretapp\
├── index.html
├── assets\
│   ├── index-[hash].js
│   └── index-[hash].css
├── server.js
├── web.config
├── package.json
└── ecosystem.config.cjs
```

### **Step 4: Install Node Modules on IIS Server**

**IMPORTANT:** Must be done on the IIS server, not dev machine.

```powershell
# On IIS server - Run PowerShell as Administrator
cd C:\inetpub\wwwroot\secretapp

# Install production dependencies only
npm install --omit=dev

# This installs:
# - express
# - cors  
# - mysql2
# And their dependencies in node_modules folder
```

**Troubleshooting:** If you get permission errors:
```powershell
# Fix folder permissions
icacls "C:\inetpub\wwwroot\secretapp" /grant "Users:(OI)(CI)F" /T
```

### **Step 5: Configure Windows Firewall**

The backend runs on port 3001 and needs to be accessible:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "SecretApp Backend (Node.js)" `
  -Direction Inbound `
  -LocalPort 3001 `
  -Protocol TCP `
  -Action Allow `
  -Profile Any

# Verify rule was created
Get-NetFirewallRule -DisplayName "SecretApp Backend*"
```

**If accessing from other machines, also open port 80 (IIS):**
```powershell
New-NetFirewallRule -DisplayName "IIS HTTP (Port 80)" `
  -Direction Inbound `
  -LocalPort 80 `
  -Protocol TCP `
  -Action Allow `
  -Profile Any
```

---

## 7. PM2 Process Manager Setup

PM2 keeps the Node.js backend running 24/7 with auto-restart.

### **Step 1: Start Backend with PM2**

```powershell
# On IIS server
cd C:\inetpub\wwwroot\secretapp

# Start the backend using PM2 config
pm2 start ecosystem.config.cjs

# Should see:
# ┌────┬────────────────────┬──────────┬──────┬───────────┬──────────┬──────────┐
# │ id │ name               │ mode     │ ↺    │ status    │ cpu      │ memory   │
# ├────┼────────────────────┼──────────┼──────┼───────────┼──────────┼──────────┤
# │ 0  │ secretapp-backend  │ cluster  │ 0    │ online    │ 0%       │ 50mb     │
# └────┴────────────────────┴──────────┴──────┴───────────┴──────────┴──────────┘
```

### **Step 2: Save PM2 Process List**

```powershell
# Save current processes to resurrect after reboot
pm2 save

# Output: [PM2] Saving current process list...
```

### **Step 3: Configure PM2 Auto-Start on Boot**

```powershell
# This was already done during PM2 installation
# But verify it's configured:
pm2 startup

# Should see: [PM2] Startup already configured
```

### **Step 4: Useful PM2 Commands**

```powershell
# List all processes
pm2 list

# View logs (real-time)
pm2 logs secretapp-backend

# View last 50 lines of logs
pm2 logs secretapp-backend --lines 50

# View only error logs
pm2 logs secretapp-backend --err

# Restart backend
pm2 restart secretapp-backend

# Stop backend
pm2 stop secretapp-backend

# Delete process from PM2
pm2 delete secretapp-backend

# Monitor resource usage
pm2 monit

# Show detailed info
pm2 show secretapp-backend
```

### **Step 5: Log Files Location**

PM2 creates log files in:
```
C:\inetpub\wwwroot\secretapp\logs\
├── out-0.log      # Standard output
└── error-0.log    # Error output
```

---

## 8. Testing & Verification

### **Complete Testing Checklist**

#### **A. Test MySQL Connection**

```powershell
# On IIS server
mysql -u secretapp -p woodworking_projects

# Enter password: YourSecurePassword123!

# Run test query
SELECT 'MySQL working!' AS test;

# Should see:
# +------------------+
# | test             |
# +------------------+
# | MySQL working!   |
# +------------------+

# Exit
exit
```

#### **B. Test Backend API Directly**

```powershell
# Test from IIS server browser
Start-Process "http://localhost:3001/api/test"

# Should see JSON response:
# {"success":true,"message":"Connected to MySQL database!"}
```

**Using PowerShell:**
```powershell
$response = Invoke-WebRequest -Uri "http://localhost:3001/api/test" -UseBasicParsing
$response.Content

# Should show: {"success":true,"message":"Connected to MySQL database!"}
```

#### **C. Test IIS Website**

```powershell
# Open website in browser
Start-Process "http://localhost/secretapp"

# OR from another machine:
# http://YOUR-IIS-SERVER-IP/secretapp
```

**Should see:**
- SecretApp chat interface loads
- No JavaScript errors in browser console (F12)

#### **D. Test Woodworking Projects**

1. **Navigate to Woodworking Projects**
2. **Click "🔧 Test" button** in header
3. **Expected:** Alert shows "✅ Database connection successful!"
4. **If fails:** Check browser console (F12) for errors

#### **E. Test CRUD Operations**

**Create Project:**
1. Click "New Project"
2. Fill in:
   - Title: "Test Project"
   - Date: Today's date
   - Materials: "Wood, Screws"
   - Status: "planned"
3. Click "Save Project"
4. **Expected:** Success alert, project appears in list

**Upload File:**
1. Edit the test project
2. Click "Choose File"
3. Select an image or PDF
4. **Expected:** File appears in pending files list below
5. Click "Update Project"
6. **Expected:** File shows in "Attached Files" section

**Download File:**
1. Click the file name in "Attached Files"
2. **Expected:** File downloads successfully

**Delete File:**
1. Click trash icon next to file
2. Confirm deletion
3. **Expected:** File removed from list

**Delete Project:**
1. Click "Delete" button
2. Confirm deletion
3. **Expected:** Project removed from list

#### **F. Test Halloween Movie Selector**

1. Navigate to Halloween Movie Selector
2. **Expected:** Movies load from Plex server (if configured)
3. **Note:** Requires Plex server at `http://192.168.1.55:32400`

#### **G. Check PM2 Status**

```powershell
# Verify backend is running
pm2 list

# Should show status: online
# If status is "errored" or "stopped":
pm2 logs secretapp-backend --lines 50
# Check for errors
```

#### **H. Network Connectivity Test**

**From another machine on the network:**

```powershell
# Test ping
ping YOUR-IIS-SERVER-IP

# Test HTTP (IIS)
Invoke-WebRequest -Uri "http://YOUR-IIS-SERVER-IP/secretapp" -UseBasicParsing

# Test backend API
Invoke-WebRequest -Uri "http://YOUR-IIS-SERVER-IP:3001/api/test" -UseBasicParsing
```

---

## 9. Troubleshooting Guide

### **Issue: "Connection failed" Error in App**

**Symptoms:**
- Click "🔧 Test" button
- Error: "Connection failed: SyntaxError: Unexpected token '<'"

**Causes & Solutions:**

1. **Backend not running:**
   ```powershell
   pm2 list
   # If not listed or stopped:
   pm2 start ecosystem.config.cjs
   ```

2. **Backend crashed:**
   ```powershell
   pm2 logs secretapp-backend --err
   # Look for error messages
   # Common: MySQL connection error, missing dependencies
   ```

3. **Port 3001 blocked:**
   ```powershell
   # Check if port is listening
   netstat -ano | findstr :3001
   
   # If not listed, backend isn't running
   # If listed, check firewall
   Get-NetFirewallRule -DisplayName "*SecretApp*"
   ```

4. **MySQL not running:**
   ```powershell
   Get-Service MySQL80
   # If stopped:
   Start-Service MySQL80
   ```

### **Issue: Backend Won't Start (PM2 Error)**

**Check logs:**
```powershell
pm2 logs secretapp-backend --err --lines 100
```

**Common Errors:**

**A. "Cannot find module 'mysql2'"**
```
Solution: Install node modules
cd C:\inetpub\wwwroot\secretapp
npm install --omit=dev
pm2 restart secretapp-backend
```

**B. "EACCES: permission denied"**
```
Solution: Run as Administrator or fix permissions
icacls "C:\inetpub\wwwroot\secretapp" /grant "Users:(OI)(CI)F" /T
```

**C. "Error: connect ECONNREFUSED 127.0.0.1:3306"**
```
Solution: MySQL not running
Start-Service MySQL80
```

**D. "Access denied for user 'secretapp'@'localhost'"**
```
Solution: Check MySQL credentials in server.js
Or recreate MySQL user (see Section 3.2)
```

### **Issue: Files Upload but Don't Show Up**

**Check database:**
```sql
-- Login to MySQL
mysql -u secretapp -p woodworking_projects

-- Check if files are stored
SELECT 
    p.title,
    pf.file_name,
    pf.file_size,
    pf.uploaded_at
FROM projects p
LEFT JOIN project_files pf ON p.id = pf.project_id;

-- If files exist but app doesn't show them:
-- Check backend /api/projects endpoint includes files
```

**Verify backend code:**
```javascript
// In server.js, GET /api/projects should have:
for (const project of projects) {
  const [files] = await pool.query(
    'SELECT id, project_id, file_name, file_type, file_size, uploaded_at FROM project_files WHERE project_id = ?',
    [project.id]
  )
  project.files = files
}
```

### **Issue: "File size too large" Error**

**Increase MySQL packet size:**
```sql
-- Check current limit
SHOW VARIABLES LIKE 'max_allowed_packet';

-- Increase to 100MB
SET GLOBAL max_allowed_packet=104857600;
```

**Make permanent:** Edit `my.ini` and restart MySQL (see Section 3.5)

### **Issue: IIS Shows Directory Listing**

**Symptoms:** See folder contents instead of website

**Solution:**
```powershell
# Verify web.config exists
Test-Path "C:\inetpub\wwwroot\secretapp\web.config"

# Verify index.html exists
Test-Path "C:\inetpub\wwwroot\secretapp\index.html"

# If missing, copy from dist folder again
xcopy /E /Y C:\Source\Repo\SecretApp\dist\* C:\inetpub\wwwroot\secretapp\
```

### **Issue: PM2 Doesn't Start on Reboot**

**Verify PM2 startup:**
```powershell
# Check if configured
pm2 startup

# Should see: Platform windows detected
# If not configured:
npm install -g pm2-windows-startup
pm2-startup install

# Save current processes
pm2 save

# Test by rebooting server
Restart-Computer

# After reboot:
pm2 list
# Should show secretapp-backend running
```

### **Issue: Cannot Access from Other Machines**

**Check Windows Firewall:**
```powershell
# List firewall rules
Get-NetFirewallRule | Where-Object {$_.DisplayName -like "*SecretApp*" -or $_.DisplayName -like "*3001*"}

# If no rules, create them (see Section 6.5)
```

**Check if IIS binding allows external access:**
1. IIS Manager → Sites → secretapp
2. Right-click → Edit Bindings
3. Ensure binding is "All Unassigned" not "127.0.0.1"

### **Issue: High Memory Usage**

**Check PM2 stats:**
```powershell
pm2 monit
```

**If memory > 500MB:**
```powershell
# Restart to clear memory
pm2 restart secretapp-backend

# Check for memory leaks in logs
pm2 logs secretapp-backend | Select-String "memory"
```

---

## 10. Maintenance & Updates

### **Updating the Application**

#### **Step 1: Pull Latest Code**
```powershell
# On dev machine
cd C:\Source\Repo\SecretApp
git pull origin main
```

#### **Step 2: Install New Dependencies (if any)**
```powershell
npm install
```

#### **Step 3: Build New Version**
```powershell
npm run build:full
```

#### **Step 4: Backup Current IIS Version**
```powershell
# On IIS server
cd C:\inetpub\wwwroot
Rename-Item secretapp secretapp_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')
New-Item -ItemType Directory -Path secretapp
```

#### **Step 5: Deploy New Version**
```powershell
# Copy new files
xcopy /E /Y C:\Source\Repo\SecretApp\dist\* C:\inetpub\wwwroot\secretapp\

# Install dependencies (if package.json changed)
cd C:\inetpub\wwwroot\secretapp
npm install --omit=dev

# Restart backend
pm2 restart secretapp-backend
```

#### **Step 6: Verify Update**
```powershell
# Check backend is running
pm2 list

# Test in browser
Start-Process "http://localhost/secretapp"
```

#### **Rollback if Needed**
```powershell
# Stop new version
pm2 stop secretapp-backend

# Restore backup
Remove-Item -Recurse -Force C:\inetpub\wwwroot\secretapp
Rename-Item C:\inetpub\wwwroot\secretapp_backup_20251008_143000 secretapp

# Restart backend
pm2 restart secretapp-backend
```

### **Database Backup**

#### **Manual Backup**
```powershell
# Create backup directory
New-Item -ItemType Directory -Path "C:\Backups\MySQL" -Force

# Backup database (requires MySQL in PATH)
mysqldump -u secretapp -p woodworking_projects > "C:\Backups\MySQL\woodworking_projects_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

#### **Restore from Backup**
```powershell
mysql -u secretapp -p woodworking_projects < "C:\Backups\MySQL\woodworking_projects_20251008_120000.sql"
```

#### **Automated Backup Script**

Create `C:\Scripts\backup_secretapp.ps1`:
```powershell
# Backup SecretApp Database
$backupDir = "C:\Backups\MySQL"
$timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$backupFile = "$backupDir\woodworking_projects_$timestamp.sql"

# Ensure directory exists
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

# Run mysqldump
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" `
  -u secretapp `
  -pYourSecurePassword123! `
  woodworking_projects > $backupFile

# Keep only last 7 days of backups
Get-ChildItem $backupDir -Filter "woodworking_projects_*.sql" | 
  Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | 
  Remove-Item

Write-Host "Backup completed: $backupFile"
```

**Schedule daily backup:**
```powershell
# Run as Administrator
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\Scripts\backup_secretapp.ps1"
$trigger = New-ScheduledTaskTrigger -Daily -At 2AM
$principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
Register-ScheduledTask -TaskName "SecretApp Database Backup" -Action $action -Trigger $trigger -Principal $principal
```

### **Monitoring & Logs**

#### **Check Application Health**
```powershell
# Backend status
pm2 status

# View recent logs
pm2 logs secretapp-backend --lines 50

# Monitor in real-time
pm2 monit
```

#### **IIS Logs**
Located in: `C:\inetpub\logs\LogFiles\W3SVC[site-id]\`

```powershell
# View today's IIS logs
Get-Content "C:\inetpub\logs\LogFiles\W3SVC1\u_ex$(Get-Date -Format 'yyMMdd').log" -Tail 50
```

#### **Windows Event Viewer**
- Applications and Services Logs → Microsoft → Windows → IIS-Configuration
- Look for errors related to IIS or application crashes

### **Performance Optimization**

#### **Database Indexes**
```sql
-- Check index usage
SHOW INDEX FROM projects;
SHOW INDEX FROM project_files;

-- Add indexes if needed for large datasets
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_date ON projects(date);
```

#### **PM2 Clustering**
If you need to handle more traffic:
```javascript
// In ecosystem.config.cjs
instances: 2,  // Run 2 instances (or 'max' for all CPU cores)
exec_mode: 'cluster'
```

#### **MySQL Connection Pool**
```javascript
// In server.js - adjust based on load
connectionLimit: 20,  // Increase for more concurrent connections
```

---

## 11. Quick Reference Commands

### **Development (Local)**
```powershell
cd C:\Source\Repo\SecretApp
npm install              # Install dependencies
npm run dev              # Start dev server (port 5173)
npm run server           # Start backend (port 3001)
npm run build            # Build for production
npm run build:full       # Build + copy all deployment files
```

### **IIS Server Deployment**
```powershell
# Copy files
xcopy /E /Y C:\Source\Repo\SecretApp\dist\* C:\inetpub\wwwroot\secretapp\

# Install dependencies
cd C:\inetpub\wwwroot\secretapp
npm install --omit=dev

# PM2 management
pm2 start ecosystem.config.cjs
pm2 restart secretapp-backend
pm2 stop secretapp-backend
pm2 logs secretapp-backend
pm2 save

# IIS management
iisreset                           # Restart IIS
Start-Website -Name "secretapp"    # Start site
Stop-Website -Name "secretapp"     # Stop site
```

### **MySQL Management**
```powershell
# Service management
Get-Service MySQL80
Start-Service MySQL80
Restart-Service MySQL80

# Connect to database
mysql -u secretapp -p woodworking_projects

# Backup
mysqldump -u secretapp -p woodworking_projects > backup.sql

# Restore
mysql -u secretapp -p woodworking_projects < backup.sql
```

### **Firewall Management**
```powershell
# Open port 3001
New-NetFirewallRule -DisplayName "SecretApp Backend" -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow

# Check rules
Get-NetFirewallRule | Where-Object {$_.LocalPort -eq 3001}

# Remove rule
Remove-NetFirewallRule -DisplayName "SecretApp Backend"
```

---

## 12. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     IIS Web Server (Port 80)                │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │         React SPA (Static Files)                   │   │
│  │  - index.html                                      │   │
│  │  - JavaScript bundles (Vite build)                 │   │
│  │  - CSS files                                       │   │
│  │                                                     │   │
│  │  Components:                                       │   │
│  │    - ChatApp (Navigation)                          │   │
│  │    - HalloweenMovieSelector                        │   │
│  │    - WoodworkingProjects                           │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ Direct HTTP calls to port 3001
                            │ (bypasses IIS proxy)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          Node.js Backend (Port 3001) - Managed by PM2      │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │         Express REST API (server.js)               │   │
│  │                                                     │   │
│  │  Endpoints:                                        │   │
│  │    GET  /api/test                                  │   │
│  │    GET  /api/projects                              │   │
│  │    GET  /api/projects/:id                          │   │
│  │    POST /api/projects                              │   │
│  │    PUT  /api/projects/:id                          │   │
│  │    DELETE /api/projects/:id                        │   │
│  │    POST /api/projects/:id/files                    │   │
│  │    GET  /api/files/:fileId                         │   │
│  │    DELETE /api/files/:fileId                       │   │
│  └────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ MySQL connection (localhost:3306)
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              MySQL Server 8.0 (Port 3306)                   │
│                                                             │
│  Database: woodworking_projects                            │
│  User: secretapp                                           │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Tables:                                           │   │
│  │    - projects (metadata)                           │   │
│  │    - project_files (LONGBLOB file storage)         │   │
│  └────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

Process Management: PM2 (keeps Node.js running, auto-restart)
```

---

## 13. Important Notes & Gotchas

### **Critical Points:**

1. **MySQL Credentials**
   - Must match in `server.js` on IIS server
   - Default: user='secretapp', password='YourSecurePassword123!'
   - Change password for production security

2. **Port 3001**
   - Backend MUST run on port 3001 (hardcoded in frontend)
   - Must be open in Windows Firewall
   - PM2 must be running

3. **File Storage**
   - Files stored IN database as LONGBLOB (not filesystem)
   - Max file size limited by `max_allowed_packet` (default 64MB)
   - Large files increase database size rapidly

4. **ES Modules**
   - Project uses ES modules (`"type": "module"` in package.json)
   - Use `import` not `require`
   - File extensions required in imports

5. **IIS Proxy NOT Used**
   - Originally attempted URL Rewrite proxy
   - Didn't work reliably without ARR
   - Solution: Frontend connects directly to port 3001
   - web.config only handles React SPA routing

6. **Node Modules**
   - Must be installed on IIS server (not copied from dev machine)
   - Use `npm install --omit=dev` for production
   - Native modules may require rebuild on IIS server

7. **PM2 Logs**
   - Check logs when backend doesn't start
   - Location: `C:\inetpub\wwwroot\secretapp\logs\`
   - Use `pm2 logs` to view in real-time

8. **SharePoint References**
   - `src/utils/sharepointService.ts` exists but is DEPRECATED
   - Not used anywhere (we switched to MySQL)
   - Can be deleted safely
   - Console messages may still say "SharePoint API Server" (old message)

### **Security Recommendations:**

1. **Change MySQL Password**
   ```sql
   ALTER USER 'secretapp'@'localhost' IDENTIFIED BY 'NewSecurePassword!';
   -- Update server.js with new password
   ```

2. **Use HTTPS**
   - Install SSL certificate in IIS
   - Bind to port 443
   - Force HTTPS redirect

3. **Restrict MySQL Access**
   ```sql
   -- Only allow localhost connections (default)
   SHOW GRANTS FOR 'secretapp'@'localhost';
   ```

4. **PM2 as Windows Service**
   - Already configured with `pm2-startup install`
   - Runs under SYSTEM account
   - Auto-starts on boot

5. **Firewall Rules**
   - Only open ports 80 (IIS) and 3001 (backend)
   - Consider restricting port 3001 to internal network only
   - Use network firewall for external traffic

---

## 14. Contact & Support

**Project Repository:** https://github.com/EnzoLopez2023/SecretApp

**Key Files for Reference:**
- `MYSQL_SETUP.md` - Database setup guide
- `README.md` - Project overview
- `server.js` - Backend API code
- `src/services/projectService.ts` - Frontend API service
- `src/WoodworkingProjects.tsx` - Main CRUD component
- `ecosystem.config.cjs` - PM2 configuration
- `web.config` - IIS configuration

**Useful Resources:**
- PM2 Documentation: https://pm2.keymetrics.io/docs/
- MySQL Documentation: https://dev.mysql.com/doc/
- IIS Documentation: https://docs.microsoft.com/en-us/iis/
- Vite Documentation: https://vite.dev/
- React Documentation: https://react.dev/

---

## 15. Version History

**v1.0 - October 8, 2025**
- Initial production deployment
- MySQL backend with LONGBLOB file storage
- Direct backend connection (bypassed IIS proxy)
- PM2 process management
- Complete IIS deployment

**Previous Versions:**
- v0.9 - Attempted SharePoint integration (deprecated)
- v0.8 - Local storage only

---

## ✅ Final Deployment Checklist

Use this before going to production:

### **Development Machine:**
- [ ] Code is committed to git
- [ ] All tests pass locally
- [ ] `npm run build:full` completes successfully
- [ ] dist folder contains all files

### **IIS Server:**
- [ ] Windows Server / Windows 10/11 with IIS installed
- [ ] Node.js v22.20.0+ installed
- [ ] PM2 installed globally (`npm install -g pm2`)
- [ ] PM2 startup configured (`pm2-startup install`)
- [ ] MySQL Server 8.0+ installed and running
- [ ] Database `woodworking_projects` created
- [ ] User `secretapp` created with correct password
- [ ] Tables `projects` and `project_files` created
- [ ] IIS website `secretapp` created
- [ ] Files copied to `C:\inetpub\wwwroot\secretapp\`
- [ ] Node modules installed (`npm install --omit=dev`)
- [ ] PM2 backend started (`pm2 start ecosystem.config.cjs`)
- [ ] PM2 saved (`pm2 save`)
- [ ] Windows Firewall port 3001 opened
- [ ] Backend accessible at `http://localhost:3001/api/test`
- [ ] Website accessible at `http://localhost/secretapp`
- [ ] Test button shows database connection success
- [ ] Can create/edit/delete projects
- [ ] Can upload/download/delete files
- [ ] Files persist after page refresh

### **Optional:**
- [ ] SSL certificate installed
- [ ] Automated backup scheduled
- [ ] Monitoring configured
- [ ] Documentation updated

---

**END OF GUIDE**

This guide should allow complete redeployment from scratch. Keep this document updated when making architecture changes!
