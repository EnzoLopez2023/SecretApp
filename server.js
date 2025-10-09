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

const PORT = 3001
app.listen(PORT, () => {
  console.log(`🚀 SharePoint API Server running on http://localhost:${PORT}`)
  console.log(`📊 Test the connection: http://localhost:${PORT}/api/test`)
})