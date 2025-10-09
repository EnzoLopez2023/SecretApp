import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// MySQL connection configuration
const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

async function importMyShopData() {
  let connection
  
  try {
    // Read the JSON file
    const jsonPath = path.join(__dirname, 'src', 'assets', 'MyShop.json')
    console.log('📖 Reading MyShop.json from:', jsonPath)
    
    const jsonData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const inventory = jsonData.Inventory
    
    console.log(`📦 Found ${inventory.length} items in MyShop.json`)
    
    // Connect to MySQL
    console.log('🔌 Connecting to MySQL...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Connected to MySQL')
    
    // Clear existing data
    console.log('🗑️  Clearing existing inventory data...')
    await connection.query('DELETE FROM myshop_inventory')
    console.log('✅ Existing data cleared')
    
    // Prepare insert statement
    const insertQuery = `
      INSERT INTO myshop_inventory (
        item_id, order_number, order_date, product_name, product_detail,
        company, location, sub_location, tags, sku, price, qty,
        sku_on_website, barcode, notes, purchased, spare2,
        base_url, full_url, html_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    // Insert data in batches
    console.log('💾 Importing data to MySQL...')
    let successCount = 0
    let errorCount = 0
    
    for (let i = 0; i < inventory.length; i++) {
      const item = inventory[i]
      
      try {
        // Convert "Null" strings to actual null values
        const cleanValue = (val) => (val === "Null" || val === "" || val === undefined) ? null : val
        
        // Clean price - remove $ and any whitespace
        const cleanPrice = (price) => {
          if (!price) return 0
          if (typeof price === 'number') return price
          // Remove $, spaces, and convert to number
          const cleaned = String(price).replace(/[$\s]/g, '')
          return parseFloat(cleaned) || 0
        }
        
        // Clean order number - handle large numbers as strings
        const cleanOrderNumber = (orderNum) => {
          if (!orderNum) return null
          // If it's too large for BIGINT, truncate or set to null
          const num = String(orderNum).replace(/[^0-9]/g, '')
          if (num.length > 19) return null // BIGINT max is 19 digits
          return num || null
        }
        
        await connection.query(insertQuery, [
          item.ItemID || null,
          cleanOrderNumber(item.OrderNumber),
          item.OrderDate || null,
          cleanValue(item.ProductName) || 'Unknown Product',
          cleanValue(item.ProductDetail),
          cleanValue(item.Company),
          cleanValue(item.Location),
          cleanValue(item.SubLocation),
          cleanValue(item.Tags),
          cleanValue(item.SKU),
          cleanPrice(item.Price),
          item.Qty || 0,
          cleanValue(item.SKUonWebsite),
          cleanValue(item.Barcode),
          cleanValue(item.Notes),
          cleanValue(item.Purchased),
          cleanValue(item.Spare2),
          cleanValue(item.BaseURL),
          cleanValue(item.FullURL),
          cleanValue(item.HTMLLink)
        ])
        
        successCount++
        
        // Progress indicator
        if ((i + 1) % 100 === 0) {
          console.log(`   Imported ${i + 1}/${inventory.length} items...`)
        }
      } catch (error) {
        errorCount++
        console.error(`❌ Error importing item ${item.ItemID}:`, error.message)
      }
    }
    
    console.log('\n✅ Import completed!')
    console.log(`   Successfully imported: ${successCount} items`)
    if (errorCount > 0) {
      console.log(`   Failed to import: ${errorCount} items`)
    }
    
    // Verify the import
    const [[result]] = await connection.query('SELECT COUNT(*) as count FROM myshop_inventory')
    console.log(`\n📊 Total items in database: ${result.count}`)
    
  } catch (error) {
    console.error('❌ Error during import:', error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 Database connection closed')
    }
  }
}

// Run the import
console.log('🚀 Starting MyShop data import...\n')
importMyShopData()
  .then(() => {
    console.log('\n✨ Import process finished successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Import process failed:', error)
    process.exit(1)
  })
