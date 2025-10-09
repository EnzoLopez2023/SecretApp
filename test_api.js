import fetch from 'node-fetch'

async function testAPI() {
  console.log('🧪 Testing MyShop API Endpoints...\n')
  
  try {
    // Test 1: Get all inventory
    console.log('Test 1: GET /api/inventory')
    const response1 = await fetch('http://localhost:3001/api/inventory')
    
    if (!response1.ok) {
      console.log('❌ Failed:', response1.status, response1.statusText)
      const text = await response1.text()
      console.log('Response:', text)
    } else {
      const data = await response1.json()
      console.log(`✅ Success: Retrieved ${data.length} items`)
      console.log('First item:', JSON.stringify(data[0], null, 2))
    }
    
    console.log('\n')
    
    // Test 2: Search
    console.log('Test 2: GET /api/inventory?search=Woodpeckers')
    const response2 = await fetch('http://localhost:3001/api/inventory?search=Woodpeckers')
    
    if (!response2.ok) {
      console.log('❌ Failed:', response2.status, response2.statusText)
    } else {
      const data = await response2.json()
      console.log(`✅ Success: Found ${data.length} items matching "Woodpeckers"`)
    }
    
    console.log('\n')
    
    // Test 3: Get statistics
    console.log('Test 3: GET /api/inventory/stats/summary')
    const response3 = await fetch('http://localhost:3001/api/inventory/stats/summary')
    
    if (!response3.ok) {
      console.log('❌ Failed:', response3.status, response3.statusText)
    } else {
      const data = await response3.json()
      console.log('✅ Success:')
      console.log(JSON.stringify(data, null, 2))
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

testAPI()
