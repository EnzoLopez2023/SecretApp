import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  multipleStatements: true
}

async function addNotesColumn() {
  let connection
  
  try {
    console.log('🔌 Connecting to MySQL...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Connected to MySQL\n')
    
    // Check if notes column already exists
    console.log('🔍 Checking if notes column exists...')
    const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'woodworking_projects' 
      AND TABLE_NAME = 'recipe_shopping_list_items' 
      AND COLUMN_NAME = 'notes'
    `)
    
    if (columns.length > 0) {
      console.log('✅ Notes column already exists\n')
    } else {
      console.log('📝 Adding notes column...')
      await connection.query(`
        ALTER TABLE recipe_shopping_list_items 
        ADD COLUMN notes TEXT AFTER estimated_cost
      `)
      console.log('✅ Notes column added successfully\n')
    }
    
    // Show updated table structure
    const [tableColumns] = await connection.query('DESCRIBE recipe_shopping_list_items')
    console.log('📊 Updated table structure:')
    console.table(tableColumns)
    
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

console.log('🚀 Adding notes column to shopping list items...\n')
addNotesColumn()