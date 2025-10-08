# MySQL Woodworking Projects - Setup Guide

## 🎉 Migration Complete!

Your Woodworking Projects app has been successfully migrated from SharePoint to MySQL database backend.

---

## 📋 What Changed?

### ✅ Removed:
- SharePoint/Microsoft Graph API integration
- Azure AD OAuth authentication
- SharePoint file storage dependencies
- `src/utils/sharepointService.ts` (no longer used)

### ✅ Added:
- MySQL database with two tables:
  - `projects` - stores project metadata
  - `project_files` - stores files as LONGBLOB (files stored IN database)
- `src/services/projectService.ts` - new MySQL service layer
- Updated backend API (`server.js`) with MySQL endpoints
- Completely rewritten `src/WoodworkingProjects.tsx` component

---

## 🗄️ Database Setup

### 1. Install MySQL
Download and install MySQL from: https://dev.mysql.com/downloads/mysql/

### 2. Create Database and User
Run these SQL commands (in MySQL Workbench or command line):

```sql
-- Create database
CREATE DATABASE woodworking_projects;

-- Create user
CREATE USER 'secretapp'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON woodworking_projects.* TO 'secretapp'@'localhost';
FLUSH PRIVILEGES;

-- Use the database
USE woodworking_projects;

-- Create projects table
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

-- Create files table with LONGBLOB for storing file data
CREATE TABLE project_files (
    id INT AUTO_INCREMENT PRIMARY KEY,
    project_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size INT NOT NULL,
    file_data LONGBLOB NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX idx_project_id ON project_files(project_id);
```

### 3. Verify Database Credentials
Check that `server.js` has the correct MySQL credentials:

```javascript
const pool = mysql.createPool({
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',  // <-- Update if needed
  database: 'woodworking_projects',
  // ...
})
```

---

## 🚀 Local Development

### Terminal 1 - Start Backend Server:
```powershell
cd C:\Source\Repo\SecretApp
npm run server
```
Backend runs on: `http://localhost:3001`

### Terminal 2 - Start Frontend Dev Server:
```powershell
cd C:\Source\Repo\SecretApp
npm run dev
```
Frontend runs on: `http://localhost:5173`

### Test Database Connection:
Open your browser and visit:
```
http://localhost:5173
```
Navigate to **Woodworking Projects** and click the **🔧 Test** button in the header.

You should see: ✅ Database connection successful!

---

## 🌐 Production Deployment (IIS)

### 1. Build the Application
```powershell
cd C:\Source\Repo\SecretApp
npm run build:full
```
This creates the `dist` folder with all compiled files.

### 2. Deploy to IIS
Copy contents of `dist` folder to:
```
C:\inetpub\wwwroot\secretapp\
```

**Important Files:**
- `dist/index.html` - Main HTML file
- `dist/assets/*` - JavaScript and CSS bundles
- `web.config` - IIS URL rewriting (should already be in dist)

### 3. Start Backend with PM2
```powershell
cd C:\Source\Repo\SecretApp
pm2 start ecosystem.config.cjs
pm2 save
```

Verify it's running:
```powershell
pm2 list
pm2 logs secretapp-backend
```

### 4. Configure IIS (if not already done)
1. Open **IIS Manager**
2. Create/Configure site: `secretapp`
3. Point physical path to: `C:\inetpub\wwwroot\secretapp`
4. Set application pool to use **No Managed Code**
5. Ensure `web.config` is present (it proxies `/api/*` to `localhost:3001`)

### 5. Test Production
Visit: `http://your-iis-server/secretapp`

---

## 🧪 API Endpoints

### Projects
- `GET /api/test` - Test database connection
- `GET /api/projects` - Get all projects (with files)
- `GET /api/projects/:id` - Get specific project
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project (cascades to files)

### Files
- `POST /api/projects/:id/files` - Upload file (multipart/form-data)
- `GET /api/files/:fileId` - Download file
- `DELETE /api/files/:fileId` - Delete file

