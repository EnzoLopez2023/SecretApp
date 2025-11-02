import mysql from 'mysql2/promise'
import fs from 'fs'

// Database connection configuration (same as server.js)
const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  multipleStatements: true
}

async function setupRecipeTables() {
  let connection
  
  try {
    console.log('🔌 Connecting to MySQL database...')
    connection = await mysql.createConnection(dbConfig)
    
    console.log('📖 Reading SQL file...')
    const sqlScript = fs.readFileSync('create_recipe_tables_simple.sql', 'utf8')
    
    console.log('🚀 Executing SQL script...')
    
    // Split the SQL script into individual statements
    const statements = sqlScript
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`📊 Found ${statements.length} SQL statements to execute...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)
          await connection.execute(statement)
        } catch (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          console.error(`Statement: ${statement.substring(0, 100)}...`)
          throw error
        }
      }
    }
    
    console.log('✅ Recipe Manager tables created successfully!')
    console.log('📊 Database setup complete!')
    
    // Verify tables were created by checking one of them
    console.log('🔍 Verifying table creation...')
    const [tables] = await connection.execute('SHOW TABLES LIKE "recipes"')
    
    if (tables.length > 0) {
      console.log('✅ Verification successful - "recipes" table exists!')
    } else {
      console.log('❌ Verification failed - "recipes" table not found!')
    }
    
  } catch (error) {
    console.error('❌ Error setting up Recipe Manager tables:', error.message)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
      console.log('🔌 Database connection closed.')
    }
  }
}

// Run the setup
setupRecipeTables()