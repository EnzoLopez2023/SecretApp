# MyShop MySQL Setup Automation Script
# This script automates the setup of MyShop inventory in MySQL

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  MyShop MySQL Database Setup" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$mysqlUser = "secretapp"
$mysqlPassword = "YourSecurePassword123!"
$mysqlDatabase = "woodworking_projects"
$mysqlHost = "localhost"

# Step 1: Test MySQL Connection
Write-Host "Step 1: Testing MySQL Connection..." -ForegroundColor Yellow
try {
    $result = mysql -u $mysqlUser -p$mysqlPassword -h $mysqlHost -e "SELECT 1;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ MySQL connection successful" -ForegroundColor Green
    } else {
        Write-Host "✗ MySQL connection failed" -ForegroundColor Red
        Write-Host "Please check your MySQL credentials and ensure MySQL is running." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error connecting to MySQL: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Create Table
Write-Host "Step 2: Creating MyShop Inventory Table..." -ForegroundColor Yellow
try {
    $result = Get-Content create_myshop_table.sql | mysql -u $mysqlUser -p$mysqlPassword -h $mysqlHost $mysqlDatabase 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Table created successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create table" -ForegroundColor Red
        Write-Host $result
        exit 1
    }
} catch {
    Write-Host "✗ Error creating table: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Import Data
Write-Host "Step 3: Importing data from MyShop.json..." -ForegroundColor Yellow
Write-Host "This may take a few minutes..." -ForegroundColor Gray
try {
    node import_myshop_data.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Data import completed" -ForegroundColor Green
    } else {
        Write-Host "✗ Data import failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error importing data: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 4: Verify Import
Write-Host "Step 4: Verifying data import..." -ForegroundColor Yellow
try {
    $count = mysql -u $mysqlUser -p$mysqlPassword -h $mysqlHost $mysqlDatabase -sN -e "SELECT COUNT(*) FROM myshop_inventory;" 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Verification successful" -ForegroundColor Green
        Write-Host "  Total items in database: $count" -ForegroundColor Cyan
    } else {
        Write-Host "✗ Verification failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "✗ Error verifying import: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 5: Display Statistics
Write-Host "Step 5: Database Statistics..." -ForegroundColor Yellow
$stats = mysql -u $mysqlUser -p$mysqlPassword -h $mysqlHost $mysqlDatabase -e "
    SELECT 
        COUNT(*) as 'Total Items',
        COUNT(DISTINCT company) as 'Companies',
        SUM(qty) as 'Total Quantity',
        CONCAT('$', FORMAT(SUM(price * qty), 2)) as 'Total Value'
    FROM myshop_inventory;
" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host $stats
} else {
    Write-Host "Unable to fetch statistics" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  Setup Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the server: node server.js" -ForegroundColor White
Write-Host "2. Test the API: http://localhost:3001/api/inventory" -ForegroundColor White
Write-Host "3. Access MyShopTools in your app" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see MYSHOP_MYSQL_SETUP.md" -ForegroundColor Gray
Write-Host ""
