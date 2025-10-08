import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'

const app = express()
app.use(cors())
app.use(express.json({ limit: '50mb' }))

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
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`)
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

const PORT = 3001
app.listen(PORT, () => {
  console.log(`🚀 SharePoint API Server running on http://localhost:${PORT}`)
  console.log(`📊 Test the connection: http://localhost:${PORT}/api/test`)
})