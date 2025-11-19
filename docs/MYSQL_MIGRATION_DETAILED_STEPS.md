# MySQL Migration - Detailed Step-by-Step Commands

## Part 1: Create Database and User on New Server

### Step 1.1: Connect to MySQL as Root

Open **Command Prompt** or **PowerShell** on the **NEW SERVER** and run:

```powershell
# Navigate to MySQL bin directory
cd "C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Connect to MySQL as root
.\mysql.exe -u root -p
```

**You'll be prompted for the root password you set during MySQL installation.**

---

### Step 1.2: Create the Database

Once connected to MySQL (you'll see `mysql>` prompt), run these commands:

```sql
-- Create the database with UTF-8 support
CREATE DATABASE woodworking_projects CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Expected Output:**
```
Query OK, 1 row affected (0.01 sec)
```

**Verify the database was created:**
```sql
SHOW DATABASES;
```

You should see `woodworking_projects` in the list.

---

### Step 1.3: Create the Application User (Local Access Only)

If your application will run on the **same server** as MySQL:

```sql
-- Create user for local access
CREATE USER 'secretapp'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';

-- Grant all privileges on the database
GRANT ALL PRIVILEGES ON woodworking_projects.* TO 'secretapp'@'localhost';
```

**Expected Output:**
```
Query OK, 0 rows affected (0.01 sec)
Query OK, 0 rows affected (0.01 sec)
```

---

### Step 1.4: Create User for Remote Access (If Needed)

If your application will run on a **different server** than MySQL:

**Option A: Allow from any IP (less secure, for testing only)**
```sql
-- Create user for remote access from any IP
CREATE USER 'secretapp'@'%' IDENTIFIED BY 'YourSecurePassword123!';

-- Grant all privileges
GRANT ALL PRIVILEGES ON woodworking_projects.* TO 'secretapp'@'%';
```

**Option B: Allow from specific IP (recommended for production)**
```sql
-- Replace 192.168.1.100 with your application server's IP address
CREATE USER 'secretapp'@'192.168.1.100' IDENTIFIED BY 'YourSecurePassword123!';

-- Grant all privileges
GRANT ALL PRIVILEGES ON woodworking_projects.* TO 'secretapp'@'192.168.1.100';
```

---

### Step 1.5: Apply Changes and Verify

```sql
-- Apply all privilege changes
FLUSH PRIVILEGES;

-- Verify users were created
SELECT User, Host FROM mysql.user WHERE User='secretapp';
```

**Expected Output:**
```
+------------+-----------+
| User       | Host      |
+------------+-----------+
| secretapp  | localhost |
| secretapp  | %         |  (if you created remote access)
+------------+-----------+
```

---

### Step 1.6: Test the User Connection

```sql
-- Exit the root connection
EXIT;
```

**Test the new user can connect:**
```powershell
# Still in C:\Program Files\MySQL\MySQL Server 8.0\bin
.\mysql.exe -u secretapp -p
# Enter password: YourSecurePassword123!
```

Once connected, verify access to the database:
```sql
USE woodworking_projects;
SHOW TABLES;  # Should show empty set (no tables yet)
EXIT;
```

---

### Step 1.7: Configure MySQL for Remote Access (If Needed)

If you created a remote user, you need to configure MySQL to accept remote connections:

**Edit MySQL Configuration File:**

1. Open the MySQL configuration file:
   - Location: `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`
   - Use Notepad or any text editor **as Administrator**

2. Find the `bind-address` setting (usually under `[mysqld]` section):
   ```ini
   [mysqld]
   # Comment out or change this line:
   # bind-address=127.0.0.1
   
   # To allow connections from any IP:
   bind-address=0.0.0.0
   ```

3. Save the file

4. **Restart MySQL Service:**
   ```powershell
   # Open PowerShell as Administrator
   Restart-Service MySQL80
   ```

5. **Verify MySQL is listening on all interfaces:**
   ```powershell
   netstat -an | findstr :3306
   ```
   
   Should show:
   ```
   TCP    0.0.0.0:3306           0.0.0.0:0              LISTENING
   ```

---

## Part 2: Export Database from Current Server

### Step 2.1: Create Backup Directory

On your **CURRENT SERVER**, open PowerShell and create a backup directory:

```powershell
# Create backup directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "C:\MySQLBackups"

# Navigate to the backup directory
cd C:\MySQLBackups
```

---

### Step 2.2: Locate mysqldump.exe

Find where mysqldump is installed:

```powershell
# Check if mysqldump is in PATH
Get-Command mysqldump -ErrorAction SilentlyContinue

# If not found, it's likely here:
Test-Path "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
```

---

### Step 2.3: Export the Database (Basic Method)

**Simple backup command:**

```powershell
# Using full path (adjust if your MySQL is installed elsewhere)
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" `
  -u secretapp `
  -p `
  woodworking_projects `
  > "C:\MySQLBackups\woodworking_projects_backup.sql"
```

**When prompted, enter the password:** `YourSecurePassword123!`

---

### Step 2.4: Export with Timestamp (Recommended)

**Backup with date/time in filename:**

```powershell
# Create filename with timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "C:\MySQLBackups\woodworking_projects_$timestamp.sql"

# Create backup
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" `
  -u secretapp `
  -p `
  woodworking_projects `
  > $backupFile

Write-Host "Backup created: $backupFile" -ForegroundColor Green
```

**When prompted, enter the password:** `YourSecurePassword123!`

---

### Step 2.5: Export with Full Options (Production-Ready)

**Complete backup with all database objects:**

```powershell
# Set variables
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "C:\MySQLBackups\woodworking_projects_full_$timestamp.sql"
$mysqldumpPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"

# Create comprehensive backup
& $mysqldumpPath `
  --user=secretapp `
  --password=YourSecurePassword123! `
  --databases woodworking_projects `
  --routines `
  --triggers `
  --events `
  --single-transaction `
  --quick `
  --lock-tables=false `
  --add-drop-database `
  --add-drop-table `
  --result-file=$backupFile

# Check if backup was successful
if (Test-Path $backupFile) {
    $fileSize = (Get-Item $backupFile).Length / 1MB
    Write-Host "✅ Backup successful!" -ForegroundColor Green
    Write-Host "📁 Location: $backupFile" -ForegroundColor Cyan
    Write-Host "📊 Size: $([math]::Round($fileSize, 2)) MB" -ForegroundColor Cyan
} else {
    Write-Host "❌ Backup failed!" -ForegroundColor Red
}
```

**Option flags explained:**
- `--databases woodworking_projects` - Specifies the database to backup
- `--routines` - Include stored procedures and functions
- `--triggers` - Include triggers
- `--events` - Include scheduled events
- `--single-transaction` - Consistent backup without locking (InnoDB tables)
- `--quick` - Don't buffer the entire result set in memory
- `--lock-tables=false` - Don't lock tables (allows continued operation)
- `--add-drop-database` - Add DROP DATABASE before CREATE DATABASE
- `--add-drop-table` - Add DROP TABLE before each CREATE TABLE
- `--result-file` - Write output to file instead of stdout

---

### Step 2.6: Verify the Backup File

**Check the backup was created and contains data:**

```powershell
# Check if file exists
if (Test-Path "C:\MySQLBackups\woodworking_projects_*.sql") {
    Write-Host "✅ Backup file(s) found" -ForegroundColor Green
    
    # List all backup files with sizes
    Get-ChildItem "C:\MySQLBackups\woodworking_projects_*.sql" | 
        Select-Object Name, 
                      @{Name="Size(MB)";Expression={[math]::Round($_.Length/1MB, 2)}},
                      CreationTime | 
        Format-Table -AutoSize
} else {
    Write-Host "❌ No backup files found!" -ForegroundColor Red
}
```

**Verify backup file content:**

```powershell
# View first 50 lines of the backup file
$latestBackup = Get-ChildItem "C:\MySQLBackups\woodworking_projects_*.sql" | 
                Sort-Object CreationTime -Descending | 
                Select-Object -First 1

Write-Host "📄 Viewing first 50 lines of: $($latestBackup.Name)" -ForegroundColor Cyan
Get-Content $latestBackup.FullName -Head 50
```

**You should see SQL commands like:**
```sql
-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: woodworking_projects
-- ------------------------------------------------------
-- Server version	8.0.43

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `woodworking_projects`...
USE `woodworking_projects`;
DROP TABLE IF EXISTS `conversations`;
CREATE TABLE `conversations` (...);
```

---

### Step 2.7: Create a Compressed Backup (Optional)

**If the backup file is large, compress it:**

```powershell
# Find the latest backup
$latestBackup = Get-ChildItem "C:\MySQLBackups\woodworking_projects_*.sql" | 
                Sort-Object CreationTime -Descending | 
                Select-Object -First 1

# Create compressed archive
$zipFile = $latestBackup.FullName -replace '\.sql$', '.zip'
Compress-Archive -Path $latestBackup.FullName -DestinationPath $zipFile -Force

Write-Host "✅ Compressed backup created: $zipFile" -ForegroundColor Green

# Show size comparison
$originalSize = (Get-Item $latestBackup.FullName).Length / 1MB
$compressedSize = (Get-Item $zipFile).Length / 1MB

Write-Host "📊 Original: $([math]::Round($originalSize, 2)) MB" -ForegroundColor Cyan
Write-Host "📦 Compressed: $([math]::Round($compressedSize, 2)) MB" -ForegroundColor Cyan
Write-Host "💾 Saved: $([math]::Round($originalSize - $compressedSize, 2)) MB" -ForegroundColor Green
```

---

### Step 2.8: Quick One-Liner Commands

**For quick copy-paste:**

**Simple backup:**
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u secretapp -p woodworking_projects > "C:\MySQLBackups\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

**Full backup with password (⚠️ visible in command history):**
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u secretapp -pYourSecurePassword123! --databases woodworking_projects --routines --triggers --events --single-transaction > "C:\MySQLBackups\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"
```

---

## Troubleshooting

### Issue: "Access Denied" Error

**Solution:**
```powershell
# Try with root user instead
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" `
  -u root `
  -p `
  woodworking_projects `
  > "C:\MySQLBackups\backup.sql"
```

---

### Issue: "mysqldump: command not found"

**Solution:**
```powershell
# Use full path or add to PATH temporarily
$env:Path += ";C:\Program Files\MySQL\MySQL Server 8.0\bin"

# Then run mysqldump normally
mysqldump -u secretapp -p woodworking_projects > backup.sql
```

---

### Issue: Backup File is Empty or Very Small

**Check for errors:**
```powershell
# Run with error output
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" `
  -u secretapp `
  -p `
  woodworking_projects `
  2> "C:\MySQLBackups\error.log" `
  > "C:\MySQLBackups\backup.sql"

# View errors
Get-Content "C:\MySQLBackups\error.log"
```

---

### Issue: "Table doesn't exist" Errors

**Verify tables exist before backup:**
```powershell
# Connect to MySQL
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u secretapp -p

# Then in MySQL prompt:
USE woodworking_projects;
SHOW TABLES;
EXIT;
```

---

## Summary Checklist

### ✅ New Server Setup Checklist
- [ ] MySQL 8.0.43 installed on new server
- [ ] Connected to MySQL as root
- [ ] Created `woodworking_projects` database
- [ ] Created `secretapp` user with password
- [ ] Granted privileges to `secretapp` user
- [ ] Flushed privileges
- [ ] Tested connection with `secretapp` user
- [ ] (If remote) Configured `bind-address` in my.ini
- [ ] (If remote) Restarted MySQL service
- [ ] (If remote) Opened port 3306 in firewall

### ✅ Current Server Backup Checklist
- [ ] Created backup directory `C:\MySQLBackups`
- [ ] Located mysqldump.exe
- [ ] Ran mysqldump command
- [ ] Verified backup file was created
- [ ] Checked backup file size (should be > 0 KB)
- [ ] Viewed backup file content (should contain SQL)
- [ ] (Optional) Created compressed backup
- [ ] Backup file ready for transfer

---

## Quick Reference Card

**Connect to MySQL:**
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u secretapp -p
```

**Create backup:**
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" -u secretapp -p woodworking_projects > "C:\MySQLBackups\backup.sql"
```

**Check backup:**
```powershell
Get-ChildItem "C:\MySQLBackups\*.sql" | Select Name, @{N='Size(MB)';E={[math]::Round($_.Length/1MB,2)}}
```

**Database credentials:**
- Database: `woodworking_projects`
- User: `secretapp`
- Password: `YourSecurePassword123!`

---

## Next Steps

After completing these steps, you're ready to:
1. Transfer the backup file to the new server
2. Import the database on the new server
3. Update application configuration
4. Test the connection

Refer to the main migration guide (`MYSQL_MIGRATION_GUIDE.md`) for complete instructions.
