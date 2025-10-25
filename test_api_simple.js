import fetch from 'node-fetch';

async function testAPI() {
  try {
    console.log('🧪 Testing Home Maintenance API...');
    const response = await fetch('http://localhost:3001/api/maintenance/items');
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:', data);
      console.log(`📊 Found ${data.length} items`);
    } else {
      console.error('❌ API Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('❌ Connection Error:', error.message);
  }
}

testAPI();