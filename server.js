import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use(express.raw({ type: 'application/octet-stream', limit: '50mb' }))

const config = {
  tenantId: '52188f12-db6b-46c6-88ff-08c802f0ed3b',
  clientId: '1acaea12-db9e-42ed-8c64-05c7e21dc7d5',
  clientSecret: 'p6c8Q~MUYN2VlB7m.Zq.BbMkhNZ1kCUWHTg.dblJ',
  siteId: 'nintekconsulting.sharepoint.com,d94c7375-81db-43af-8370-bd494e630d73,8db02a7f-f7df-42ae-970a-14d7f9c1dc4a'
}

let cachedToken = null
let tokenExpiry = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  const tokenEndpoint = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`
  const params = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    scope: 'https://graph.microsoft.com/.default',
    grant_type: 'client_credentials'
  })

  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token error: ${error}`)
  }

  const data = await response.json()
  cachedToken = data.access_token
  tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000
  return cachedToken
}

// Test connection endpoint
app.get('/api/test', async (req, res) => {
  try {
    const token = await getAccessToken()
    res.json({ success: true, message: 'Connected to SharePoint!' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get drive ID
app.get('/api/sharepoint/drive', async (req, res) => {
  try {
    const token = await getAccessToken()
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${config.siteId}/drive`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Upload file
app.put('/api/sharepoint/upload', async (req, res) => {
  try {
    const { driveId, folderPath, fileName, fileData } = req.body
    const token = await getAccessToken()
    
    // Create folder if it doesn't exist
    try {
      await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: folderPath,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'fail'
          })
        }
      )
    } catch (err) {
      // Folder might already exist, ignore error
    }
    
    // Upload file
    const buffer = Buffer.from(fileData, 'base64')
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderPath}/${fileName}:/content`
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream'
      },
      body: buffer
    })
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Download file
app.get('/api/sharepoint/download/:fileId', async (req, res) => {
  try {
    const token = await getAccessToken()
    const { fileId } = req.params
    
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${req.query.driveId}/items/${fileId}/content`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    
    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete file
app.delete('/api/sharepoint/file/:fileId', async (req, res) => {
  try {
    const token = await getAccessToken()
    const { fileId } = req.params
    const { driveId } = req.query
    
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${fileId}`,
      {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      }
    )
    
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Load JSON data
app.get('/api/sharepoint/data/:fileName', async (req, res) => {
  try {
    const token = await getAccessToken()
    const { fileName } = req.params
    const { driveId, folderPath } = req.query
    
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderPath}/${fileName}:/content`,
      { headers: { 'Authorization': `Bearer ${token}` } }
    )
    
    if (response.status === 404) {
      return res.json([]) // Return empty array if file doesn't exist
    }
    
    const data = await response.json()
    res.json(data)
  } catch (error) {
    res.json([]) // Return empty array on error
  }
})

// Save JSON data
app.put('/api/sharepoint/data/:fileName', async (req, res) => {
  try {
    const token = await getAccessToken()
    const { fileName } = req.params
    const { driveId, folderPath, data } = req.body
    
    // Create folder if it doesn't exist
    try {
      await fetch(
        `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: folderPath,
            folder: {},
            '@microsoft.graph.conflictBehavior': 'fail'
          })
        }
      )
    } catch (err) {
      // Folder might already exist, ignore error
    }
    
    const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${folderPath}/${fileName}:/content`
    
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    
    const result = await response.json()
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`🚀 SharePoint API Server running on http://localhost:${PORT}`)
  console.log(`📊 Test the connection: http://localhost:${PORT}/api/test`)
})