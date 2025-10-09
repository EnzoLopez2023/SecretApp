# MyShop MySQL Database Setup Guide

This guide will help you set up the MyShop Inventory database in MySQL and migrate your data from the JSON file.

## Prerequisites

- MySQL Server running on localhost
- MySQL user `secretapp` with password `YourSecurePassword123!`
- Database `woodworking_projects` already created
- Node.js and npm installed

## Setup Steps

### Step 1: Create the MyShop Inventory Table

Run the SQL script to create the table:

```powershell
mysql -u secretapp -p woodworking_projects < create_myshop_table.sql
```

Or manually execute the SQL:

```powershell
mysql -u secretapp -p
```

Then paste the contents of `create_myshop_table.sql`.

### Step 2: Import Data from JSON to MySQL

Run the import script:

```powershell
node import_myshop_data.js
```

This script will:
- Read the `src/assets/MyShop.json` file
- Clear any existing data in the `myshop_inventory` table
- Import all items from the JSON file into MySQL
- Show progress and summary statistics

### Step 3: Verify the Import

Check that the data was imported successfully:

```sql
USE woodworking_projects;
SELECT COUNT(*) FROM myshop_inventory;
SELECT * FROM myshop_inventory LIMIT 10;
```

### Step 4: Start the Server

The server already includes the new API endpoints for MyShop inventory. Start it:

```powershell
node server.js
```

The server will run on `http://localhost:3001`

### Step 5: Test the API Endpoints

Test that the API is working:

```powershell
# Get all inventory items
curl http://localhost:3001/api/inventory

# Search for items
curl "http://localhost:3001/api/inventory?search=Woodpeckers"

# Get a specific item (replace 1 with actual item_id)
curl http://localhost:3001/api/inventory/item/1

# Get inventory statistics
curl http://localhost:3001/api/inventory/stats/summary
```

### Step 6: Use the Updated MyShopTools Component

The `MyShopTools.tsx` component has been updated to:
- Fetch data from the MySQL API instead of the JSON file
- Use the new database field names (snake_case instead of PascalCase)
- Display loading states and error messages
- Work seamlessly with the API

## Database Schema

The `myshop_inventory` table includes:

- `id` - Auto-increment primary key
- `item_id` - Original item ID from JSON
- `order_number` - Order number
- `order_date` - Order date (Excel date format)
- `product_name` - Product name
- `product_detail` - Product details
- `company` - Company/manufacturer
- `location` - Storage location
- `sub_location` - Sub-location within storage
- `tags` - Tags for categorization
- `sku` - Stock keeping unit
- `price` - Product price
- `qty` - Quantity
- `sku_on_website` - SKU on website
- `barcode` - Barcode
- `notes` - Additional notes
- `purchased` - Where purchased
- `spare2` - Spare field
- `base_url` - Base URL for product
- `full_url` - Full product URL
- `html_link` - HTML link to product
- `created_at` - Timestamp when created
- `updated_at` - Timestamp when last updated

## Available API Endpoints

### GET /api/inventory
Get all inventory items with optional search

**Query Parameters:**
- `search` - Search term to filter items

**Example:**
```
GET /api/inventory?search=pencil
```

### GET /api/inventory/:id
Get a single inventory item by database ID

### GET /api/inventory/item/:itemId
Get a single inventory item by item_id

### POST /api/inventory
Create a new inventory item

**Body:** JSON object with inventory fields

### PUT /api/inventory/:id
Update an existing inventory item

**Body:** JSON object with updated fields

### DELETE /api/inventory/:id
Delete an inventory item

### GET /api/inventory/stats/summary
Get inventory statistics (total items, companies, quantity, value, average price)

## Benefits of MySQL Over JSON

1. **Performance**: Faster queries and filtering on large datasets
2. **Scalability**: Can handle millions of records efficiently
3. **Data Integrity**: ACID compliance ensures data consistency
4. **Concurrent Access**: Multiple users can access/modify data simultaneously
5. **Advanced Queries**: Complex filtering, sorting, and aggregation
6. **Backup & Recovery**: Built-in database backup tools
7. **Relationships**: Can easily link to other tables (projects, orders, etc.)
8. **Indexing**: Fast lookups on commonly queried fields

## Troubleshooting

### Cannot connect to MySQL
- Verify MySQL is running: `mysql -u secretapp -p`
- Check credentials in `server.js` and `import_myshop_data.js`

### Import fails with errors
- Ensure the JSON file exists at `src/assets/MyShop.json`
- Check that the table was created successfully
- Verify the database user has INSERT permissions

### API returns 500 errors
- Check the server console for detailed error messages
- Verify the database connection is working
- Test the database connection endpoint: `http://localhost:3001/api/test`

### MyShopTools component shows no data
- Ensure the server is running on port 3001
- Check browser console for CORS or network errors
- Verify data was imported successfully using SQL queries

## Next Steps

- Add authentication to protect the API endpoints
- Implement pagination for large datasets
- Add bulk import/export features
- Create backup/restore functionality
- Add data validation and sanitization
- Implement audit logging for data changes
