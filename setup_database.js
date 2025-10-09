import mysql from 'mysql2/promise'
import fs from 'fs'

const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  multipleStatements: true
}

async function setupDatabase() {
  let connection
  
  try {
    console.log('🔌 Connecting to MySQL...')
    connection = await mysql.createConnection(dbConfig)
    console.log('✅ Connected to MySQL\n')
    
    // Read and execute the SQL file
    console.log('📝 Creating myshop_inventory table...')
    const sql = fs.readFileSync('create_myshop_table.sql', 'utf8')
    
    await connection.query(sql)
    console.log('✅ Table created successfully\n')
    
    // Verify table exists
    const [tables] = await connection.query("SHOW TABLES LIKE 'myshop_inventory'")
    if (tables.length > 0) {
      console.log('✅ Table verification successful\n')
      
      // Show table structure
      const [columns] = await connection.query('DESCRIBE myshop_inventory')
      console.log('📊 Table structure:')
      console.table(columns)
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

console.log('🚀 Setting up MyShop database...\n')
setupDatabase()
  .then(() => {
    console.log('\n✨ Database setup complete!')
    console.log('Next step: Run "node import_myshop_data.js" to import data')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error)
    process.exit(1)
  })
