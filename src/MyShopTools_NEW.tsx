import { useState, useEffect } from 'react'
import { ArrowLeft, Package, MapPin, DollarSign, Hash, Calendar, ExternalLink, Building, Tag, Plus, Edit2, Trash2, Save, X } from 'lucide-react'

// Define the Tool type based on the expected structure from MySQL database
type Tool = {
  id?: number // MySQL auto-increment ID
  item_id: number
  product_name: string
  company?: string
  sku?: string
  tags?: string
  price: number
  qty?: number
  purchased?: string
  order_number?: number
  barcode?: string
  location?: string
  sub_location?: string
  order_date?: number
  product_detail?: string
  notes?: string
  html_link?: string
  full_url?: string
  base_url?: string
  sku_on_website?: string
  spare2?: string
}

interface MyShopToolsProps {
  onNavigateBack: () => void
}

export default function MyShopTools({ onNavigateBack }: MyShopToolsProps) {
  const [tools, setTools] = useState<Tool[]>([])
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Tool>>({})

  useEffect(() => {
    fetchTools()
  }, [])

  const fetchTools = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:3001/api/inventory')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.statusText}`)
      }
      
      const data = await response.json()
      setTools(data)
      
      if (data.length > 0 && !selectedTool) {
        setSelectedTool(data[0])
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const handleAdd = () => {
    // Get the next available item_id
    const maxItemId = tools.length > 0 ? Math.max(...tools.map(t => t.item_id)) : 0
    
    setEditForm({
      item_id: maxItemId + 1,
      product_name: '',
      company: '',
      sku: '',
      price: 0,
      qty: 0,
      tags: '',
      location: '',
      sub_location: '',
      purchased: '',
      notes: ''
    })
    setIsAdding(true)
    setIsEditing(false)
  }

  const handleEdit = () => {
    if (selectedTool) {
      setEditForm({ ...selectedTool })
      setIsEditing(true)
      setIsAdding(false)
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsAdding(false)
    setEditForm({})
  }

  const handleSave = async () => {
    try {
      if (isAdding) {
        // Create new item
        const response = await fetch('http://localhost:3001/api/inventory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        })

        if (!response.ok) {
          throw new Error('Failed to create item')
        }

        const result = await response.json()
        await fetchTools() // Refresh the list
        
        // Select the newly created item
        const newTool = tools.find(t => t.id === result.id)
        if (newTool) {
          setSelectedTool(newTool)
        }
      } else {
        // Update existing item
        if (!selectedTool?.id) return

        const response = await fetch(`http://localhost:3001/api/inventory/${selectedTool.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        })

        if (!response.ok) {
          throw new Error('Failed to update item')
        }

        await fetchTools() // Refresh the list
        
        // Update selected tool with new data
        const updatedTool = tools.find(t => t.id === selectedTool.id)
        if (updatedTool) {
          setSelectedTool(updatedTool)
        }
      }

      setIsEditing(false)
      setIsAdding(false)
      setEditForm({})
    } catch (err) {
      console.error('Error saving item:', err)
      alert(err instanceof Error ? err.message : 'Failed to save item')
    }
  }

  const handleDelete = async () => {
    if (!selectedTool?.id) return

    if (!confirm(`Are you sure you want to delete "${selectedTool.product_name}"?`)) {
      return
    }

    try {
      const response = await fetch(`http://localhost:3001/api/inventory/${selectedTool.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      await fetchTools() // Refresh the list
      
      // Select first item if available
      if (tools.length > 1) {
        const remainingTools = tools.filter(t => t.id !== selectedTool.id)
        setSelectedTool(remainingTools[0])
      } else {
        setSelectedTool(null)
      }
    } catch (err) {
      console.error('Error deleting item:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }

  const filteredTools = tools.filter(tool =>
    tool.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(tool.sku)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.tags?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const formatDate = (dateNumber: number) => {
    if (!dateNumber || dateNumber === 0) return 'N/A'
    const date = new Date((dateNumber - 25569) * 86400 * 1000)
    return date.toLocaleDateString()
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price)
  }

  return (
    <div className="shop-tools-container">
      {/* Header */}
      <div className="shop-header">
        <button
          onClick={onNavigateBack}
          className="back-button"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </button>
        <div className="header-title">
          <Package className="w-6 h-6" />
          <h1>My Shop Tools</h1>
        </div>
        <div className="tools-count">
          {loading ? 'Loading...' : `${filteredTools.length} tools`}
        </div>
      </div>

      {error && (
        <div className="error-message" style={{ padding: '1rem', margin: '1rem', background: '#fee', color: '#c00', borderRadius: '0.5rem' }}>
          Error: {error}
        </div>
      )}

      <div className="shop-content">
        {/* Left Panel - Tool List */}
        <div className="tools-list-panel">
          <div className="search-section">
            <input
              type="text"
              placeholder="Search tools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button
              onClick={handleAdd}
              className="add-button"
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '0.5rem',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                fontWeight: '500'
              }}
            >
              <Plus className="w-4 h-4" />
              Add New Tool
            </button>
          </div>
          
          <div className="tools-list">
            {filteredTools.map((tool) => (
              <div
                key={tool.item_id}
                className={`tool-item ${selectedTool?.item_id === tool.item_id ? 'selected' : ''}`}
                onClick={() => setSelectedTool(tool)}
              >
                <div className="tool-name">{tool.product_name}</div>
                <div className="tool-meta">
                  <span className="tool-company">{tool.company}</span>
                  <span className="tool-price">{formatPrice(tool.price)}</span>
                </div>
                <div className="tool-sku">SKU: {tool.sku}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Tool Details or Edit Form */}
        <div className="tool-details-panel">
          {selectedTool ? (
            <div className="tool-details">
              {/* Action Buttons */}
              {!isEditing && !isAdding && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button
                    onClick={handleEdit}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: '500'
                    }}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    style={{
                      flex: 1,
                      padding: '0.5rem',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      fontWeight: '500'
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              )}

              {/* Edit/Add Form */}
              {(isEditing || isAdding) ? (
                <div className="edit-form">
                  <h2 style={{ marginBottom: '1rem' }}>
                    {isAdding ? 'Add New Tool' : 'Edit Tool'}
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                        Product Name *
                      </label>
                      <input
                        type="text"
                        value={editForm.product_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem'
                        }}
                        required
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                          Company
                        </label>
                        <input
                          type="text"
                          value={editForm.company || ''}
                          onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                          SKU
                        </label>
                        <input
                          type="text"
                          value={editForm.sku || ''}
                          onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                          Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={editForm.price || 0}
                          onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={editForm.qty || 0}
                          onChange={(e) => setEditForm({ ...editForm, qty: parseInt(e.target.value) || 0 })}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem'
                          }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                          Location
                        </label>
                        <input
                          type="text"
                          value={editForm.location || ''}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                          Sub Location
                        </label>
                        <input
                          type="text"
                          value={editForm.sub_location || ''}
                          onChange={(e) => setEditForm({ ...editForm, sub_location: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '0.5rem',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.375rem'
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                        Tags
                      </label>
                      <input
                        type="text"
                        value={editForm.tags || ''}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                        placeholder="Comma-separated tags"
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                        Purchased From
                      </label>
                      <input
                        type="text"
                        value={editForm.purchased || ''}
                        onChange={(e) => setEditForm({ ...editForm, purchased: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                        Barcode
                      </label>
                      <input
                        type="text"
                        value={editForm.barcode || ''}
                        onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                        Website Link
                      </label>
                      <input
                        type="url"
                        value={editForm.html_link || ''}
                        onChange={(e) => setEditForm({ ...editForm, html_link: e.target.value })}
                        placeholder="https://..."
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: '500' }}>
                        Notes
                      </label>
                      <textarea
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        rows={3}
                        style={{
                          width: '100%',
                          padding: '0.5rem',
                          border: '1px solid #d1d5db',
                          borderRadius: '0.375rem',
                          resize: 'vertical'
                        }}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button
                        onClick={handleSave}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontWeight: '500',
                          fontSize: '1rem'
                        }}
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                      <button
                        onClick={handleCancel}
                        style={{
                          flex: 1,
                          padding: '0.75rem',
                          background: '#6b7280',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontWeight: '500',
                          fontSize: '1rem'
                        }}
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <>
                  <div className="details-header">
                    <h2>{selectedTool.product_name}</h2>
                    <div className="item-id">ID: {selectedTool.item_id}</div>
                  </div>

                  <div className="details-grid">
                    <div className="detail-section">
                      <div className="section-title">
                        <Building className="w-4 h-4" />
                        Company Information
                      </div>
                      <div className="detail-item">
                        <span className="label">Company:</span>
                        <span className="value">{selectedTool.company || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Purchased From:</span>
                        <span className="value">{selectedTool.purchased || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <div className="section-title">
                        <DollarSign className="w-4 h-4" />
                        Pricing & Inventory
                      </div>
                      <div className="detail-item">
                        <span className="label">Price:</span>
                        <span className="value price">{formatPrice(selectedTool.price)}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Quantity:</span>
                        <span className="value">{selectedTool.qty}</span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <div className="section-title">
                        <Hash className="w-4 h-4" />
                        Product Codes
                      </div>
                      <div className="detail-item">
                        <span className="label">SKU:</span>
                        <span className="value">{selectedTool.sku || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Order Number:</span>
                        <span className="value">{selectedTool.order_number || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Barcode:</span>
                        <span className="value">{selectedTool.barcode || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <div className="section-title">
                        <MapPin className="w-4 h-4" />
                        Location
                      </div>
                      <div className="detail-item">
                        <span className="label">Location:</span>
                        <span className="value">{selectedTool.location || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Sub Location:</span>
                        <span className="value">{selectedTool.sub_location || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <div className="section-title">
                        <Calendar className="w-4 h-4" />
                        Order Information
                      </div>
                      <div className="detail-item">
                        <span className="label">Order Date:</span>
                        <span className="value">{selectedTool.order_date ? formatDate(selectedTool.order_date) : 'N/A'}</span>
                      </div>
                    </div>

                    <div className="detail-section">
                      <div className="section-title">
                        <Tag className="w-4 h-4" />
                        Additional Info
                      </div>
                      <div className="detail-item">
                        <span className="label">Tags:</span>
                        <span className="value">{selectedTool.tags || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Product Detail:</span>
                        <span className="value">{selectedTool.product_detail || 'N/A'}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Notes:</span>
                        <span className="value">{selectedTool.notes || 'N/A'}</span>
                      </div>
                    </div>

                    {selectedTool.html_link && (
                      <div className="detail-section">
                        <div className="section-title">
                          <ExternalLink className="w-4 h-4" />
                          External Links
                        </div>
                        <div className="detail-item">
                          <a
                            href={selectedTool.html_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View on Website
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <Package className="w-12 h-12" />
              <p>Select a tool from the list to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
