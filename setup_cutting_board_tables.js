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

async function setupCuttingBoardTables() {
  console.log('Setting up Cutting Board Designer tables...')

  const connection = await mysql.createConnection(dbConfig)

  try {
    console.log('Connected to database')

    // Read and execute the SQL file
    const sqlScript = fs.readFileSync('create_cutting_board_designs_table.sql', 'utf8')
    await connection.query(sqlScript)

    console.log('✅ Cutting board designs table created successfully')

    // Verify the table was created
    const [tables] = await connection.query(`
      SHOW TABLES LIKE 'cutting_board_designs'
    `)

    if (tables.length > 0) {
      console.log('✅ Table verified: cutting_board_designs')
      
      // Show table structure
      const [columns] = await connection.query(`
        DESCRIBE cutting_board_designs
      `)
      
      console.log('\nTable structure:')
      columns.forEach(col => {
        console.log(`  - ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key === 'PRI' ? '(PRIMARY KEY)' : ''}`)
      })
    }

  } catch (error) {
    console.error('Error setting up tables:', error)
    throw error
  } finally {
    await connection.end()
    console.log('\nDatabase connection closed')
  }
}

setupCuttingBoardTables()
  .then(() => {
    console.log('\n✅ Setup complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  })