---

## 📦 File Storage

**All files are stored IN the MySQL database as LONGBLOB:**
- Images (JPG, PNG, GIF, etc.)
- PDFs
- Word documents
- Any file type up to MySQL's max_allowed_packet size

**Advantages:**
- No separate file system to manage
- Automatic backup with database backups
- Files deleted with projects automatically (CASCADE)
- Simpler deployment (no file permissions issues)

**File Size Limits:**
Default `max_allowed_packet` = 64MB

To increase (in MySQL config):
```sql
SET GLOBAL max_allowed_packet=104857600;  -- 100MB
```

---

## 🔍 Troubleshooting

### "Failed to load projects from database"
1. Check MySQL service is running: `services.msc` → MySQL
2. Verify credentials in `server.js`
3. Test connection: Click **🔧 Test** button in app

### "Cannot connect to http://localhost:3001"
1. Check backend is running: `pm2 list`
2. Start if needed: `pm2 start ecosystem.config.cjs`
3. Check logs: `pm2 logs secretapp-backend`

### Backend crashes on startup
1. Check MySQL is installed and running
2. Verify database `woodworking_projects` exists
3. Check user permissions
4. View errors: `pm2 logs secretapp-backend --err`

### IIS shows blank page
1. Verify `web.config` has correct rewrite rules
2. Check browser console for errors (F12)
3. Ensure backend is running (`pm2 list`)
4. Test API directly: `http://your-server/api/test`

---

## 📊 Database Maintenance

### Backup Database
```powershell
mysqldump -u secretapp -p woodworking_projects > backup.sql
```

### Restore Database
```powershell
mysql -u secretapp -p woodworking_projects < backup.sql
```

### Check Database Size
```sql
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES
WHERE table_schema = 'woodworking_projects';
```

---

## ✅ Testing Checklist

### Local Development
- [ ] Backend starts without errors (`npm run server`)
- [ ] Frontend loads (`npm run dev`)
- [ ] 🔧 Test button shows connection success
- [ ] Can create new project
- [ ] Can upload files (images, PDFs)
- [ ] Can edit project
- [ ] Can delete project
- [ ] Can delete individual files
- [ ] Can download files

### Production (IIS)
- [ ] Site loads at IIS URL
- [ ] Backend running (`pm2 list`)
- [ ] 🔧 Test button works
- [ ] All CRUD operations work
- [ ] File upload/download works
- [ ] Halloween Movie Selector still works
- [ ] ChatApp navigation works

---

## 🎯 Next Steps

1. **Configure MySQL for production:**
   - Set strong password for `secretapp` user
   - Configure MySQL to start automatically
   - Set up regular backups

2. **Optimize PM2:**
   - Configure PM2 as Windows service: `pm2-installer`
   - Set up log rotation
   - Monitor memory usage

3. **Security Hardening:**
   - Use environment variables for DB credentials
   - Enable HTTPS on IIS
   - Implement rate limiting on API
   - Add authentication if needed

4. **Performance:**
   - Consider adding Redis cache for project list
   - Implement pagination for large project lists
   - Optimize LONGBLOB queries with indexes

---

## 📚 Files Reference

### Frontend
- `src/WoodworkingProjects.tsx` - Main React component (MySQL version)
- `src/services/projectService.ts` - API service layer
- `src/App.tsx` - Root component with navigation

### Backend
- `server.js` - Express API server with MySQL
- `ecosystem.config.cjs` - PM2 configuration

### Config
- `web.config` - IIS URL rewriting
- `package.json` - Scripts and dependencies

### Deprecated (can be deleted)
- `src/utils/sharepointService.ts` - Old SharePoint integration

---

## 🎉 Success!

Your Woodworking Projects app now runs on a reliable MySQL backend with files stored directly in the database. No more SharePoint authentication headaches!

**Enjoy your new streamlined workflow! 🛠️**
