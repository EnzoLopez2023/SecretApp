import mysql from 'mysql2/promise'
import fetch from 'node-fetch'

const pool = mysql.createPool({
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

async function testMessageSaving() {
  try {
    console.log('Testing single message endpoint...')
    
    const testMessage = {
      message: {
        id: `test-${Date.now()}`,
        type: 'user',
        content: 'This is a test message from Node.js',
        timestamp: new Date().toISOString()
      }
    }
    
    console.log('Sending message:', JSON.stringify(testMessage, null, 2))
    
    const response = await fetch('http://localhost:3001/api/conversations/4/message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    })
    
    console.log('Response status:', response.status)
    const responseText = await response.text()
    console.log('Response body:', responseText)
    
    if (response.ok) {
      console.log('✅ Message sent successfully!')
      
      // Check if it was saved
      console.log('\nChecking database...')
      const [messages] = await pool.query('SELECT * FROM conversation_messages WHERE conversation_id = 4')
      console.table(messages)
      
      const [conversation] = await pool.query('SELECT * FROM conversations WHERE id = 4')
      console.table(conversation)
    } else {
      console.log('❌ Failed to send message')
    }
    
  } catch (error) {
    console.error('❌ Error testing message saving:', error)
  } finally {
    await pool.end()
  }
}

testMessageSaving()