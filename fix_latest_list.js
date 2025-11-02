import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  multipleStatements: true
}

async function fixLatestShoppingList() {
  let connection
  
  try {
    console.log('🔌 Connecting to MySQL...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Connected to MySQL\n')
    
    // Get the latest shopping list
    const [lists] = await connection.query('SELECT * FROM recipe_shopping_lists ORDER BY id DESC LIMIT 1')
    if (lists.length === 0) {
      console.log('❌ No shopping lists found')
      return
    }
    
    const list = lists[0]
    console.log(`📋 Fixing list: ${list.name} (ID: ${list.id})`)
    
    // Calculate correct total from items
    const [items] = await connection.query(`
      SELECT estimated_cost 
      FROM recipe_shopping_list_items 
      WHERE shopping_list_id = ?
    `, [list.id])
    
    const correctTotal = items.reduce((sum, item) => sum + parseFloat(item.estimated_cost || 0), 0)
    console.log(`💰 Calculated total: $${correctTotal.toFixed(2)}`)
    
    // Update the shopping list with correct total
    await connection.query(`
      UPDATE recipe_shopping_lists 
      SET total_estimated_cost = ? 
      WHERE id = ?
    `, [correctTotal.toFixed(2), list.id])
    
    console.log('✅ Updated total cost in database')
    
    // Verify the update
    const [updatedList] = await connection.query('SELECT total_estimated_cost FROM recipe_shopping_lists WHERE id = ?', [list.id])
    console.log(`🔍 Verification - New total: $${updatedList[0].total_estimated_cost}`)
    
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

console.log('🚀 Fixing shopping list total cost...\n')
fixLatestShoppingList()