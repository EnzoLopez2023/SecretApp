# MySQL Server Migration Guide

## Current Server Configuration

### MySQL Version
**MySQL Server 8.0.43** (Must install the same version on the new server)

### Current Database Configuration
- **Host**: localhost
- **Database Name**: `woodworking_projects`
- **User**: `secretapp`
- **Password**: `YourSecurePassword123!`
- **Port**: 3306 (MySQL default)

### Database Tables
Your application uses the following tables in the `woodworking_projects` database:
- `conversations`
- `conversation_messages`
- `home_items`
- `maintenance_tasks`
- `maintenance_history`
- `maintenance_photos`
- `maintenance_costs`
- `warranties`
- `ai_insights`
- `recipes`
- `recipe_ingredients`
- `recipe_pantry_items`
- `recipe_images`
- `myshop_inventory`
- `myshop_images`
- `shopping_lists`
- `shopping_list_items`

---

## Step-by-Step Migration Instructions

### Phase 1: Prepare the New Server

#### Step 1: Install MySQL 8.0.43 on the New Server

**Download and Install:**
1. Go to https://dev.mysql.com/downloads/mysql/
2. Select **MySQL Community Server 8.0.43** for your OS
3. Download the installer (MSI for Windows)
4. Run the installer and follow these steps:
   - Choose "Server only" or "Custom" installation
   - Select **MySQL Server 8.0.43**
   - Configure MySQL Server:
     - **Server Configuration Type**: Development Machine (or as needed)
     - **Port Number**: 3306 (default)
     - **Authentication Method**: Use Strong Password Encryption (recommended)
     - **Root Password**: Set a strong root password (save it securely!)
     - **Windows Service**: Check "Start MySQL Server at System Startup"

#### Step 2: Configure Firewall Ports on New Server

**Ports to Open:**

1. **MySQL Port (Required):**
   - **Port**: 3306
   - **Protocol**: TCP
   - **Direction**: Inbound
   - **Purpose**: MySQL database connections

**Windows Firewall Configuration:**
```powershell
# Open PowerShell as Administrator and run:
New-NetFirewallRule -DisplayName "MySQL Server" -Direction Inbound -LocalPort 3306 -Protocol TCP -Action Allow
```

**Alternative: Windows Firewall GUI:**
1. Open Windows Defender Firewall with Advanced Security
2. Click "Inbound Rules" → "New Rule"
3. Select "Port" → TCP → Specific local port: 3306
4. Allow the connection
5. Apply to all profiles (Domain, Private, Public)
6. Name: "MySQL Server"

#### Step 3: Create Database User on New Server

Connect to MySQL on the new server and create the application user:

```sql
-- Connect as root
mysql -u root -p

-- Create the database
CREATE DATABASE woodworking_projects CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create the application user
CREATE USER 'secretapp'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';

-- Grant privileges
GRANT ALL PRIVILEGES ON woodworking_projects.* TO 'secretapp'@'localhost';

-- If connecting from a remote application server, also create:
CREATE USER 'secretapp'@'%' IDENTIFIED BY 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON woodworking_projects.* TO 'secretapp'@'%';

-- For remote connection from specific IP only (more secure):
-- CREATE USER 'secretapp'@'YOUR_APP_SERVER_IP' IDENTIFIED BY 'YourSecurePassword123!';
-- GRANT ALL PRIVILEGES ON woodworking_projects.* TO 'secretapp'@'YOUR_APP_SERVER_IP';

FLUSH PRIVILEGES;
EXIT;
```

---

### Phase 2: Export Data from Current Server

#### Step 4: Create a Complete Database Backup

**Option A: Full Database Dump (Recommended)**

```powershell
# Open PowerShell on the current server
# Navigate to a backup directory
cd C:\Backups

# Create backup with mysqldump (adjust path if MySQL is not in PATH)
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe" `
  -u secretapp `
  -p `
  --databases woodworking_projects `
  --routines `
  --triggers `
  --events `
  --single-transaction `
  --quick `
  --lock-tables=false `
  --result-file="woodworking_projects_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql"

# You'll be prompted for the password: YourSecurePassword123!
```

**Option B: Backup with Data Directory (Alternative)**

If you prefer to copy the data directory:

