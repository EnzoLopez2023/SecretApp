import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

async function setupConversationTables() {
  try {
    console.log('Creating conversations table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          message_count INT DEFAULT 0,
          last_message_preview TEXT
      )
    `)

    console.log('Creating conversation_messages table...')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversation_messages (
          id INT AUTO_INCREMENT PRIMARY KEY,
          conversation_id INT NOT NULL,
          message_id VARCHAR(255) NOT NULL UNIQUE,
          type ENUM('user', 'assistant') NOT NULL,
          content TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
      )
    `)

    console.log('Creating indexes...')
    
    // Check and create indexes only if they don't exist
    try {
      await pool.query(`CREATE INDEX idx_conversation_id ON conversation_messages(conversation_id)`)
      console.log('Created index: idx_conversation_id')
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('Index idx_conversation_id already exists')
      } else {
        throw error
      }
    }
    
    try {
      await pool.query(`CREATE INDEX idx_timestamp ON conversation_messages(timestamp)`)
      console.log('Created index: idx_timestamp')
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('Index idx_timestamp already exists')
      } else {
        throw error
      }
    }
    
    try {
      await pool.query(`CREATE INDEX idx_conversations_updated ON conversations(updated_at DESC)`)
      console.log('Created index: idx_conversations_updated')
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('Index idx_conversations_updated already exists')
      } else {
        throw error
      }
    }

    console.log('✅ Conversation tables created successfully!')
    
  } catch (error) {
    console.error('❌ Error creating tables:', error)
  } finally {
    await pool.end()
  }
}

setupConversationTables()