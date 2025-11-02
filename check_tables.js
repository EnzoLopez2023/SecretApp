import mysql from 'mysql2/promise'

// Database connection configuration (same as server.js)
const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects'
}

async function checkTables() {
  let connection
  
  try {
    console.log('🔌 Connecting to MySQL database...')
    connection = await mysql.createConnection(dbConfig)
    
    console.log('📋 Checking all tables in database...')
    const [tables] = await connection.execute('SHOW TABLES')
    
    console.log('📊 Current tables:')
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`)
    })
    
    // Check specifically for recipe-related tables
    console.log('\n🔍 Checking for Recipe Manager tables...')
    const [recipeTables] = await connection.execute('SHOW TABLES LIKE "recipe%"')
    
    if (recipeTables.length > 0) {
      console.log('✅ Recipe Manager tables found:')
      recipeTables.forEach(table => {
        console.log(`  ✓ ${Object.values(table)[0]}`)
      })
    } else {
      console.log('❌ No Recipe Manager tables found!')
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

checkTables()