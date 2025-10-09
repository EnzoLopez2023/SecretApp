# Quick Start: MyShop MySQL Migration

## 🚀 One-Command Setup

Run this PowerShell script to set everything up automatically:

```powershell
.\setup-myshop-mysql.ps1
```

## 📋 Manual Setup (Step-by-Step)

### 1. Create the table
```powershell
mysql -u secretapp -p woodworking_projects < create_myshop_table.sql
```

### 2. Import the data
```powershell
node import_myshop_data.js
```

### 3. Start the server
```powershell
node server.js
```

## 🧪 Test the API

```powershell
# Get all items
curl http://localhost:3001/api/inventory

# Search for items
curl "http://localhost:3001/api/inventory?search=Woodpeckers"

# Get statistics
curl http://localhost:3001/api/inventory/stats/summary
```

## ✅ What Changed

### Files Created:
- `create_myshop_table.sql` - Database schema
- `import_myshop_data.js` - Data migration script
- `setup-myshop-mysql.ps1` - Automated setup script
- `MYSHOP_MYSQL_SETUP.md` - Full documentation

### Files Modified:
- `server.js` - Added MyShop API endpoints
- `src/MyShopTools.tsx` - Updated to use API instead of JSON

### API Endpoints Added:
- `GET /api/inventory` - Get all items (with search)
- `GET /api/inventory/:id` - Get item by database ID
- `GET /api/inventory/item/:itemId` - Get item by item_id
- `POST /api/inventory` - Create new item
- `PUT /api/inventory/:id` - Update item
- `DELETE /api/inventory/:id` - Delete item
- `GET /api/inventory/stats/summary` - Get statistics

## 💡 Benefits

✓ **Fast queries** - MySQL indexing for instant searches  
✓ **Scalable** - Handle thousands of items efficiently  
✓ **Data integrity** - ACID compliance  
✓ **Concurrent access** - Multiple users simultaneously  
✓ **Advanced features** - Sorting, filtering, aggregation  
✓ **Backup ready** - Standard database backup tools  

## 🔍 Verify Everything Works

1. **Check table exists:**
   ```sql
   USE woodworking_projects;
   SHOW TABLES LIKE 'myshop_inventory';
   ```

2. **Check data count:**
   ```sql
   SELECT COUNT(*) FROM myshop_inventory;
   ```

3. **Test API:**
   ```powershell
   curl http://localhost:3001/api/test
   curl http://localhost:3001/api/inventory
   ```

4. **Open app and navigate to MyShopTools**
   - Should load data from MySQL
   - Search should work
   - Details should display correctly

## 📚 Full Documentation

See `MYSHOP_MYSQL_SETUP.md` for complete documentation including:
- Detailed schema information
- All API endpoints with examples
- Troubleshooting guide
- Next steps and recommendations
