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

async function debugConversations() {
  try {
    console.log('=== CONVERSATIONS TABLE ===')
    const [conversations] = await pool.query('SELECT * FROM conversations ORDER BY created_at DESC')
    console.table(conversations)

    console.log('\n=== CONVERSATION MESSAGES TABLE ===')
    const [messages] = await pool.query('SELECT * FROM conversation_messages ORDER BY timestamp DESC')
    console.table(messages)

    if (messages.length === 0) {
      console.log('\n❌ No messages found in conversation_messages table')
      console.log('This indicates that messages are not being saved to the database')
    }

  } catch (error) {
    console.error('❌ Error querying database:', error)
  } finally {
    await pool.end()
  }
}

debugConversations()