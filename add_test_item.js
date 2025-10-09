// Quick test to add a unique item to MySQL database
// This item will NOT exist in the JSON file
// If you see it in MyShopTools, you're using MySQL!

import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects'
}

async function addTestItem() {
  let connection
  
  try {
    connection = await mysql.createConnection(dbConfig)
    
    console.log('🧪 Adding test item to MySQL database...\n')
    
    // Check if test item already exists
    const [[existing]] = await connection.query(
      'SELECT * FROM myshop_inventory WHERE item_id = 99999'
    )
    
    if (existing) {
      console.log('⚠️  Test item already exists. Updating it...')
      await connection.query(
        `UPDATE myshop_inventory 
         SET product_name = '🔥 MYSQL TEST - You are using DATABASE! 🔥',
             company = 'MySQL Verification',
             price = 123.45,
             qty = 999,
             tags = 'TEST,MYSQL,DATABASE'
         WHERE item_id = 99999`
      )
      console.log('✅ Test item updated!\n')
    } else {
      await connection.query(
        `INSERT INTO myshop_inventory 
         (item_id, product_name, company, sku, price, qty, tags, notes)
         VALUES 
         (99999, '🔥 MYSQL TEST - You are using DATABASE! 🔥', 'MySQL Verification', 'TEST-99999', 123.45, 999, 'TEST,MYSQL,DATABASE', 'This item only exists in MySQL, not in MyShop.json')`
      )
      console.log('✅ Test item added to database!\n')
    }
    
    // Verify it was added
    const [[testItem]] = await connection.query(
      'SELECT * FROM myshop_inventory WHERE item_id = 99999'
    )
    
    console.log('📦 Test Item Details:')
    console.log(`   Item ID: ${testItem.item_id}`)
    console.log(`   Name: ${testItem.product_name}`)
    console.log(`   Company: ${testItem.company}`)
    console.log(`   Price: $${testItem.price}`)
    console.log(`   Tags: ${testItem.tags}\n`)
    
    console.log('═══════════════════════════════════════════════')
    console.log('🎯 HOW TO VERIFY YOU\'RE USING MYSQL:')
    console.log('═══════════════════════════════════════════════')
    console.log('1. Open your app in the browser')
    console.log('2. Go to MyShopTools section')
    console.log('3. Search for: "MYSQL TEST"')
    console.log('4. OR Search for: "99999"')
    console.log('')
    console.log('✅ IF YOU SEE IT: You\'re using MySQL!')
    console.log('❌ IF YOU DON\'T: Still using JSON file')
    console.log('═══════════════════════════════════════════════\n')
    
    console.log('🗑️  To remove the test item later, run:')
    console.log('   node remove_test_item.js\n')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

addTestItem()