```powershell
# Stop MySQL service
Stop-Service MySQL80

# Copy data directory (default location)
Copy-Item "C:\ProgramData\MySQL\MySQL Server 8.0\Data\woodworking_projects" `
  -Destination "C:\Backups\woodworking_projects_datadir_$(Get-Date -Format 'yyyyMMdd')" `
  -Recurse

# Restart MySQL service
Start-Service MySQL80
```

**⚠️ Important:** Option A (mysqldump) is recommended as it's version-independent and safer.

---

### Phase 3: Transfer and Import Data

#### Step 5: Transfer Backup File to New Server

**Transfer Methods:**

1. **Network Copy (if servers can communicate):**
   ```powershell
   # From current server
   Copy-Item "C:\Backups\woodworking_projects_backup_*.sql" `
     -Destination "\\NEW_SERVER\C$\Temp\"
   ```

2. **USB Drive / External Storage:**
   - Copy the .sql file to USB
   - Physically move to new server
   - Copy to local drive (e.g., C:\Temp\)

3. **Remote Desktop / File Transfer:**
   - Use RDP to access new server
   - Copy file via clipboard or shared folder

4. **Cloud Storage (Azure Blob, OneDrive, etc.):**
   - Upload from current server
   - Download to new server

#### Step 6: Import Database on New Server

```powershell
# On the new server, open PowerShell
cd C:\Temp  # Or wherever you placed the backup file

# Import the database
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" `
  -u secretapp `
  -p `
  < woodworking_projects_backup_20241119_143000.sql  # Use your actual filename

# You'll be prompted for the password: YourSecurePassword123!
```

**Alternative: Import as root if there are issues:**
```powershell
& "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" `
  -u root `
  -p `
  < woodworking_projects_backup_20241119_143000.sql
```

#### Step 7: Verify the Import

```sql
-- Connect to MySQL
mysql -u secretapp -p

-- Switch to the database
USE woodworking_projects;

-- Check tables exist
SHOW TABLES;

-- Check record counts (sample)
SELECT COUNT(*) FROM recipes;
SELECT COUNT(*) FROM myshop_inventory;
SELECT COUNT(*) FROM home_items;
SELECT COUNT(*) FROM conversations;

-- Verify some data
SELECT * FROM recipes LIMIT 5;

EXIT;
```

---

### Phase 4: Update Application Configuration

#### Step 8: Update Connection Settings

Update the MySQL connection in your application:

**File: `server.js` (lines 30-37)**

```javascript
// MySQL connection pool
const pool = mysql.createPool({
  host: 'NEW_SERVER_IP_OR_HOSTNAME',  // ← Change this
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})
```

**Recommended: Use Environment Variables**

Update your `.env` file:
```env
MYSQL_HOST=NEW_SERVER_IP_OR_HOSTNAME
MYSQL_USER=secretapp
MYSQL_PASSWORD=YourSecurePassword123!
MYSQL_DATABASE=woodworking_projects
MYSQL_PORT=3306
```

And modify `server.js` to use environment variables:
```javascript
const pool = mysql.createPool({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'secretapp',
  password: process.env.MYSQL_PASSWORD || 'YourSecurePassword123!',
  database: process.env.MYSQL_DATABASE || 'woodworking_projects',
  port: process.env.MYSQL_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})
```

---

### Phase 5: Testing and Validation

#### Step 9: Test Application Connection

1. **Restart your application:**
   ```powershell
   # If using PM2
   pm2 restart all

   # Or restart the Node.js application
   ```

2. **Test the database connection endpoint:**
   ```powershell
   # From PowerShell or browser
   Invoke-WebRequest -Uri "http://localhost:3000/api/test-db" -Method GET
   ```

3. **Test key application features:**
   - View recipes
   - Add/edit inventory items
   - Check home maintenance items
   - Test conversations/chat
   - Upload images

#### Step 10: Monitor for Issues

Check application logs for any database connection errors:
```powershell
# If using PM2
pm2 logs

# Check for any MySQL connection errors
```

---

## Network Configuration Scenarios

### Scenario 1: Application and Database on Same Server
- Host: `localhost` or `127.0.0.1`
- No special network configuration needed
- Firewall: MySQL port only needs to be open locally

### Scenario 2: Application and Database on Different Servers
- Host: IP address or hostname of database server
- Firewall: Port 3306 must be open on database server
- Network: Ensure servers can communicate
- Security: Consider using private network/VLAN

