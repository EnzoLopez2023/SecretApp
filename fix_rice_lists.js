import mysql from 'mysql2/promise'
import { convertToStorePackage } from './utils/storePackageSizes.js'

const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  multipleStatements: true
}

async function fixRiceLists() {
  let connection
  
  try {
    console.log('🔌 Connecting to MySQL...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Connected to MySQL\n')
    
    // Get the rice lists with $0.00 totals
    console.log('📋 Finding lists with $0.00 totals...')
    const [lists] = await connection.query(`
      SELECT * FROM recipe_shopping_lists 
      WHERE total_estimated_cost = 0.00 
      ORDER BY id DESC 
      LIMIT 5
    `)
    
    console.log(`Found ${lists.length} lists to fix`)
    
    for (const list of lists) {
      console.log(`\n🛠️ Fixing list: ${list.name} (ID: ${list.id})`)
      
      // Get all items for this list
      const [items] = await connection.query(`
        SELECT * FROM recipe_shopping_list_items 
        WHERE shopping_list_id = ?
      `, [list.id])
      
      let totalCost = 0
      
      // Update each item with correct pricing
      for (const item of items) {
        // Convert the original ingredient back to proper package size
        const storePackage = convertToStorePackage(item.item_name, parseFloat(item.quantity), item.unit)
        
        console.log(`  📦 ${item.item_name}: $${item.estimated_cost} → $${storePackage.estimatedPrice}`)
        
        // Update the item with correct pricing
        await connection.query(`
          UPDATE recipe_shopping_list_items 
          SET estimated_cost = ?, 
              quantity = ?,
              unit = ?,
              notes = ?
          WHERE id = ?
        `, [
          storePackage.estimatedPrice || 0,
          storePackage.packageSize,
          storePackage.packageUnit,
          `${storePackage.notes || ''} (Recipe calls for: ${storePackage.originalQuantity})`.trim(),
          item.id
        ])
        
        totalCost += (storePackage.estimatedPrice || 0)
      }
      
      // Update the list total
      await connection.query(`
        UPDATE recipe_shopping_lists 
        SET total_estimated_cost = ? 
        WHERE id = ?
      `, [totalCost.toFixed(2), list.id])
      
      console.log(`  💰 Updated total: $0.00 → $${totalCost.toFixed(2)}`)
    }
    
    console.log('\n✅ All lists have been fixed!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('\n🔌 Database connection closed')
    }
  }
}

console.log('🚀 Fixing rice lists with correct pricing...\n')
fixRiceLists()