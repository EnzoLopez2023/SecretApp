import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import fetch from 'node-fetch'
import https from 'https'

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

// Azure OpenAI configuration (secure backend-only)
const azureOpenAIConfig = {
  endpoint: process.env.AZURE_OPENAI_ENDPOINT || 'https://enzol-mgr7she7-swedencentral.cognitiveservices.azure.com/',
  apiKey: process.env.AZURE_OPENAI_API_KEY || 'CMAJXHUEw8cWYiD6bd6UhnjIqxYLO7FngHwiuIOkpRjcIABZKVBxJQQJ99BJACfhMk5XJ3w3AAAAACOGxNoa',
  apiVersion: process.env.AZURE_OPENAI_API_VERSION || '2024-04-01-preview',
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-5-chat'
}

// Plex configuration (proxied to avoid CORS and certificate issues)
const plexConfig = {
  baseUrl: process.env.PLEX_BASE_URL || 'https://plex.enzolopez.net:32400',
  token: process.env.PLEX_TOKEN || '5kj8hCXerpUCNp5AxH5V',
  librarySection: process.env.PLEX_LIBRARY_SECTION || '9'
}

const plexAgent = new https.Agent({ rejectUnauthorized: false })

// MySQL connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'secretapp',
  password: 'YourSecurePassword123!',
  database: 'woodworking_projects',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

// ============================================
// Azure OpenAI Proxy Endpoint (Secure)
// ============================================

