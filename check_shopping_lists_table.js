import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  multipleStatements: true
}

async function checkShoppingListsTable() {
  let connection
  
  try {
    console.log('🔌 Connecting to MySQL...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Connected to MySQL\n')
    
    // Show table structure for recipe_shopping_lists
    console.log('📊 Recipe Shopping Lists table structure:')
    const [columns] = await connection.query('DESCRIBE recipe_shopping_lists')
    console.table(columns)
    
    // Show a sample of the data
    console.log('\n📋 Sample shopping lists data:')
    const [lists] = await connection.query('SELECT * FROM recipe_shopping_lists ORDER BY id DESC LIMIT 5')
    console.table(lists)
    
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

console.log('🚀 Checking shopping lists table...\n')
checkShoppingListsTable()