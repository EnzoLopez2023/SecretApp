import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  multipleStatements: true
}

async function checkLatestShoppingList() {
  let connection
  
  try {
    console.log('🔌 Connecting to MySQL...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Connected to MySQL\n')
    
    // Get the latest shopping list with its total cost
    console.log('📋 Latest shopping list:')
    const [lists] = await connection.query('SELECT * FROM recipe_shopping_lists ORDER BY id DESC LIMIT 1')
    console.table(lists)
    
    if (lists.length > 0) {
      const listId = lists[0].id
      console.log(`\n🛒 Items in list ${listId} (${lists[0].name}):`)
      const [items] = await connection.query(`
        SELECT item_name, quantity, unit, estimated_cost, notes 
        FROM recipe_shopping_list_items 
        WHERE shopping_list_id = ? 
        ORDER BY item_name
      `, [listId])
      console.table(items)
      
      // Calculate what the total should be
      const calculatedTotal = items.reduce((sum, item) => sum + parseFloat(item.estimated_cost || 0), 0)
      console.log(`\n💰 Price Analysis:`)
      console.log(`   Database total_estimated_cost: $${lists[0].total_estimated_cost}`)
      console.log(`   Calculated from items: $${calculatedTotal.toFixed(2)}`)
      console.log(`   Match: ${lists[0].total_estimated_cost == calculatedTotal.toFixed(2) ? '✅' : '❌'}`)
    }
    
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

console.log('🚀 Checking latest shopping list pricing...\n')
checkLatestShoppingList()