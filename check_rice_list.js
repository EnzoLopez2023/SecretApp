import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  multipleStatements: true
}

async function checkLatestRiceList() {
  let connection
  
  try {
    console.log('🔌 Connecting to MySQL...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Connected to MySQL\n')
    
    // Get the rice 2 list
    console.log('📋 Latest shopping lists:')
    const [lists] = await connection.query('SELECT * FROM recipe_shopping_lists ORDER BY id DESC LIMIT 3')
    console.table(lists)
    
    // Get items from rice 2 list (should be the latest)
    if (lists.length > 0) {
      const listId = lists[0].id
      console.log(`\n🛒 Items in ${lists[0].name} (ID: ${listId}):`)
      const [items] = await connection.query(`
        SELECT item_name, quantity, unit, estimated_cost, notes 
        FROM recipe_shopping_list_items 
        WHERE shopping_list_id = ? 
        ORDER BY item_name
      `, [listId])
      console.table(items)
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

console.log('🚀 Checking latest rice list...\n')
checkLatestRiceList()