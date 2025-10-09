// Test script to verify MyShop data is coming from MySQL
// Run this with: node verify_mysql_source.js

import mysql from 'mysql2/promise'
import fs from 'fs'

const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects'
}

async function verifyDataSource() {
  let connection
  
  try {
    console.log('🔍 Verifying MyShop data source...\n')
    
    // Connect to MySQL
    connection = await mysql.createConnection(dbConfig)
    
    // Get count from database
    const [[dbCount]] = await connection.query('SELECT COUNT(*) as count FROM myshop_inventory')
    console.log(`📊 Database count: ${dbCount.count} items`)
    
    // Get count from JSON
    const jsonData = JSON.parse(fs.readFileSync('src/assets/MyShop.json', 'utf8'))
    console.log(`📄 JSON file count: ${jsonData.Inventory.length} items\n`)
    
    // Get first item from database
    const [[firstDbItem]] = await connection.query('SELECT * FROM myshop_inventory ORDER BY item_id LIMIT 1')
    console.log('📦 First item in DATABASE:')
    console.log(`   ID: ${firstDbItem.item_id}`)
    console.log(`   Name: ${firstDbItem.product_name}`)
    console.log(`   Company: ${firstDbItem.company}`)
    console.log(`   Price: $${firstDbItem.price}\n`)
    
    // Get first item from JSON
    const firstJsonItem = jsonData.Inventory[0]
    console.log('📄 First item in JSON:')
    console.log(`   ID: ${firstJsonItem.ItemID}`)
    console.log(`   Name: ${firstJsonItem.ProductName}`)
    console.log(`   Company: ${firstJsonItem.Company}`)
    console.log(`   Price: $${firstJsonItem.Price}\n`)
    
    // Test the API endpoint
    console.log('🌐 Testing API endpoint...')
    const response = await fetch('http://localhost:3001/api/inventory')
    if (response.ok) {
      const apiData = await response.json()
      console.log(`✅ API returned ${apiData.length} items`)
      console.log(`   First item: ${apiData[0].product_name}\n`)
    } else {
      console.log(`❌ API request failed: ${response.status} ${response.statusText}\n`)
    }
    
    console.log('✨ Verification complete!\n')
    console.log('How to confirm MyShopTools is using MySQL:')
    console.log('1. Check browser Network tab - should see requests to http://localhost:3001/api/inventory')
    console.log('2. Check browser Console - should show API fetch calls')
    console.log('3. Temporarily rename MyShop.json and app should still work')
    console.log('4. Update a field in database and refresh - changes should appear immediately')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

verifyDataSource()