### Scenario 3: Remote Access via Internet (Not Recommended)
If you must expose MySQL to the internet:
- Use a VPN instead
- Or use SSH tunneling
- Enable SSL/TLS for MySQL connections
- Restrict access by IP address
- Use strong passwords and consider certificate authentication

---

## Security Best Practices

### 1. Change Default Passwords
After migration, consider changing the MySQL password:
```sql
ALTER USER 'secretapp'@'localhost' IDENTIFIED BY 'NewStrongPassword456!';
FLUSH PRIVILEGES;
```

Update your application configuration accordingly.

### 2. Restrict Remote Access
Only allow connections from specific IPs:
```sql
-- Remove wildcard access
DROP USER 'secretapp'@'%';

-- Create user for specific IP only
CREATE USER 'secretapp'@'APP_SERVER_IP' IDENTIFIED BY 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON woodworking_projects.* TO 'secretapp'@'APP_SERVER_IP';
FLUSH PRIVILEGES;
```

### 3. Enable MySQL SSL/TLS (Optional but Recommended)
Configure MySQL to use encrypted connections for remote access.

### 4. Regular Backups
Set up automated backups on the new server:
```powershell
# Create a scheduled task to run daily backups
$action = New-ScheduledTaskAction -Execute 'mysqldump.exe' `
  -Argument '-u secretapp -pYourSecurePassword123! --databases woodworking_projects > C:\Backups\daily_backup.sql'

$trigger = New-ScheduledTaskTrigger -Daily -At 2:00AM

Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "MySQL Daily Backup"
```

---

## Rollback Plan

If something goes wrong during migration:

### Quick Rollback Steps:
1. **Keep the old server running** until you've fully tested the new one
2. Change the application back to point to the old server
3. Restart the application
4. Verify functionality

### Full Rollback:
1. Stop application
2. Restore backup to old server (if needed)
3. Update configuration to old server IP
4. Restart application
5. Test thoroughly

---

## Post-Migration Checklist

- [ ] MySQL 8.0.43 installed on new server
- [ ] Port 3306 opened in firewall
- [ ] Database user `secretapp` created with correct permissions
- [ ] Database backup created on old server
- [ ] Backup transferred to new server
- [ ] Database imported successfully on new server
- [ ] All tables verified (SHOW TABLES)
- [ ] Record counts match between old and new
- [ ] Application configuration updated (server.js or .env)
- [ ] Application restarted
- [ ] Database connection test successful
- [ ] All application features tested
- [ ] Old server kept as backup for 7-30 days
- [ ] Regular backup schedule configured on new server
- [ ] Documentation updated with new server details

---

## Troubleshooting

### Issue: Can't Connect from Application
**Check:**
- Firewall is allowing port 3306
- MySQL is listening on the correct interface (check bind-address in my.cnf)
- User has permissions for remote host (`'secretapp'@'%'` or specific IP)
- Network connectivity between servers

### Issue: Access Denied Error
**Solution:**
```sql
-- Verify user exists
SELECT User, Host FROM mysql.user WHERE User='secretapp';

-- Re-grant permissions
GRANT ALL PRIVILEGES ON woodworking_projects.* TO 'secretapp'@'HOST';
FLUSH PRIVILEGES;
```

### Issue: Table Doesn't Exist After Import
**Solution:**
- Verify import completed without errors
- Check if database name is correct
- Re-run import script
- Check mysqldump output for errors

### Issue: Slow Performance After Migration
**Check:**
- MySQL configuration (my.ini/my.cnf)
- Indexes are created properly
- Server resources (CPU, RAM, Disk)
- Network latency (if remote)

---

## Support Information

### MySQL 8.0 Documentation
- Official Docs: https://dev.mysql.com/doc/refman/8.0/en/
- mysqldump Reference: https://dev.mysql.com/doc/refman/8.0/en/mysqldump.html
- Migration Guide: https://dev.mysql.com/doc/refman/8.0/en/upgrading.html

### Application-Specific Files
- Connection configuration: `server.js` (lines 30-37)
- Database setup scripts: `setup_database.js`
- Table creation scripts: `create_*_tables.sql` files
- Environment configuration: `.env` file

---

## Questions or Issues?

If you encounter any problems during migration, check the following:
1. MySQL error logs: `C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err`
2. Application logs: Check console output or PM2 logs
3. Windows Event Viewer for service-related issues

Good luck with your migration!
