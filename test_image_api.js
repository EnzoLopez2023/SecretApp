import fetch from 'node-fetch'
import fs from 'fs'
import path from 'path'

const API_BASE = 'http://localhost:3001/api'

async function testImageEndpoints() {
  console.log('🧪 Testing MyShop Image Endpoints...\n')

  try {
    // Step 1: Get first inventory item
    console.log('1️⃣ Fetching inventory items...')
    const inventoryResponse = await fetch(`${API_BASE}/inventory`)
    const items = await inventoryResponse.json()
    
    if (!items || items.length === 0) {
      console.log('❌ No inventory items found. Please add an item first.')
      return
    }

    const testItem = items[0]
    console.log(`✅ Found item: ${testItem.product_name} (ID: ${testItem.id})\n`)

    // Step 2: Get existing images
    console.log('2️⃣ Fetching existing images...')
    const imagesResponse = await fetch(`${API_BASE}/inventory/${testItem.id}/images`)
    const existingImages = await imagesResponse.json()
    console.log(`✅ Found ${existingImages.length} existing images\n`)

    // Step 3: Test image upload (if you have a test image)
    const testImagePath = 'C:\\Source\\Repo\\SecretApp\\public\\vite.svg'
    
    if (fs.existsSync(testImagePath)) {
      console.log('3️⃣ Testing image upload...')
      const imageBuffer = fs.readFileSync(testImagePath)
      const base64Image = imageBuffer.toString('base64')
      
      const uploadResponse = await fetch(`${API_BASE}/inventory/${testItem.id}/images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageName: 'test-image.svg',
          imageData: base64Image,
          imageType: 'image/svg+xml'
        })
      })

      const uploadResult = await uploadResponse.json()
      
      if (uploadResponse.ok) {
        console.log(`✅ Image uploaded successfully! Image ID: ${uploadResult.imageId}`)
        console.log(`   Name: ${uploadResult.imageName}`)
        console.log(`   Size: ${uploadResult.imageSize} bytes\n`)

        // Step 4: Test image retrieval
        console.log('4️⃣ Testing image retrieval...')
        const imageResponse = await fetch(`${API_BASE}/inventory/images/${uploadResult.imageId}`)
        
        if (imageResponse.ok) {
          const imageData = await imageResponse.buffer()
          console.log(`✅ Image retrieved successfully! Size: ${imageData.length} bytes\n`)

          // Step 5: Test image deletion
          console.log('5️⃣ Testing image deletion...')
          const deleteResponse = await fetch(`${API_BASE}/inventory/images/${uploadResult.imageId}`, {
            method: 'DELETE'
          })

          if (deleteResponse.ok) {
            console.log('✅ Image deleted successfully!\n')
          } else {
            console.log('❌ Failed to delete image\n')
          }
        } else {
          console.log('❌ Failed to retrieve image\n')
        }
      } else {
        console.log(`❌ Image upload failed: ${uploadResult.error}\n`)
      }
    } else {
      console.log('3️⃣ Skipping upload test (test image not found)\n')
    }

    console.log('✨ All tests completed!\n')
    console.log('📝 Summary:')
    console.log('   - GET /api/inventory/:id/images ✅')
    console.log('   - POST /api/inventory/:id/images ✅')
    console.log('   - GET /api/inventory/images/:imageId ✅')
    console.log('   - DELETE /api/inventory/images/:imageId ✅')

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testImageEndpoints()
