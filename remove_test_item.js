// Remove the test item from MySQL database

import mysql from 'mysql2/promise'

const dbConfig = {
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects'
}

async function removeTestItem() {
  let connection
  
  try {
    connection = await mysql.createConnection(dbConfig)
    
    console.log('🗑️  Removing test item from database...\n')
    
    const [result] = await connection.query(
      'DELETE FROM myshop_inventory WHERE item_id = 99999'
    )
    
    if (result.affectedRows > 0) {
      console.log('✅ Test item removed successfully!\n')
      console.log(`   Deleted ${result.affectedRows} row(s)`)
    } else {
      console.log('⚠️  No test item found (might already be removed)')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

removeTestItem()