app.post('/api/azure-openai/chat', async (req, res) => {
  try {
    const { messages } = req.body
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' })
    }

    // Construct the Azure OpenAI API URL
    const url = `${azureOpenAIConfig.endpoint}openai/deployments/${azureOpenAIConfig.deployment}/chat/completions?api-version=${azureOpenAIConfig.apiVersion}`
    
    // Make the request to Azure OpenAI
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureOpenAIConfig.apiKey
      },
      body: JSON.stringify({
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000,
        top_p: 0.95,
        frequency_penalty: 0,
        presence_penalty: 0,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Azure OpenAI API error:', response.status, errorText)
      return res.status(response.status).json({ 
        error: 'Azure OpenAI API request failed',
        details: errorText 
      })
    }

    const data = await response.json()
    res.json(data)

  } catch (error) {
    console.error('Azure OpenAI proxy error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ============================================
// Plex Proxy Endpoints
// ============================================

app.get('/api/plex/library', async (req, res) => {
  try {
    const url = `${plexConfig.baseUrl}/library/sections/${plexConfig.librarySection}/all?X-Plex-Token=${plexConfig.token}`

    const plexResponse = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      throw new Error(`Plex library request failed with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex library fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch Plex library' })
  }
})

app.get('/api/plex/image', async (req, res) => {
  try {
    const { path } = req.query

    if (!path || typeof path !== 'string') {
      return res.status(400).json({ error: 'Image path is required' })
    }

    const decodedPath = decodeURIComponent(path)
    let targetUrl = decodedPath

    if (!/^https?:\/\//i.test(decodedPath)) {
      const separator = decodedPath.includes('?') ? '&' : '?'
      const tokenParam = decodedPath.includes('X-Plex-Token') ? '' : `${separator}X-Plex-Token=${plexConfig.token}`
      targetUrl = `${plexConfig.baseUrl}${decodedPath}${tokenParam}`
    }

    const urlObject = new URL(targetUrl)
    if (!urlObject.hostname.endsWith('enzolopez.net')) {
      return res.status(400).json({ error: 'Invalid image host' })
    }

    const plexResponse = await fetch(targetUrl, { agent: plexAgent })

    if (!plexResponse.ok) {
      throw new Error(`Plex image request failed with status ${plexResponse.status}`)
    }

    // Forward useful headers
    const contentType = plexResponse.headers.get('content-type')
    const contentLength = plexResponse.headers.get('content-length')
    const cacheControl = plexResponse.headers.get('cache-control')

    if (contentType) res.setHeader('Content-Type', contentType)
    if (contentLength) res.setHeader('Content-Length', contentLength)
    if (cacheControl) res.setHeader('Cache-Control', cacheControl)

    const buffer = await plexResponse.buffer()
    res.send(buffer)
  } catch (error) {
    console.error('Plex image proxy error:', error)
    res.status(500).json({ error: 'Failed to fetch Plex image' })
  }
})

// ============================================
// Plex Playlist Management Endpoints
// ============================================

// Create a new playlist
app.post('/api/plex/playlists', async (req, res) => {
  try {
    const { title, type = 'video', smart = 0, uri } = req.body
    
    if (!title) {
      return res.status(400).json({ error: 'Playlist title is required' })
    }

    // Build the playlist creation URL
    const createUrl = `${plexConfig.baseUrl}/playlists?X-Plex-Token=${plexConfig.token}`
    
    // Prepare form data for playlist creation
    const formData = new URLSearchParams()
    formData.append('title', title)
    formData.append('type', type)
    formData.append('smart', smart.toString())
    if (uri) {
      formData.append('uri', uri)
    }

    const plexResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData,
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      const errorText = await plexResponse.text()
      console.error('Plex playlist creation failed:', plexResponse.status, errorText)
      throw new Error(`Plex playlist creation failed with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex playlist creation error:', error)
    res.status(500).json({ error: 'Failed to create Plex playlist' })
  }
})

// Add items to a playlist
app.put('/api/plex/playlists/:playlistId/items', async (req, res) => {
  try {
    const { playlistId } = req.params
    const { uri } = req.body
    
    if (!uri) {
      return res.status(400).json({ error: 'URI is required to add items to playlist' })
    }

    const addUrl = `${plexConfig.baseUrl}/playlists/${playlistId}/items?uri=${encodeURIComponent(uri)}&X-Plex-Token=${plexConfig.token}`

    const plexResponse = await fetch(addUrl, {
      method: 'PUT',
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      throw new Error(`Failed to add items to playlist with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex playlist add items error:', error)
    res.status(500).json({ error: 'Failed to add items to Plex playlist' })
  }
})

// Get all playlists
app.get('/api/plex/playlists', async (req, res) => {
  try {
    const url = `${plexConfig.baseUrl}/playlists?X-Plex-Token=${plexConfig.token}`

    const plexResponse = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      throw new Error(`Plex playlists request failed with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex playlists fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch Plex playlists' })
  }
})

// Get playlist items
app.get('/api/plex/playlists/:playlistId/items', async (req, res) => {
  try {
    const { playlistId } = req.params
    const url = `${plexConfig.baseUrl}/playlists/${playlistId}/items?X-Plex-Token=${plexConfig.token}`

    const plexResponse = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      throw new Error(`Plex playlist items request failed with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex playlist items fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch Plex playlist items' })
  }
})

// ============================================
// Plex Collection Management Endpoints
// ============================================

// Create a new collection
app.post('/api/plex/collections', async (req, res) => {
  try {
    const { title, type = 'movie', sectionId, summary, uri } = req.body
    
    if (!title) {
      return res.status(400).json({ error: 'Collection title is required' })
    }
    
    if (!sectionId) {
      return res.status(400).json({ error: 'Section ID is required' })
    }

    // Build the collection creation URL
    const createUrl = `${plexConfig.baseUrl}/library/sections/${sectionId}/collections?X-Plex-Token=${plexConfig.token}`
    
    // Prepare form data for collection creation
    const formData = new URLSearchParams()
    formData.append('title', title)
    formData.append('type', type)
    if (summary) {
      formData.append('summary', summary)
    }
    if (uri) {
      formData.append('uri', uri)
    }

    const plexResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData,
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      const errorText = await plexResponse.text()
      console.error('Plex collection creation failed:', plexResponse.status, errorText)
      throw new Error(`Plex collection creation failed with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex collection creation error:', error)
    res.status(500).json({ error: 'Failed to create Plex collection' })
  }
})

// Add items to a collection
app.put('/api/plex/collections/:collectionId/items', async (req, res) => {
  try {
    const { collectionId } = req.params
    const { uri } = req.body
    
    if (!uri) {
      return res.status(400).json({ error: 'URI is required to add items to collection' })
    }

    const addUrl = `${plexConfig.baseUrl}/library/collections/${collectionId}/items?uri=${encodeURIComponent(uri)}&X-Plex-Token=${plexConfig.token}`

    const plexResponse = await fetch(addUrl, {
      method: 'PUT',
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      throw new Error(`Failed to add items to collection with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex collection add items error:', error)
    res.status(500).json({ error: 'Failed to add items to Plex collection' })
  }
})

// Update collection details
app.put('/api/plex/collections/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params
    const { title, summary } = req.body

    const updateUrl = `${plexConfig.baseUrl}/library/collections/${collectionId}?X-Plex-Token=${plexConfig.token}`
    
    const formData = new URLSearchParams()
    if (title) formData.append('title', title)
    if (summary) formData.append('summary', summary)

    const plexResponse = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: formData,
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      throw new Error(`Failed to update collection with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex collection update error:', error)
    res.status(500).json({ error: 'Failed to update Plex collection' })
  }
})

// Get all collections from a library section
app.get('/api/plex/sections/:sectionId/collections', async (req, res) => {
  try {
    const { sectionId } = req.params
    const url = `${plexConfig.baseUrl}/library/sections/${sectionId}/collections?X-Plex-Token=${plexConfig.token}`

    const plexResponse = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      throw new Error(`Plex collections request failed with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex collections fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch Plex collections' })
  }
})

// Get collection details and items
app.get('/api/plex/collections/:collectionId', async (req, res) => {
  try {
    const { collectionId } = req.params
    const url = `${plexConfig.baseUrl}/library/collections/${collectionId}/children?X-Plex-Token=${plexConfig.token}`

    const plexResponse = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      throw new Error(`Plex collection details request failed with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex collection details fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch Plex collection details' })
  }
})

// ============================================
// Plex Library Information Endpoints
// ============================================

// Get all library sections
app.get('/api/plex/sections', async (req, res) => {
  try {
    const url = `${plexConfig.baseUrl}/library/sections?X-Plex-Token=${plexConfig.token}`

    const plexResponse = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      throw new Error(`Plex sections request failed with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex sections fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch Plex library sections' })
  }
})

// Get specific library section content by key
app.get('/api/plex/sections/:key/all', async (req, res) => {
  try {
    const { key } = req.params
    const url = `${plexConfig.baseUrl}/library/sections/${key}/all?X-Plex-Token=${plexConfig.token}`

    const plexResponse = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      },
      agent: plexAgent
    })

    if (!plexResponse.ok) {
      throw new Error(`Plex library section request failed with status ${plexResponse.status}`)
    }

    const data = await plexResponse.json()
    res.json(data)
  } catch (error) {
    console.error('Plex library section fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch Plex library section content' })
  }
})

// Get library statistics (helper endpoint for chatbot)
// Search for movies in Plex library
app.get('/api/plex/search', async (req, res) => {
  try {
    const { query, type = 'movie' } = req.query

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' })
    }

    // Search across all movie libraries
    const sectionsUrl = `${plexConfig.baseUrl}/library/sections?X-Plex-Token=${plexConfig.token}`
    const sectionsResponse = await fetch(sectionsUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      agent: plexAgent
    })

    if (!sectionsResponse.ok) {
      throw new Error(`Plex sections request failed`)
    }

    const sectionsData = await sectionsResponse.json()
    const movieSections = sectionsData.MediaContainer?.Directory?.filter(section => section.type === type) || []

    let allMovies = []

    // Search in each movie section
    for (const section of movieSections) {
      try {
        const searchUrl = `${plexConfig.baseUrl}/library/sections/${section.key}/search?query=${encodeURIComponent(query)}&X-Plex-Token=${plexConfig.token}`
        const searchResponse = await fetch(searchUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          agent: plexAgent
        })

        if (searchResponse.ok) {
          const searchData = await searchResponse.json()
          const movies = searchData.MediaContainer?.Metadata || []
          
          const processedMovies = movies.map(movie => ({
            title: movie.title,
            year: movie.year,
            key: movie.key,
            guid: movie.guid,
            ratingKey: movie.ratingKey,
            section: section.title
          }))
          
          allMovies.push(...processedMovies)
        }
      } catch (err) {
        console.error(`Error searching in section ${section.key}:`, err)
      }
    }

    res.json({ movies: allMovies })
  } catch (error) {
    console.error('Plex search error:', error)
    res.status(500).json({ error: 'Failed to search Plex library' })
  }
})

app.get('/api/plex/stats', async (req, res) => {
  try {
    // Get all sections
    const sectionsUrl = `${plexConfig.baseUrl}/library/sections?X-Plex-Token=${plexConfig.token}`
    const sectionsResponse = await fetch(sectionsUrl, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      agent: plexAgent
    })

    if (!sectionsResponse.ok) {
      throw new Error(`Plex sections request failed`)
    }

    const sectionsData = await sectionsResponse.json()
    const sections = sectionsData.MediaContainer?.Directory || []

    // Build stats for each section
    const stats = await Promise.all(
      sections.map(async (section) => {
        try {
          const contentUrl = `${plexConfig.baseUrl}/library/sections/${section.key}/all?X-Plex-Token=${plexConfig.token}`
          const contentResponse = await fetch(contentUrl, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            agent: plexAgent
          })

          if (contentResponse.ok) {
            const contentData = await contentResponse.json()
            return {
              key: section.key,
              title: section.title,
              type: section.type,
              count: contentData.MediaContainer?.size || 0,
              uuid: section.uuid
            }
          }
          return {
            key: section.key,
            title: section.title,
            type: section.type,
            count: 0,
            uuid: section.uuid
          }
        } catch (err) {
          console.error(`Error fetching stats for section ${section.key}:`, err)
          return {
            key: section.key,
            title: section.title,
            type: section.type,
            count: 0,
            error: 'Failed to fetch count'
          }
        }
      })
    )

    res.json({ libraries: stats })
  } catch (error) {
    console.error('Plex stats fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch Plex library statistics' })
  }
})

// ============================================
// Movie Details from External API (OMDb)
// ============================================

app.get('/api/movie/details', async (req, res) => {
  try {
    const { title, year } = req.query

    if (!title) {
      return res.status(400).json({ error: 'Movie title is required' })
    }

    // OMDb API key - you may want to use environment variable for this
    const omdbApiKey = process.env.OMDB_API_KEY || 'b8d33d3c' // Free tier key, replace with your own

    let omdbUrl = `http://www.omdbapi.com/?apikey=${omdbApiKey}&t=${encodeURIComponent(title)}&plot=full`
    if (year) {
      omdbUrl += `&y=${year}`
    }

    console.log(`🎬 Fetching movie details for: "${title}"${year ? ` (${year})` : ''}`)

    const omdbResponse = await fetch(omdbUrl)
    
    if (!omdbResponse.ok) {
      throw new Error(`OMDb API request failed with status ${omdbResponse.status}`)
    }

    const movieData = await omdbResponse.json()

    if (movieData.Error) {
      return res.status(404).json({ error: `Movie not found: ${movieData.Error}` })
    }

    // Transform OMDb response to our format
    const movieDetails = {
      title: movieData.Title,
      year: movieData.Year,
      rated: movieData.Rated,
      released: movieData.Released,
      runtime: movieData.Runtime,
      genre: movieData.Genre,
      director: movieData.Director,
      writer: movieData.Writer,
      actors: movieData.Actors,
      plot: movieData.Plot,
      language: movieData.Language,
      country: movieData.Country,
      awards: movieData.Awards,
      poster: movieData.Poster,
      imdbRating: movieData.imdbRating,
      imdbVotes: movieData.imdbVotes,
      boxOffice: movieData.BoxOffice,
      production: movieData.Production
    }

    console.log(`✅ Successfully fetched details for: "${movieDetails.title}" (${movieDetails.year})`)
    res.json(movieDetails)

  } catch (error) {
    console.error('Movie details fetch error:', error)
    res.status(500).json({ error: 'Failed to fetch movie details from external source' })
  }
})

// ============================================
// Conversation Management Endpoints
// ============================================

// Get all conversations (for dropdown list)
app.get('/api/conversations', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT id, title, created_at, updated_at, message_count, last_message_preview
      FROM conversations 
      ORDER BY updated_at DESC
    `)
    res.json({ conversations: rows })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    res.status(500).json({ error: 'Failed to fetch conversations' })
  }
})

// Get a specific conversation with all its messages
app.get('/api/conversations/:id', async (req, res) => {
  try {
    const conversationId = req.params.id
    
    // Get conversation metadata
    const [conversationRows] = await pool.query(`
      SELECT id, title, created_at, updated_at, message_count
      FROM conversations 
      WHERE id = ?
    `, [conversationId])
    
    if (conversationRows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' })
    }
    
    // Get all messages for this conversation
    const [messageRows] = await pool.query(`
      SELECT message_id, type, content, timestamp
      FROM conversation_messages 
      WHERE conversation_id = ?
      ORDER BY timestamp ASC
    `, [conversationId])
    
    const conversation = conversationRows[0]
    const messages = messageRows.map(msg => ({
      id: msg.message_id,
      type: msg.type,
      content: msg.content,
      timestamp: new Date(msg.timestamp)
    }))
    
    res.json({ 
      conversation: {
        id: conversation.id,
        title: conversation.title,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        message_count: conversation.message_count
      },
      messages 
    })
  } catch (error) {
    console.error('Error fetching conversation:', error)
    res.status(500).json({ error: 'Failed to fetch conversation' })
  }
})

// Create a new conversation
app.post('/api/conversations', async (req, res) => {
  try {
    const { title } = req.body
    const conversationTitle = title || `Conversation ${new Date().toLocaleString()}`
    
    const [result] = await pool.query(`
      INSERT INTO conversations (title, message_count) 
      VALUES (?, 0)
    `, [conversationTitle])
    
    const conversationId = result.insertId
    
    res.json({ 
      conversation: {
        id: conversationId,
        title: conversationTitle,
        created_at: new Date(),
        updated_at: new Date(),
        message_count: 0
      }
    })
  } catch (error) {
    console.error('Error creating conversation:', error)
    res.status(500).json({ error: 'Failed to create conversation' })
  }
})

// Save/Update conversation messages
app.post('/api/conversations/:id/messages', async (req, res) => {
  try {
    const conversationId = req.params.id
    const { messages } = req.body
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required' })
    }
    
    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()
    
    try {
      // Clear existing messages for this conversation
      await connection.query('DELETE FROM conversation_messages WHERE conversation_id = ?', [conversationId])
      
      // Insert all messages
      for (const message of messages) {
        // Convert timestamp to MySQL format
        const mysqlTimestamp = new Date(message.timestamp).toISOString().slice(0, 19).replace('T', ' ')
        await connection.query(`
          INSERT INTO conversation_messages (conversation_id, message_id, type, content, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `, [conversationId, message.id, message.type, message.content, mysqlTimestamp])
      }
      
      // Update conversation metadata
      const lastMessage = messages[messages.length - 1]
      const preview = lastMessage.content.substring(0, 100) + (lastMessage.content.length > 100 ? '...' : '')
      
      await connection.query(`
        UPDATE conversations 
        SET message_count = ?, last_message_preview = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [messages.length, preview, conversationId])
      
      await connection.commit()
      res.json({ success: true, message: 'Conversation saved successfully' })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error saving conversation messages:', error)
    res.status(500).json({ error: 'Failed to save conversation' })
  }
})

// Add a single message to a conversation
app.post('/api/conversations/:id/message', async (req, res) => {
  try {
    const conversationId = req.params.id
    const { message } = req.body
    
    console.log('Received message request:', { conversationId, message })
    
    if (!message || !message.id || !message.type || !message.content) {
      console.log('Invalid message object:', message)
      return res.status(400).json({ error: 'Valid message object is required' })
    }
    
    // Start transaction
    const connection = await pool.getConnection()
    await connection.beginTransaction()
    
    try {
      // Insert the message (convert timestamp to MySQL format)
      const mysqlTimestamp = new Date(message.timestamp).toISOString().slice(0, 19).replace('T', ' ')
      await connection.query(`
        INSERT INTO conversation_messages (conversation_id, message_id, type, content, timestamp)
        VALUES (?, ?, ?, ?, ?)
      `, [conversationId, message.id, message.type, message.content, mysqlTimestamp])
      
      // Update conversation metadata
      const [messageCount] = await connection.query(
        'SELECT COUNT(*) as count FROM conversation_messages WHERE conversation_id = ?',
        [conversationId]
      )
      
      const preview = message.content.substring(0, 100) + (message.content.length > 100 ? '...' : '')
      
      await connection.query(`
        UPDATE conversations 
        SET message_count = ?, last_message_preview = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [messageCount[0].count, preview, conversationId])
      
      await connection.commit()
      res.json({ success: true, message: 'Message added successfully' })
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  } catch (error) {
    console.error('Error adding message:', error)
    console.error('Error details:', error.message)
    console.error('Stack trace:', error.stack)
    res.status(500).json({ error: 'Failed to add message' })
  }
})

// Delete a conversation
app.delete('/api/conversations/:id', async (req, res) => {
  try {
    const conversationId = req.params.id
    
    const [result] = await pool.query('DELETE FROM conversations WHERE id = ?', [conversationId])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Conversation not found' })
    }
    
    res.json({ success: true, message: 'Conversation deleted successfully' })
  } catch (error) {
    console.error('Error deleting conversation:', error)
    res.status(500).json({ error: 'Failed to delete conversation' })
  }
})

// Test database connection endpoint
app.get('/api/test', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 as test')
    res.json({ success: true, message: 'Connected to MySQL database!' })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// Get all projects with their files
app.get('/api/projects', async (req, res) => {
  try {
    const [projects] = await pool.query(
      'SELECT * FROM projects ORDER BY created_at DESC'
    )
    
    // Get files for each project
    for (const project of projects) {
      const [files] = await pool.query(
        'SELECT id, project_id, file_name, file_type, file_size, uploaded_at FROM project_files WHERE project_id = ?',
        [project.id]
      )
      project.files = files
    }
    
    res.json(projects)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Get single project with files
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [[project]] = await pool.query('SELECT * FROM projects WHERE id = ?', [id])
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' })
    }
    
    const [files] = await pool.query(
      'SELECT id, project_id, file_name, file_type, file_size, uploaded_at FROM project_files WHERE project_id = ?',
      [id]
    )
    
    project.files = files
    res.json(project)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Create project
app.post('/api/projects', async (req, res) => {
  try {
    const { id, title, date, materials, description, status } = req.body
    
    await pool.query(
      'INSERT INTO projects (id, title, date, materials, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, title, date, materials, description, status]
    )
    
    res.json({ success: true, id })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Update project
app.put('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, date, materials, description, status } = req.body
    
    console.log(`Updating project ${id}:`, { title, date, materials, description, status })
    
    const [result] = await pool.query(
      'UPDATE projects SET title = ?, date = ?, materials = ?, description = ?, status = ? WHERE id = ?',
      [title, date, materials, description, status, id]
    )
    
    console.log(`Project updated, affected rows: ${result.affectedRows}`)
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: `Project with id ${id} not found` })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Update project error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete project
app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params
    await pool.query('DELETE FROM projects WHERE id = ?', [id])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Upload file
app.post('/api/projects/:id/files', async (req, res) => {
  try {
    const { id } = req.params
    const { fileName, fileData, fileType } = req.body
    
    if (!fileName || !fileData || !fileType) {
      return res.status(400).json({ error: 'Missing required fields: fileName, fileData, fileType' })
    }
    
    const buffer = Buffer.from(fileData, 'base64')
    const fileSize = buffer.length
    
    console.log(`Uploading file: ${fileName}, size: ${fileSize} bytes, type: ${fileType}`)
    
    const [result] = await pool.query(
      'INSERT INTO project_files (project_id, file_name, file_data, file_type, file_size) VALUES (?, ?, ?, ?, ?)',
      [id, fileName, buffer, fileType, fileSize]
    )
    
    res.json({ 
      success: true, 
      fileId: result.insertId,
      fileName,
      fileType,
      fileSize
    })
  } catch (error) {
    console.error('File upload error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Download file
app.get('/api/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params
    const [[file]] = await pool.query(
      'SELECT file_name, file_data, file_type FROM project_files WHERE id = ?',
      [fileId]
    )
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' })
    }
    
    res.setHeader('Content-Type', file.file_type)
    
    // Use 'inline' for PDFs and images so they display in browser
    // Use 'attachment' for other files to force download
    if (file.file_type === 'application/pdf' || file.file_type.startsWith('image/')) {
      res.setHeader('Content-Disposition', `inline; filename="${file.file_name}"`)
    } else {
      res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`)
    }
    
    res.send(file.file_data)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Delete file
app.delete('/api/files/:fileId', async (req, res) => {
  try {
    const { fileId } = req.params
    await pool.query('DELETE FROM project_files WHERE id = ?', [fileId])
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// MyShop Inventory API Endpoints
// ============================================

// Get inventory statistics (must be before /:id route)
app.get('/api/inventory/stats/summary', async (req, res) => {
  try {
    const [[stats]] = await pool.query(`
      SELECT 
        COUNT(*) as total_items,
        COUNT(DISTINCT company) as total_companies,
        SUM(qty) as total_quantity,
        SUM(price * qty) as total_value,
        AVG(price) as avg_price
      FROM myshop_inventory
    `)
    res.json(stats)
  } catch (error) {
    console.error('Get inventory stats error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get inventory item by item_id (must be before /:id route)
app.get('/api/inventory/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params
    const [[item]] = await pool.query('SELECT * FROM myshop_inventory WHERE item_id = ?', [itemId])
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    res.json(item)
  } catch (error) {
    console.error('Get inventory item error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get all inventory items
app.get('/api/inventory', async (req, res) => {
  try {
    const { search } = req.query
    
    let query = 'SELECT * FROM myshop_inventory'
    let params = []
    
    if (search) {
      query += ' WHERE product_name LIKE ? OR company LIKE ? OR sku LIKE ? OR tags LIKE ?'
      const searchTerm = `%${search}%`
      params = [searchTerm, searchTerm, searchTerm, searchTerm]
    }
    
    query += ' ORDER BY item_id ASC'
    
    const [items] = await pool.query(query, params)
    res.json(items)
  } catch (error) {
    console.error('Get inventory error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single inventory item by database ID
app.get('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [[item]] = await pool.query('SELECT * FROM myshop_inventory WHERE id = ?', [id])
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    res.json(item)
  } catch (error) {
    console.error('Get inventory item error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create new inventory item
app.post('/api/inventory', async (req, res) => {
  try {
    const {
      item_id, order_number, order_date, product_name, product_detail,
      company, location, sub_location, tags, sku, price, qty,
      sku_on_website, barcode, notes, purchased, spare2,
      base_url, full_url, html_link
    } = req.body
    
    const [result] = await pool.query(
      `INSERT INTO myshop_inventory (
        item_id, order_number, order_date, product_name, product_detail,
        company, location, sub_location, tags, sku, price, qty,
        sku_on_website, barcode, notes, purchased, spare2,
        base_url, full_url, html_link
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        item_id, order_number, order_date, product_name, product_detail,
        company, location, sub_location, tags, sku, price || 0, qty || 0,
        sku_on_website, barcode, notes, purchased, spare2,
        base_url, full_url, html_link
      ]
    )
    
    res.json({ success: true, id: result.insertId })
  } catch (error) {
    console.error('Create inventory item error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update inventory item
app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      item_id, order_number, order_date, product_name, product_detail,
      company, location, sub_location, tags, sku, price, qty,
      sku_on_website, barcode, notes, purchased, spare2,
      base_url, full_url, html_link
    } = req.body
    
    const [result] = await pool.query(
      `UPDATE myshop_inventory SET
        item_id = ?, order_number = ?, order_date = ?, product_name = ?, product_detail = ?,
        company = ?, location = ?, sub_location = ?, tags = ?, sku = ?, price = ?, qty = ?,
        sku_on_website = ?, barcode = ?, notes = ?, purchased = ?, spare2 = ?,
        base_url = ?, full_url = ?, html_link = ?
      WHERE id = ?`,
      [
        item_id, order_number, order_date, product_name, product_detail,
        company, location, sub_location, tags, sku, price || 0, qty || 0,
        sku_on_website, barcode, notes, purchased, spare2,
        base_url, full_url, html_link, id
      ]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Update inventory item error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete inventory item
app.delete('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await pool.query('DELETE FROM myshop_inventory WHERE id = ?', [id])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Delete inventory item error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// MyShop Images API Endpoints
// ============================================

// Get all images for an inventory item
app.get('/api/inventory/:id/images', async (req, res) => {
  try {
    const { id } = req.params
    const [images] = await pool.query(
      'SELECT id, inventory_id, image_name, image_type, image_size, uploaded_at FROM myshop_images WHERE inventory_id = ? ORDER BY uploaded_at DESC',
      [id]
    )
    res.json(images)
  } catch (error) {
    console.error('Get inventory images error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Upload image for an inventory item
app.post('/api/inventory/:id/images', async (req, res) => {
  try {
    const { id } = req.params
    const { imageName, imageData, imageType } = req.body
    
    if (!imageName || !imageData || !imageType) {
      return res.status(400).json({ error: 'Missing required fields: imageName, imageData, imageType' })
    }
    
    // Verify inventory item exists
    const [[item]] = await pool.query('SELECT id FROM myshop_inventory WHERE id = ?', [id])
    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' })
    }
    
    const buffer = Buffer.from(imageData, 'base64')
    const imageSize = buffer.length
    
    console.log(`Uploading image: ${imageName}, size: ${imageSize} bytes, type: ${imageType}`)
    
    const [result] = await pool.query(
      'INSERT INTO myshop_images (inventory_id, image_name, image_data, image_type, image_size) VALUES (?, ?, ?, ?, ?)',
      [id, imageName, buffer, imageType, imageSize]
    )
    
    res.json({ 
      success: true, 
      imageId: result.insertId,
      imageName,
      imageType,
      imageSize
    })
  } catch (error) {
    console.error('Image upload error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get single image data
app.get('/api/inventory/images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params
    const [[image]] = await pool.query(
      'SELECT image_name, image_data, image_type FROM myshop_images WHERE id = ?',
      [imageId]
    )
    
    if (!image) {
      return res.status(404).json({ error: 'Image not found' })
    }
    
    res.setHeader('Content-Type', image.image_type)
    res.setHeader('Content-Disposition', `inline; filename="${image.image_name}"`)
    res.send(image.image_data)
  } catch (error) {
    console.error('Get image error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete image
app.delete('/api/inventory/images/:imageId', async (req, res) => {
  try {
    const { imageId } = req.params
    const [result] = await pool.query('DELETE FROM myshop_images WHERE id = ?', [imageId])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Image not found' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Delete image error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// HOME MAINTENANCE TRACKER API ENDPOINTS
// ============================================

// Helper function to format dates for MySQL
function formatDateForMySQL(dateString) {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null;
    
    // Format as MySQL DATETIME: YYYY-MM-DD HH:MM:SS
    return date.toISOString().slice(0, 19).replace('T', ' ');
  } catch (error) {
    console.error('Date formatting error:', error);
    return null;
  }
}

// Get all home items with optional filtering
app.get('/api/maintenance/items', async (req, res) => {
  try {
    const { category, location, search } = req.query
    
    let query = 'SELECT * FROM home_items'
    const params = []
    const conditions = []
    
    if (category) {
      conditions.push('category = ?')
      params.push(category)
    }
    
    if (location) {
      conditions.push('location LIKE ?')
      params.push(`%${location}%`)
    }
    
    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ? OR manufacturer LIKE ?)')
      params.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY name ASC'
    
    const [items] = await pool.query(query, params)
    res.json(items)
  } catch (error) {
    console.error('Get items error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get a specific home item by ID
app.get('/api/maintenance/items/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [[item]] = await pool.query('SELECT * FROM home_items WHERE id = ?', [id])
    
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    res.json(item)
  } catch (error) {
    console.error('Get item error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create a new home item
app.post('/api/maintenance/items', async (req, res) => {
  try {
    const {
      name,
      category,
      location,
      description,
      purchase_date,
      installation_date,
      manufacturer,
      model_number,
      serial_number,
      estimated_lifespan_years,
      replacement_cost
    } = req.body
    
    if (!name || !category) {
      return res.status(400).json({ error: 'Name and category are required' })
    }
    
    const [result] = await pool.query(
      `INSERT INTO home_items (
        name, category, location, description, purchase_date, installation_date,
        manufacturer, model_number, serial_number, estimated_lifespan_years, replacement_cost
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, category, location, description, formatDateForMySQL(purchase_date), formatDateForMySQL(installation_date), 
       manufacturer, model_number, serial_number, estimated_lifespan_years, replacement_cost]
    )
    
    const [[newItem]] = await pool.query('SELECT * FROM home_items WHERE id = ?', [result.insertId])
    res.status(201).json(newItem)
  } catch (error) {
    console.error('Create item error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update a home item
app.put('/api/maintenance/items/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      category,
      location,
      description,
      purchase_date,
      installation_date,
      manufacturer,
      model_number,
      serial_number,
      estimated_lifespan_years,
      replacement_cost
    } = req.body
    
    const [result] = await pool.query(
      `UPDATE home_items SET
        name = ?, category = ?, location = ?, description = ?, purchase_date = ?,
        installation_date = ?, manufacturer = ?, model_number = ?, serial_number = ?,
        estimated_lifespan_years = ?, replacement_cost = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [name, category, location, description, purchase_date, installation_date,
       manufacturer, model_number, serial_number, estimated_lifespan_years, replacement_cost, id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    const [[updatedItem]] = await pool.query('SELECT * FROM home_items WHERE id = ?', [id])
    res.json(updatedItem)
  } catch (error) {
    console.error('Update item error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Delete a home item
app.delete('/api/maintenance/items/:id', async (req, res) => {
  try {
    const { id } = req.params
    const [result] = await pool.query('DELETE FROM home_items WHERE id = ?', [id])
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    res.json({ success: true })
  } catch (error) {
    console.error('Delete item error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get maintenance tasks with optional filtering
app.get('/api/maintenance/tasks', async (req, res) => {
  try {
    const { status, priority, item_id, due_soon } = req.query
    
    let query = `
      SELECT t.*, i.name as item_name, i.location as item_location 
      FROM maintenance_tasks t 
      LEFT JOIN home_items i ON t.item_id = i.id
    `
    const params = []
    const conditions = []
    
    if (status) {
      conditions.push('t.status = ?')
      params.push(status)
    }
    
    if (priority) {
      conditions.push('t.priority = ?')
      params.push(priority)
    }
    
    if (item_id) {
      conditions.push('t.item_id = ?')
      params.push(item_id)
    }
    
    if (due_soon === 'true') {
      conditions.push('t.due_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)')
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY t.due_date ASC, t.priority DESC'
    
    const [tasks] = await pool.query(query, params)
    res.json(tasks)
  } catch (error) {
    console.error('Get tasks error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create a new maintenance task
app.post('/api/maintenance/tasks', async (req, res) => {
  try {
    const {
      item_id,
      title,
      description,
      task_type,
      priority,
      scheduled_date,
      due_date,
      estimated_duration_hours,
      recurring_interval_days,
      assigned_to,
      notes
    } = req.body
    
    if (!title || !item_id) {
      return res.status(400).json({ error: 'Title and item_id are required' })
    }
    
    // Calculate next_due_date if recurring
    let next_due_date = null
    if (recurring_interval_days && due_date) {
      const dueDate = new Date(due_date)
      dueDate.setDate(dueDate.getDate() + recurring_interval_days)
      next_due_date = formatDateForMySQL(dueDate.toISOString())
    }
    
    const [result] = await pool.query(
      `INSERT INTO maintenance_tasks (
        item_id, title, description, task_type, priority, scheduled_date, due_date,
        estimated_duration_hours, recurring_interval_days, next_due_date, assigned_to, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_id, title, description, task_type, priority, formatDateForMySQL(scheduled_date), formatDateForMySQL(due_date),
       estimated_duration_hours, recurring_interval_days, next_due_date, assigned_to, notes]
    )
    
    const [[newTask]] = await pool.query(
      'SELECT t.*, i.name as item_name FROM maintenance_tasks t LEFT JOIN home_items i ON t.item_id = i.id WHERE t.id = ?',
      [result.insertId]
    )
    res.status(201).json(newTask)
  } catch (error) {
    console.error('Create task error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update a maintenance task
app.put('/api/maintenance/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params
    const {
      title,
      description,
      task_type,
      priority,
      status,
      scheduled_date,
      due_date,
      completed_date,
      estimated_duration_hours,
      actual_duration_hours,
      recurring_interval_days,
      assigned_to,
      notes
    } = req.body
    
    // Calculate next_due_date if task is completed and recurring
    let next_due_date = null
    if (status === 'Completed' && recurring_interval_days && completed_date) {
      const completedDate = new Date(completed_date)
      completedDate.setDate(completedDate.getDate() + recurring_interval_days)
      next_due_date = formatDateForMySQL(completedDate.toISOString())
    }
    
    const [result] = await pool.query(
      `UPDATE maintenance_tasks SET
        title = ?, description = ?, task_type = ?, priority = ?, status = ?,
        scheduled_date = ?, due_date = ?, completed_date = ?, estimated_duration_hours = ?,
        actual_duration_hours = ?, recurring_interval_days = ?, next_due_date = ?,
        assigned_to = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [title, description, task_type, priority, status, formatDateForMySQL(scheduled_date), formatDateForMySQL(due_date),
       formatDateForMySQL(completed_date), estimated_duration_hours, actual_duration_hours, recurring_interval_days,
       next_due_date, assigned_to, notes, id]
    )
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' })
    }
    
    // If task is completed and recurring, create next occurrence
    if (status === 'Completed' && recurring_interval_days && next_due_date) {
      await pool.query(
        `INSERT INTO maintenance_tasks (
          item_id, title, description, task_type, priority, due_date,
          estimated_duration_hours, recurring_interval_days, assigned_to, notes
        ) SELECT 
          item_id, title, description, task_type, priority, ?,
          estimated_duration_hours, recurring_interval_days, assigned_to, notes
        FROM maintenance_tasks WHERE id = ?`,
        [next_due_date, id]
      )
    }
    
    const [[updatedTask]] = await pool.query(
      'SELECT t.*, i.name as item_name FROM maintenance_tasks t LEFT JOIN home_items i ON t.item_id = i.id WHERE t.id = ?',
      [id]
    )
    res.json(updatedTask)
  } catch (error) {
    console.error('Update task error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get warranties for items
app.get('/api/maintenance/warranties', async (req, res) => {
  try {
    const { item_id, active_only } = req.query
    
    let query = `
      SELECT w.*, i.name as item_name 
      FROM warranties w 
      LEFT JOIN home_items i ON w.item_id = i.id
    `
    const params = []
    const conditions = []
    
    if (item_id) {
      conditions.push('w.item_id = ?')
      params.push(item_id)
    }
    
    if (active_only === 'true') {
      conditions.push('w.is_active = TRUE AND w.end_date >= CURDATE()')
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY w.end_date ASC'
    
    const [warranties] = await pool.query(query, params)
    res.json(warranties)
  } catch (error) {
    console.error('Get warranties error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create a new warranty
app.post('/api/maintenance/warranties', async (req, res) => {
  try {
    const {
      item_id,
      warranty_type,
      provider,
      warranty_number,
      start_date,
      end_date,
      coverage_description,
      claim_process,
      contact_info
    } = req.body
    
    if (!item_id || !warranty_type || !provider) {
      return res.status(400).json({ error: 'Item ID, warranty type, and provider are required' })
    }
    
    const [result] = await pool.query(
      `INSERT INTO warranties (
        item_id, warranty_type, provider, warranty_number, start_date, end_date,
        coverage_description, claim_process, contact_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_id, warranty_type, provider, warranty_number, start_date, end_date,
       coverage_description, claim_process, contact_info]
    )
    
    const [[newWarranty]] = await pool.query(
      'SELECT w.*, i.name as item_name FROM warranties w LEFT JOIN home_items i ON w.item_id = i.id WHERE w.id = ?',
      [result.insertId]
    )
    res.status(201).json(newWarranty)
  } catch (error) {
    console.error('Create warranty error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get maintenance photos
app.get('/api/maintenance/photos/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params
    const [photos] = await pool.query(
      'SELECT id, item_id, task_id, photo_name, photo_type, photo_size, photo_category, description, taken_date, ai_analyzed, ai_description, ai_tags FROM maintenance_photos WHERE item_id = ? ORDER BY taken_date DESC',
      [item_id]
    )
    res.json(photos)
  } catch (error) {
    console.error('Get photos error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Upload a maintenance photo
app.post('/api/maintenance/photos/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params
    const { photo_name, photo_data, photo_type, photo_category, description, task_id } = req.body
    
    if (!photo_name || !photo_data || !photo_type) {
      return res.status(400).json({ error: 'Photo name, data, and type are required' })
    }
    
    // Verify item exists
    const [[item]] = await pool.query('SELECT id FROM home_items WHERE id = ?', [item_id])
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    // Convert base64 to buffer
    const photoBuffer = Buffer.from(photo_data.replace(/^data:image\/[a-z]+;base64,/, ''), 'base64')
    
    const [result] = await pool.query(
      'INSERT INTO maintenance_photos (item_id, task_id, photo_name, photo_data, photo_type, photo_size, photo_category, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [item_id, task_id || null, photo_name, photoBuffer, photo_type, photoBuffer.length, photo_category || 'General', description]
    )
    
    const [[newPhoto]] = await pool.query(
      'SELECT id, item_id, task_id, photo_name, photo_type, photo_size, photo_category, description, taken_date FROM maintenance_photos WHERE id = ?',
      [result.insertId]
    )
    
    res.status(201).json(newPhoto)
  } catch (error) {
    console.error('Upload photo error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get a specific maintenance photo
app.get('/api/maintenance/photos/image/:photo_id', async (req, res) => {
  try {
    const { photo_id } = req.params
    
    const [[photo]] = await pool.query(
      'SELECT photo_name, photo_data, photo_type FROM maintenance_photos WHERE id = ?',
      [photo_id]
    )
    
    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' })
    }
    
    res.setHeader('Content-Type', photo.photo_type)
    res.setHeader('Content-Disposition', `inline; filename="${photo.photo_name}"`)
    res.send(photo.photo_data)
  } catch (error) {
    console.error('Get photo error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get maintenance costs
app.get('/api/maintenance/costs', async (req, res) => {
  try {
    const { item_id, task_id, year, month } = req.query
    
    let query = `
      SELECT c.*, i.name as item_name, t.title as task_title
      FROM maintenance_costs c 
      LEFT JOIN home_items i ON c.item_id = i.id
      LEFT JOIN maintenance_tasks t ON c.task_id = t.id
    `
    const params = []
    const conditions = []
    
    if (item_id) {
      conditions.push('c.item_id = ?')
      params.push(item_id)
    }
    
    if (task_id) {
      conditions.push('c.task_id = ?')
      params.push(task_id)
    }
    
    if (year) {
      conditions.push('YEAR(c.cost_date) = ?')
      params.push(year)
    }
    
    if (month) {
      conditions.push('MONTH(c.cost_date) = ?')
      params.push(month)
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ')
    }
    
    query += ' ORDER BY c.cost_date DESC'
    
    const [costs] = await pool.query(query, params)
    res.json(costs)
  } catch (error) {
    console.error('Get costs error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Create a new maintenance cost
app.post('/api/maintenance/costs', async (req, res) => {
  try {
    const {
      item_id,
      task_id,
      cost_type,
      description,
      amount,
      vendor,
      cost_date,
      notes,
      tax_amount,
      warranty_covered
    } = req.body
    
    if (!item_id || !cost_type || !description || !amount || !cost_date) {
      return res.status(400).json({ error: 'Item ID, cost type, description, amount, and cost date are required' })
    }
    
    const [result] = await pool.query(
      `INSERT INTO maintenance_costs (
        item_id, task_id, cost_type, description, amount, vendor, cost_date, notes, tax_amount, warranty_covered
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item_id, task_id || null, cost_type, description, amount, vendor, cost_date, notes, tax_amount, warranty_covered || false]
    )
    
    const [[newCost]] = await pool.query(
      'SELECT c.*, i.name as item_name FROM maintenance_costs c LEFT JOIN home_items i ON c.item_id = i.id WHERE c.id = ?',
      [result.insertId]
    )
    res.status(201).json(newCost)
  } catch (error) {
    console.error('Create cost error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get AI insights for maintenance
app.get('/api/maintenance/ai-insights/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params
    const [insights] = await pool.query(
      'SELECT * FROM ai_insights WHERE item_id = ? ORDER BY created_at DESC',
      [item_id]
    )
    res.json(insights)
  } catch (error) {
    console.error('Get AI insights error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Generate AI maintenance suggestions
app.post('/api/maintenance/ai-suggestions/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params
    
    // Get item details
    const [[item]] = await pool.query('SELECT * FROM home_items WHERE id = ?', [item_id])
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }
    
    // Get recent tasks and costs for context
    const [tasks] = await pool.query(
      'SELECT * FROM maintenance_tasks WHERE item_id = ? ORDER BY created_at DESC LIMIT 10',
      [item_id]
    )
    
    const [costs] = await pool.query(
      'SELECT * FROM maintenance_costs WHERE item_id = ? ORDER BY cost_date DESC LIMIT 10',
      [item_id]
    )
    
    // Calculate age of item
    const today = new Date()
    const purchaseDate = item.purchase_date ? new Date(item.purchase_date) : null
    const installDate = item.installation_date ? new Date(item.installation_date) : null
    const itemAge = purchaseDate ? Math.floor((today - purchaseDate) / (365.25 * 24 * 60 * 60 * 1000)) : null
    
    const messages = [
      {
        role: 'system',
        content: `You are a home maintenance expert AI assistant. Analyze home items and provide maintenance suggestions, cost predictions, and risk assessments. Consider the item's age, category, manufacturer, maintenance history, and cost history.

Provide your response as a JSON array of insights with the following structure:
[
  {
    "insight_type": "Maintenance Suggestion" | "Cost Prediction" | "Risk Assessment" | "Replacement Timing" | "Energy Efficiency" | "Safety Alert",
    "title": "Brief descriptive title",
    "description": "Detailed description and recommendations",
    "confidence_score": 0.0-1.0,
    "priority": "Low" | "Medium" | "High" | "Critical",
    "predicted_date": "YYYY-MM-DD" (if applicable),
    "predicted_cost": number (if applicable)
  }
]

Base your suggestions on industry standards, typical maintenance schedules, and the specific item characteristics provided.`
      },
      {
        role: 'user',
        content: `Analyze this home item and provide maintenance insights:

Item Details:
- Name: ${item.name}
- Category: ${item.category}
- Location: ${item.location}
- Manufacturer: ${item.manufacturer || 'Unknown'}
- Model: ${item.model_number || 'Unknown'}
- Age: ${itemAge ? `${itemAge} years` : 'Unknown'}
- Estimated Lifespan: ${item.estimated_lifespan_years || 'Unknown'} years
- Replacement Cost: $${item.replacement_cost || 'Unknown'}

Recent Maintenance Tasks (${tasks.length} total):
${tasks.map(t => `- ${t.title} (${t.status}) - ${t.task_type} priority ${t.priority}`).join('\n')}

Recent Costs (${costs.length} total):
${costs.map(c => `- $${c.amount} for ${c.description} (${c.cost_type})`).join('\n')}

Provide 2-5 relevant insights focusing on the most important maintenance recommendations, potential issues, and cost optimization opportunities.`
      }
    ]
    
    const response = await fetch(`${azureOpenAIConfig.endpoint}openai/deployments/${azureOpenAIConfig.deployment}/chat/completions?api-version=${azureOpenAIConfig.apiVersion}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureOpenAIConfig.apiKey
      },
      body: JSON.stringify({
        messages,
        max_tokens: 2000,
        temperature: 0.3
      })
    })
    
    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status}`)
    }
    
    const data = await response.json()
    const aiResponse = data.choices[0].message.content
    
    // Parse the JSON response
    let insights
    try {
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/\[[\s\S]*\]/)
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse
      insights = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse)
      throw new Error('Failed to parse AI insights')
    }
    
    // Save insights to database
    const savedInsights = []
    for (const insight of insights) {
      const [result] = await pool.query(
        `INSERT INTO ai_insights (
          item_id, insight_type, title, description, confidence_score, priority, predicted_date, predicted_cost
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item_id,
          insight.insight_type,
          insight.title,
          insight.description,
          insight.confidence_score,
          insight.priority,
          insight.predicted_date || null,
          insight.predicted_cost || null
        ]
      )
      
      const [[savedInsight]] = await pool.query('SELECT * FROM ai_insights WHERE id = ?', [result.insertId])
      savedInsights.push(savedInsight)
    }
    
    res.json(savedInsights)
  } catch (error) {
    console.error('AI suggestions error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Get dashboard statistics
app.get('/api/maintenance/dashboard', async (req, res) => {
  try {
    // Get counts and statistics
    const [[itemCount]] = await pool.query('SELECT COUNT(*) as count FROM home_items')
    const [[taskCount]] = await pool.query('SELECT COUNT(*) as count FROM maintenance_tasks WHERE status != "Completed"')
    const [[overdueCount]] = await pool.query('SELECT COUNT(*) as count FROM maintenance_tasks WHERE due_date < CURDATE() AND status != "Completed"')
    const [[warrantyCount]] = await pool.query('SELECT COUNT(*) as count FROM warranties WHERE is_active = TRUE AND end_date >= CURDATE()')
    
    // Get recent tasks
    const [recentTasks] = await pool.query(
      `SELECT t.*, i.name as item_name 
       FROM maintenance_tasks t 
       LEFT JOIN home_items i ON t.item_id = i.id 
       WHERE t.status != 'Completed' 
       ORDER BY t.due_date ASC 
       LIMIT 5`
    )
    
    // Get cost summary for current year
    const [[yearCosts]] = await pool.query(
      'SELECT COALESCE(SUM(amount), 0) as total FROM maintenance_costs WHERE YEAR(cost_date) = YEAR(CURDATE())'
    )
    
    // Get expiring warranties
    const [expiringWarranties] = await pool.query(
      `SELECT w.*, i.name as item_name 
       FROM warranties w 
       LEFT JOIN home_items i ON w.item_id = i.id 
       WHERE w.is_active = TRUE AND w.end_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 90 DAY)
       ORDER BY w.end_date ASC`
    )
    
    res.json({
      stats: {
        total_items: itemCount.count,
        pending_tasks: taskCount.count,
        overdue_tasks: overdueCount.count,
        active_warranties: warrantyCount.count,
        year_costs: parseFloat(yearCosts.total) || 0
      },
      recent_tasks: recentTasks,
      expiring_warranties: expiringWarranties
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({ error: error.message })
  }
})

// ============================================
// PLAYLIST CREATOR API ENDPOINTS
// ============================================

// Step 1: Search for movie collection using Azure OpenAI
app.post('/api/playlist-creator/search-collection', async (req, res) => {
  try {
    const { query } = req.body
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' })
    }

    const messages = [
      {
        role: 'system',
        content: `You are a movie database expert. When asked about a movie collection or series, provide a comprehensive list of movies in JSON format. 

Format your response as a JSON object with a "movies" array. Each movie should have:
- title: exact movie title
- year: release year as number
- director: director name (if known)

Example format:
{
  "movies": [
    {"title": "Movie Title", "year": 2020, "director": "Director Name"},
    {"title": "Movie Title 2", "year": 2022, "director": "Director Name"}
  ]
}

Be comprehensive and include all movies in the series/collection. For franchises, include all main movies, sequels, prequels, and spin-offs that are part of the same universe or story continuity.`
      },
      {
        role: 'user',
        content: `What are all the movies in the "${query}" collection/series? Please provide a complete list in the specified JSON format.`
      }
    ]

    console.log('🔍 Making Azure OpenAI request for:', query)
    console.log('🔗 Endpoint:', `${azureOpenAIConfig.endpoint}openai/deployments/${azureOpenAIConfig.deployment}/chat/completions?api-version=${azureOpenAIConfig.apiVersion}`)
    
    const response = await fetch(`${azureOpenAIConfig.endpoint}openai/deployments/${azureOpenAIConfig.deployment}/chat/completions?api-version=${azureOpenAIConfig.apiVersion}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': azureOpenAIConfig.apiKey
      },
      body: JSON.stringify({
        messages,
        max_tokens: 2000,
        temperature: 0.1
      })
    })

    console.log('📡 Response status:', response.status)
    console.log('📡 Response headers:', response.headers)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Azure OpenAI API error response:', errorText)
      throw new Error(`Azure OpenAI API error: ${response.status} - ${errorText}`)
    }

    const responseText = await response.text()
    console.log('📄 Raw response:', responseText.substring(0, 500) + '...')
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (jsonError) {
      console.error('❌ Failed to parse JSON response:', responseText)
      throw new Error('Invalid JSON response from Azure OpenAI')
    }

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid response structure:', data)
      throw new Error('Invalid response structure from Azure OpenAI')
    }

    const aiResponse = data.choices[0].message.content

    // Parse the JSON response
    let movieData
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)\s*```/) || aiResponse.match(/\{[\s\S]*\}/)
      const jsonString = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : aiResponse
      movieData = JSON.parse(jsonString)
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse)
      throw new Error('Failed to parse movie data from AI response')
    }

    if (!movieData.movies || !Array.isArray(movieData.movies)) {
      throw new Error('Invalid movie data format from AI')
    }

    res.json(movieData)
  } catch (error) {
    console.error('Movie collection search error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Step 2-4: Process movies with real-time updates via Server-Sent Events
app.post('/api/playlist-creator/process-movies', async (req, res) => {
  try {
    const { movies } = req.body
    
    if (!movies || !Array.isArray(movies)) {
      return res.status(400).json({ error: 'Movies array is required' })
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })

    const sendUpdate = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`)
    }

    const foundMovies = []
    let processedCount = 0

    sendUpdate('log', { message: `🔍 Starting search for ${movies.length} movies...`, logType: 'info' })

    for (const movie of movies) {
      processedCount++
      sendUpdate('log', { message: `[${processedCount}/${movies.length}] Searching for "${movie.title}" (${movie.year})...`, logType: 'info' })

      try {
        // Direct Plex server search (handles XML properly)
        const searchUrl = `${plexConfig.baseUrl}/search?query=${encodeURIComponent(movie.title)}&X-Plex-Token=${plexConfig.token}`
        const searchResponse = await fetch(searchUrl, { 
          agent: plexAgent,
          headers: { 'Accept': 'application/xml' }
        })

        if (!searchResponse.ok) {
          throw new Error(`Plex search request failed: ${searchResponse.status}`)
        }

        const xmlText = await searchResponse.text()
        
        // Parse XML to extract movie information
        const allResults = []
        
        // Simple XML parsing to extract movie data
        const videoMatches = xmlText.match(/<Video[^>]*>/g) || []
        
        for (const videoMatch of videoMatches) {
          // Extract attributes from the Video element
          const titleMatch = videoMatch.match(/title="([^"]*)"/)
          const yearMatch = videoMatch.match(/year="([^"]*)"/)
          const ratingKeyMatch = videoMatch.match(/ratingKey="([^"]*)"/)
          const keyMatch = videoMatch.match(/key="([^"]*)"/)
          const guidMatch = videoMatch.match(/guid="([^"]*)"/)
          const sectionMatch = videoMatch.match(/librarySectionTitle="([^"]*)"/)
          
          if (titleMatch && yearMatch && ratingKeyMatch) {
            allResults.push({
              title: titleMatch[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
              year: parseInt(yearMatch[1]),
              ratingKey: ratingKeyMatch[1],
              key: keyMatch ? keyMatch[1] : '',
              guid: guidMatch ? guidMatch[1] : '',
              section: sectionMatch ? sectionMatch[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Unknown'
            })
          }
        }

        let foundMovie = null

        // Check if we found any results
        if (allResults.length > 0) {
          // Look for exact match in "ALL Movies" section first
          foundMovie = allResults.find(m => {
            const titleMatch = m.title.toLowerCase() === movie.title.toLowerCase()
            const yearMatch = !movie.year || Math.abs(parseInt(m.year) - movie.year) <= 1
            return titleMatch && yearMatch && m.section === 'ALL Movies'
          })

          if (!foundMovie) {
            // If no exact match in "ALL Movies", try any section with matching title and year
            foundMovie = allResults.find(m => {
              const titleMatch = m.title.toLowerCase() === movie.title.toLowerCase()
              const yearMatch = !movie.year || Math.abs(parseInt(m.year) - movie.year) <= 1
              return titleMatch && yearMatch
            })
          }
        }

        // If still no match, try alternative title formats
        if (!foundMovie && movie.title.includes(' 2')) {
          const altTitle = movie.title.replace(' 2', ' II')
          sendUpdate('log', { message: `   Trying alternative title: "${altTitle}"`, logType: 'warning' })
          
          try {
            const altSearchUrl = `${plexConfig.baseUrl}/search?query=${encodeURIComponent(altTitle)}&X-Plex-Token=${plexConfig.token}`
            const altSearchResponse = await fetch(altSearchUrl, { 
              agent: plexAgent,
              headers: { 'Accept': 'application/xml' }
            })

            if (altSearchResponse.ok) {
              const altXmlText = await altSearchResponse.text()
              const altResults = []
              
              const altVideoMatches = altXmlText.match(/<Video[^>]*>/g) || []
              
              for (const videoMatch of altVideoMatches) {
                const titleMatch = videoMatch.match(/title="([^"]*)"/)
                const yearMatch = videoMatch.match(/year="([^"]*)"/)
                const ratingKeyMatch = videoMatch.match(/ratingKey="([^"]*)"/)
                const keyMatch = videoMatch.match(/key="([^"]*)"/)
                const guidMatch = videoMatch.match(/guid="([^"]*)"/)
                const sectionMatch = videoMatch.match(/librarySectionTitle="([^"]*)"/)
                
                if (titleMatch && yearMatch && ratingKeyMatch) {
                  altResults.push({
                    title: titleMatch[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
                    year: parseInt(yearMatch[1]),
                    ratingKey: ratingKeyMatch[1],
                    key: keyMatch ? keyMatch[1] : '',
                    guid: guidMatch ? guidMatch[1] : '',
                    section: sectionMatch ? sectionMatch[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Unknown'
                  })
                }
              }

              if (altResults.length > 0) {
                foundMovie = altResults.find(m => {
                  const titleMatch = m.title.toLowerCase() === altTitle.toLowerCase()
                  const yearMatch = !movie.year || Math.abs(m.year - movie.year) <= 1
                  return titleMatch && yearMatch && m.section === 'ALL Movies'
                })

                if (!foundMovie) {
                  foundMovie = altResults.find(m => {
                    const titleMatch = m.title.toLowerCase() === altTitle.toLowerCase()
                    const yearMatch = !movie.year || Math.abs(m.year - movie.year) <= 1
                    return titleMatch && yearMatch
                  })
                }
              }
            }
          } catch (altError) {
            console.error(`Error searching alternative title:`, altError)
          }
        } else if (!foundMovie && movie.title.includes(' II')) {
          const altTitle = movie.title.replace(' II', ' 2')
          sendUpdate('log', { message: `   Trying alternative title: "${altTitle}"`, logType: 'warning' })
          
          try {
            const altSearchUrl2 = `${plexConfig.baseUrl}/search?query=${encodeURIComponent(altTitle)}&X-Plex-Token=${plexConfig.token}`
            const altSearchResponse2 = await fetch(altSearchUrl2, { 
              agent: plexAgent,
              headers: { 'Accept': 'application/xml' }
            })

            if (altSearchResponse2.ok) {
              const altXmlText2 = await altSearchResponse2.text()
              const altResults2 = []
              
              const altVideoMatches2 = altXmlText2.match(/<Video[^>]*>/g) || []
              
              for (const videoMatch of altVideoMatches2) {
                const titleMatch = videoMatch.match(/title="([^"]*)"/)
                const yearMatch = videoMatch.match(/year="([^"]*)"/)
                const ratingKeyMatch = videoMatch.match(/ratingKey="([^"]*)"/)
                const keyMatch = videoMatch.match(/key="([^"]*)"/)
                const guidMatch = videoMatch.match(/guid="([^"]*)"/)
                const sectionMatch = videoMatch.match(/librarySectionTitle="([^"]*)"/)
                
                if (titleMatch && yearMatch && ratingKeyMatch) {
                  altResults2.push({
                    title: titleMatch[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
                    year: parseInt(yearMatch[1]),
                    ratingKey: ratingKeyMatch[1],
                    key: keyMatch ? keyMatch[1] : '',
                    guid: guidMatch ? guidMatch[1] : '',
                    section: sectionMatch ? sectionMatch[1].replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&') : 'Unknown'
                  })
                }
              }

              if (altResults2.length > 0) {
                foundMovie = altResults2.find(m => {
                  const titleMatch = m.title.toLowerCase() === altTitle.toLowerCase()
                  const yearMatch = !movie.year || Math.abs(m.year - movie.year) <= 1
                  return titleMatch && yearMatch && m.section === 'ALL Movies'
                })

                if (!foundMovie) {
                  foundMovie = altResults2.find(m => {
                    const titleMatch = m.title.toLowerCase() === altTitle.toLowerCase()
                    const yearMatch = !movie.year || Math.abs(m.year - movie.year) <= 1
                    return titleMatch && yearMatch
                  })
                }
              }
            }
          } catch (altError2) {
            console.error(`Error searching second alternative title:`, altError2)
          }
        }

        if (foundMovie) {
          const plexMovie = {
            title: foundMovie.title,
            year: foundMovie.year,
            key: foundMovie.key,
            guid: foundMovie.guid,
            ratingKey: foundMovie.ratingKey,
            section: foundMovie.section || 'Unknown'
          }
          
          foundMovies.push(plexMovie)
          sendUpdate('movie_found', { movie: plexMovie })
          sendUpdate('log', { message: `   ✅ Found: "${foundMovie.title}" (${foundMovie.year}) - Rating Key: ${foundMovie.ratingKey}`, logType: 'success' })
        } else {
          sendUpdate('log', { message: `   ❌ Not found: "${movie.title}" (${movie.year})`, logType: 'error' })
        }

        // Small delay to make the process visible
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        sendUpdate('log', { message: `   ❌ Error searching for "${movie.title}": ${error.message}`, logType: 'error' })
      }
    }

    sendUpdate('complete', { totalFound: foundMovies.length, movies: foundMovies })
    res.end()

  } catch (error) {
    console.error('Process movies error:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
    res.end()
  }
})

// Step 5-7: Create playlist with creative title
app.post('/api/playlist-creator/create-playlist', async (req, res) => {
  try {
    const { movies, originalQuery } = req.body
    
    if (!movies || !Array.isArray(movies) || movies.length === 0) {
      return res.status(400).json({ error: 'Movies array is required and cannot be empty' })
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/plain',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    })

    const sendUpdate = (type, data) => {
      res.write(`data: ${JSON.stringify({ type, ...data })}\n\n`)
    }

    sendUpdate('log', { message: '🎭 Generating creative playlist title...', logType: 'info' })

    // Generate creative title using Azure OpenAI
    const titleMessages = [
      {
        role: 'system',
        content: `You are a creative movie playlist title generator. Create short, catchy, and thematic playlist titles based on the movie collection. The title should be:
- Creative and engaging
- 2-6 words long
- Thematically appropriate to the collection
- Avoid generic words like "Collection" or "Playlist"

Examples:
- For Mission Impossible: "The IMF Files", "Operation: Unthinkable", "Impossible Protocols"
- For Star Wars: "A Galaxy Far Away", "The Force Awakens", "Jedi Chronicles"
- For Marvel: "Heroes Assemble", "Infinity Saga", "Avengers Initiative"

Respond with just the title, no quotes or additional text.`
      },
      {
        role: 'user',
        content: `Create a creative playlist title for this movie collection: "${originalQuery}". The playlist contains ${movies.length} movies including titles like: ${movies.slice(0, 3).map(m => m.title).join(', ')}`
      }
    ]

    let creativeTitle = originalQuery // fallback
    try {
      const titleResponse = await fetch(`${azureOpenAIConfig.endpoint}openai/deployments/${azureOpenAIConfig.deployment}/chat/completions?api-version=${azureOpenAIConfig.apiVersion}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': azureOpenAIConfig.apiKey
        },
        body: JSON.stringify({
          messages: titleMessages,
          max_tokens: 50,
          temperature: 0.8
        })
      })

      if (titleResponse.ok) {
        const titleData = await titleResponse.json()
        creativeTitle = titleData.choices[0].message.content.trim().replace(/['"]/g, '')
        sendUpdate('title_generated', { title: creativeTitle })
      }
    } catch (error) {
      sendUpdate('log', { message: `⚠️ Could not generate creative title, using: "${creativeTitle}"`, logType: 'warning' })
    }

    await new Promise(resolve => setTimeout(resolve, 1000))

    // Create the playlist with the first movie
    sendUpdate('log', { message: `🎬 Creating playlist "${creativeTitle}"...`, logType: 'info' })
    
    const machineId = '89a48331c5badd47712cd5d37cc2442998c416c9'
    const firstMovie = movies[0]
    
    const createUrl = `${plexConfig.baseUrl}/playlists?type=video&title=${encodeURIComponent(creativeTitle)}&smart=0&uri=library://${machineId}/item/library/metadata/${firstMovie.ratingKey}&X-Plex-Token=${plexConfig.token}`
    
    const createResponse = await fetch(createUrl, { 
      method: 'POST',
      agent: plexAgent 
    })
    
    if (!createResponse.ok) {
      const errorText = await createResponse.text()
      console.error('Playlist creation error:', errorText)
      throw new Error(`Failed to create playlist: ${createResponse.status}`)
    }
    
    // Handle XML response for playlist creation
    const createText = await createResponse.text()
    console.log('Playlist creation response:', createText)
    
    let playlistId
    // Try to parse as JSON first
    try {
      const createData = JSON.parse(createText)
      playlistId = createData.MediaContainer.Playlist[0].ratingKey
    } catch (jsonError) {
      // If JSON parsing fails, parse XML
      const playlistMatch = createText.match(/ratingKey="(\d+)"/)
      if (playlistMatch) {
        playlistId = playlistMatch[1]
      } else {
        console.error('Could not extract playlist ID from response:', createText)
        throw new Error('Failed to extract playlist ID from server response')
      }
    }
    
    sendUpdate('playlist_created', { playlistId })
    sendUpdate('log', { message: `✅ Playlist created with ID: ${playlistId}`, logType: 'success' })
    sendUpdate('log', { message: `📁 Added "${firstMovie.title}" as first movie`, logType: 'info' })

    await new Promise(resolve => setTimeout(resolve, 500))

    // Add remaining movies to the playlist
    console.log(`Adding ${movies.length - 1} remaining movies to playlist ${playlistId}`)
    for (let i = 1; i < movies.length; i++) {
      const movie = movies[i]
      sendUpdate('log', { message: `[${i + 1}/${movies.length}] Adding "${movie.title}"...`, logType: 'info' })
      
      try {
        const uriParam = `library://${machineId}/item/library/metadata/${movie.ratingKey}`
        const addUrl = `${plexConfig.baseUrl}/playlists/${playlistId}/items?uri=${encodeURIComponent(uriParam)}&X-Plex-Token=${plexConfig.token}`
        
        console.log(`Adding movie ${i + 1}: ${movie.title} with ratingKey ${movie.ratingKey}`)
        console.log(`Add URL: ${addUrl}`)
        
        const addResponse = await fetch(addUrl, { 
          method: 'PUT',
          headers: { 'Accept': 'application/json' },
          agent: plexAgent 
        })
        
        const addResponseText = await addResponse.text()
        console.log(`Add response for ${movie.title}:`, addResponse.status, addResponseText)
        
        if (addResponse.ok) {
          sendUpdate('log', { message: `   ✅ Added "${movie.title}"`, logType: 'success' })
        } else {
          sendUpdate('log', { message: `   ❌ Failed to add "${movie.title}" (${addResponse.status})`, logType: 'error' })
          console.error(`Failed to add ${movie.title}: ${addResponse.status} - ${addResponseText}`)
        }
      } catch (error) {
        console.error(`Error adding ${movie.title}:`, error)
        sendUpdate('log', { message: `   ❌ Error adding "${movie.title}": ${error.message}`, logType: 'error' })
      }
      
      await new Promise(resolve => setTimeout(resolve, 300))
    }

    // Verify the playlist
    sendUpdate('log', { message: '🔍 Verifying playlist contents...', logType: 'info' })
    
    try {
      const verifyUrl = `${plexConfig.baseUrl}/playlists/${playlistId}/items?X-Plex-Token=${plexConfig.token}`
      const verifyResponse = await fetch(verifyUrl, { agent: plexAgent })
      
      if (verifyResponse.ok) {
        const verifyText = await verifyResponse.text()
        console.log('Playlist verification response:', verifyText)
        
        let itemCount = 0
        
        // Try to parse as JSON first, fall back to XML parsing
        try {
          const verifyData = JSON.parse(verifyText)
          itemCount = verifyData.MediaContainer?.size || 0
        } catch (jsonError) {
          // Parse XML response
          if (verifyText.includes('<MediaContainer')) {
            const sizeMatch = verifyText.match(/size="(\d+)"/)
            itemCount = sizeMatch ? parseInt(sizeMatch[1]) : 0
          }
        }
        
        sendUpdate('log', { message: `✅ Verification complete: ${itemCount} items in playlist`, logType: 'success' })
      }
    } catch (error) {
      console.error('Playlist verification error:', error)
      sendUpdate('log', { message: `⚠️ Could not verify playlist: ${error.message}`, logType: 'warning' })
    }

    sendUpdate('complete', { 
      playlistId, 
      title: creativeTitle, 
      movieCount: movies.length 
    })
    res.end()

  } catch (error) {
    console.error('Create playlist error:', error)
    res.write(`data: ${JSON.stringify({ type: 'error', message: error.message })}\n\n`)
    res.end()
  }
})

const PORT = 3001
app.listen(PORT, () => {
  console.log(`🚀 SecretApp Backend Server running on http://localhost:${PORT}`)
  console.log(``)
  console.log(`� Available Services:`)
  console.log(`   🤖 Azure OpenAI Chat: /api/azure-openai/chat`)
  console.log(`   🎬 Plex Media Proxy: /api/plex/*`)
  console.log(`   💬 Conversation Management: /api/conversations/*`)
  console.log(`   🛠️ Workshop Inventory: /api/myshop/*`)
  console.log(`   📄 SharePoint Integration: /api/sharepoint/*`)
  console.log(`   🖼️ Image Management: /api/images/*`)
  console.log(`   🎭 Playlist Creator: /api/playlist-creator/*`)
  console.log(`   🏠 Home Maintenance: /api/maintenance/*`)
  console.log(``)
  console.log(`🔧 Test endpoints:`)
  console.log(`   📊 Health Check: http://localhost:${PORT}/api/test`)
  console.log(`   🎭 Plex Library: http://localhost:${PORT}/api/plex/library`)
  console.log(``)
  console.log(`✅ Backend ready for SecretApp frontend!`)
})