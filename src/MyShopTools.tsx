/**
 * MyShopTools.tsx - Woodworking Shop Inventory Management System
 * 
 * WHAT THIS COMPONENT DOES:
 * This is a comprehensive tool management system for a woodworking shop that provides:
 * 1. 🔍 SEARCH & FILTER: Find tools by name, company, SKU, tags, or price range
 * 2. 📋 INVENTORY DISPLAY: View all tools in a card-based grid layout
 * 3. ➕ ADD NEW TOOLS: Create new tool entries with images and details
 * 4. ✏️ EDIT EXISTING: Update tool information and specifications
 * 5. 🗑️ DELETE TOOLS: Remove tools from inventory with confirmation
 * 6. 🖼️ IMAGE MANAGEMENT: Upload and display tool photos
 * 7. 💾 DATABASE SYNC: Real-time synchronization with MySQL backend
 * 8. 📱 RESPONSIVE DESIGN: Works seamlessly on mobile and desktop
 * 
 * LEARNING CONCEPTS FOR STUDENTS:
 * - Advanced React state management with multiple useState hooks
 * - useEffect for side effects (data loading, image uploads)
 * - useMemo for performance optimization (expensive calculations)
 * - useCallback for preventing unnecessary re-renders
 * - Complex form handling with validation
 * - File upload and image processing
 * - RESTful API integration (GET, POST, PUT, DELETE)
 * - Search and filtering algorithms
 * - Modal dialogs and user interactions
 * - Error handling and user feedback
 * - TypeScript interfaces for data modeling
 * - Material-UI advanced component usage
 * 
 * REAL-WORLD APPLICATION:
 * This demonstrates a complete CRUD (Create, Read, Update, Delete) application
 * that could be used by any small business for inventory management.
 * 
 * DATA FLOW ARCHITECTURE:
 * ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
 * │   MyShopTools   │───▶│   MySQL DB      │───▶│  Image Storage  │
 * │   (Frontend)    │    │   (Backend)     │    │   (File System) │
 * └─────────────────┘    └─────────────────┘    └─────────────────┘
 *         │                       │                       │
 *         ▼                       ▼                       ▼
 * ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
 * │ User Interface  │    │ RESTful API     │    │ Image URLs      │
 * │ (Cards, Forms)  │    │ (CRUD Ops)      │    │ (Display)       │
 * └─────────────────┘    └─────────────────┘    └─────────────────┘
 */

// Import React hooks for component functionality
import { useState, useEffect, useMemo, useCallback } from 'react'

// Import Material-UI components for beautiful, consistent UI
import {
  Box,              // Generic container for layout
  Button,           // Clickable action buttons
  Card,             // Container with elevation/shadow
  CardContent,      // Content area inside cards
  Container,        // Responsive layout container
  Dialog,           // Modal popup windows
  DialogContent,    // Content area in dialogs
  DialogActions,    // Button area in dialogs
  IconButton,       // Buttons that display icons
  InputAdornment,   // Icons/text inside input fields
  Paper,            // Surface with Material Design elevation
  TextField,        // Text input fields with labels
  Typography,       // Text display with consistent styling
  Chip,             // Small labeled UI elements
  Skeleton,         // Loading placeholder animation
  Alert,            // Status/notification messages
  Snackbar,         // Toast notifications
  Stack,            // Component for arranging items
} from '@mui/material'

// Import Material-UI icons for visual elements
import {
  ArrowBack,        // Back navigation arrow
  Inventory,        // Inventory/storage icon
  LocationOn,       // Location/place icon
  AttachMoney,      // Money/price icon
  Tag as TagIcon,   // Tag/label icon
  CalendarMonth,    // Calendar/date icon
  Launch,           // External link icon
  Business,         // Company/business icon
  Add,              // Plus/add icon
  Edit,             // Edit/pencil icon
  Delete,           // Trash/delete icon
  Save,             // Save/floppy disk icon
  Close,            // X/close icon
  Image as ImageIcon,    // Image/photo icon
  CloudUpload,      // Upload cloud icon
  Cancel,           // Cancel/X icon
  Search,           // Search/magnifying glass icon
} from '@mui/icons-material'

// ============================================================================================
// TYPESCRIPT INTERFACES - Data structure definitions
// ============================================================================================

/**
 * Tool Interface - Defines the structure of a tool object
 * 
 * WHAT INTERFACES DO: They define the "shape" of data objects, ensuring type safety
 * and providing autocomplete in your IDE. If you try to access a property that
 * doesn't exist, TypeScript will warn you before you even run the code!
 * 
 * DATABASE RELATIONSHIP: This interface matches the MySQL database table structure
 * - id: Auto-increment primary key (optional for new items)
 * - item_id: Legacy identifier from original Excel data
 * - product_name: The name of the tool
 * - company: Manufacturer or brand name
 * - sku: Stock Keeping Unit (product identifier)
 * - tags: Categories or keywords for searching
 * - price: Cost of the tool in dollars
 */
type Tool = {
  id?: number           // MySQL auto-increment ID (optional - generated by database)
  item_id: number       // Legacy item identifier
  product_name: string  // Name of the tool/product
  company?: string      // Manufacturer/brand (optional)
  sku?: string         // Stock Keeping Unit (optional)
  tags?: string        // Categories/keywords (optional)
  price: number        // Cost in dollars
  qty?: number         // Quantity in stock (optional)
  purchased?: string   // Purchase status/info (optional)
  order_number?: number // Order reference number (optional)
  barcode?: string     // Product barcode (optional)
  location?: string    // Storage location (optional)
  sub_location?: string // Specific storage sublocation (optional)
  order_date?: number  // When item was ordered (Excel date format, optional)
  product_detail?: string // Detailed description (optional)
  notes?: string       // Additional notes (optional)
  html_link?: string   // Product webpage link (optional)
  full_url?: string    // Complete product URL (optional)
  base_url?: string    // Base website URL (optional)
  sku_on_website?: string // SKU as it appears on vendor website (optional)
  spare2?: string      // Extra field for future use (optional)
}

/**
 * ToolImage Interface - Defines the structure of tool image metadata
 * 
 * PURPOSE: Tracks uploaded images associated with tools
 * RELATIONSHIP: Each tool can have multiple images (one-to-many relationship)
 */
type ToolImage = {
  id: number              // Unique image ID
  inventory_id: number    // Which tool this image belongs to
  image_name: string      // Original filename
  image_type: string      // File type (jpg, png, etc.)
  image_size: number      // File size in bytes
  uploaded_at: string     // When image was uploaded
}

// ============================================================================================
// MAIN COMPONENT - MyShopTools Inventory Management System
// ============================================================================================

/**
 * MyShopTools Component - Complete inventory management system
 * 
 * This component manages the entire lifecycle of tool inventory:
 * - Loading tools from database
 * - Displaying tools in searchable grid
 * - Adding new tools with image upload
 * - Editing existing tool details
 * - Deleting tools with confirmation
 * - Real-time search and filtering
 * 
 * REACT PATTERNS DEMONSTRATED:
 * - Multiple useState hooks for different types of state
 * - useEffect for data loading and side effects
 * - useMemo for expensive computations (filtering)
 * - useCallback for optimized event handlers
 * - Custom hooks patterns (could be extracted)
 */
export default function MyShopTools() {
  // ============================================================================================
  // STATE MANAGEMENT - Component's memory and data
  // ============================================================================================
  
  // Core data state
  const [tools, setTools] = useState<Tool[]>([])              // Array of all tools
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null)  // Currently selected tool for editing
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('')            // Current search query
  const [loading, setLoading] = useState(true)               // Whether we're loading data
  const [error, setError] = useState<string | null>(null)    // Any error messages
  const [isEditing, setIsEditing] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editForm, setEditForm] = useState<Partial<Tool>>({})
  const [showMobileDetails, setShowMobileDetails] = useState(false)
  const [images, setImages] = useState<ToolImage[]>([])
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([])
  const [viewingImage, setViewingImage] = useState<number | null>(null)

  const apiBaseUrl = useMemo(() => {
    const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
    if (configuredBase) {
      return configuredBase
    }
    const devBase = 'http://localhost:3001/api'
    const prodBase = `${window.location.origin}/api`
    return import.meta.env.DEV ? devBase : prodBase
  }, [])

  const fetchTools = useCallback(async (): Promise<Tool[]> => {
    try {
      setLoading(true)
      const response = await fetch(`${apiBaseUrl}/inventory`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch inventory: ${response.statusText}`)
      }
      
      const data: Tool[] = await response.json()
      setTools(data)
      
      setError(null)
      return data
    } catch (err) {
      console.error('Error fetching inventory:', err)
      setError(err instanceof Error ? err.message : 'Failed to load inventory')
      return []
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchTools()
  }, [fetchTools])

  const fetchImages = useCallback(async (inventoryId: number) => {
    try {
      const response = await fetch(`${apiBaseUrl}/inventory/${inventoryId}/images`)
      if (!response.ok) {
        throw new Error('Failed to fetch images')
      }
      const data: ToolImage[] = await response.json()
      setImages(data)
    } catch (err) {
      console.error('Error fetching images:', err)
      setImages([])
    }
  }, [apiBaseUrl])

  useEffect(() => {
    if (selectedTool?.id) {
      fetchImages(selectedTool.id)
    } else {
      setImages([])
    }
  }, [selectedTool, fetchImages])

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const newImages = Array.from(files).filter(file => file.type.startsWith('image/'))
      setSelectedImages(prev => [...prev, ...newImages])
    }
  }

  const handleRemoveSelectedImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleMarkImageForDeletion = (imageId: number) => {
    setImagesToDelete(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId) 
        : [...prev, imageId]
    )
  }

  const uploadImages = async (inventoryId: number) => {
    for (const file of selectedImages) {
      try {
        const reader = new FileReader()
        const imageData = await new Promise<string>((resolve, reject) => {
          reader.onload = () => {
            const base64 = (reader.result as string).split(',')[1]
            resolve(base64)
          }
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        const response = await fetch(`${apiBaseUrl}/inventory/${inventoryId}/images`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageName: file.name,
            imageData,
            imageType: file.type
          })
        })

        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`)
        }
      } catch (err) {
        console.error('Error uploading image:', err)
        alert(`Failed to upload ${file.name}`)
      }
    }
  }

  const deleteMarkedImages = async () => {
    for (const imageId of imagesToDelete) {
      try {
        const response = await fetch(`${apiBaseUrl}/inventory/images/${imageId}`, {
          method: 'DELETE'
        })

        if (!response.ok) {
          throw new Error(`Failed to delete image ${imageId}`)
        }
      } catch (err) {
        console.error('Error deleting image:', err)
        alert(`Failed to delete image ${imageId}`)
      }
    }
  }

  const handleAdd = () => {
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
    setShowMobileDetails(true)
  }

  const handleEdit = () => {
    if (selectedTool) {
      setEditForm({ ...selectedTool })
      setIsEditing(true)
      setIsAdding(false)
      setSelectedImages([])
      setImagesToDelete([])
    }
  }

  const handleCancel = () => {
    setIsEditing(false)
    setIsAdding(false)
    setEditForm({})
    setShowMobileDetails(false)
    setSelectedImages([])
    setImagesToDelete([])
  }

  const handleSave = async () => {
    try {
      let inventoryId: number | undefined

      if (isAdding) {
        const response = await fetch(`${apiBaseUrl}/inventory`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        })

        if (!response.ok) {
          throw new Error('Failed to create item')
        }

        const result = await response.json()
        inventoryId = result.id
        
        const refreshedTools = await fetchTools()
        const newTool = refreshedTools.find((t) => t.id === result.id)
        if (newTool) {
          setSelectedTool(newTool)
        }
      } else {
        if (!selectedTool?.id) return
        inventoryId = selectedTool.id

        const response = await fetch(`${apiBaseUrl}/inventory/${selectedTool.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        })

        if (!response.ok) {
          throw new Error('Failed to update item')
        }

        if (imagesToDelete.length > 0) {
          await deleteMarkedImages()
        }

        const refreshedTools = await fetchTools()
        const updatedTool = refreshedTools.find((t) => t.id === selectedTool.id)
        if (updatedTool) {
          setSelectedTool(updatedTool)
        }
      }

      if (selectedImages.length > 0 && inventoryId) {
        await uploadImages(inventoryId)
      }

      if (inventoryId) {
        await fetchImages(inventoryId)
      }

      setIsEditing(false)
      setIsAdding(false)
      setEditForm({})
      setSelectedImages([])
      setImagesToDelete([])
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
      const response = await fetch(`${apiBaseUrl}/inventory/${selectedTool.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete item')
      }

      const refreshedTools = await fetchTools()
      if (refreshedTools.length > 0) {
        setSelectedTool(refreshedTools[0])
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
    <Container maxWidth="xl" sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 3 } }}>

      {/* Error Alert */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 1, sm: 3 }, 
        height: { xs: 'calc(100vh - 100px)', sm: 'calc(100vh - 200px)' },
        flexDirection: { xs: 'column', md: 'row' }
      }}>
        {/* Left Panel - Tool List */}
        <Box sx={{ 
          width: { xs: '100%', md: '400px' }, 
          flexShrink: 0, 
          display: { xs: showMobileDetails ? 'none' : 'block', md: 'block' },
          height: { xs: '100%', md: 'auto' }
        }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header with Count */}
            <Box sx={{ mb: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between', 
                mb: { xs: 1, sm: 2 },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 0 }
              }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Inventory color="primary" />
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                  >
                    My Shop Tools
                  </Typography>
                </Box>
                <Chip
                  icon={<Inventory />}
                  label={loading ? 'Loading...' : `${filteredTools.length} tools`}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </Box>
              
              {/* Modern Search Box */}
              <TextField
                fullWidth
                placeholder="Search tools, companies, SKUs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
                variant="outlined"
                size="medium"
                sx={{
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    backgroundColor: 'background.default',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    '&.Mui-focused': {
                      backgroundColor: 'background.paper',
                    },
                  },
                }}
              />
              
              {/* Modern Add Button */}
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAdd}
                fullWidth
                size="large"
                sx={{
                  borderRadius: 2,
                  py: { xs: 1.25, sm: 1.5 },
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                  boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                  minHeight: { xs: '48px', sm: '56px' }, // Touch-friendly height
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 10px 2px rgba(33, 203, 243, .3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Add New Tool
              </Button>
            </Box>

            {/* Tools List */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {loading ? (
                <Stack spacing={1}>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={80} />
                  ))}
                </Stack>
              ) : (
                <Stack spacing={1}>
                  {filteredTools.map((tool) => (
                    <Card
                      key={tool.item_id}
                      sx={{
                        cursor: 'pointer',
                        border: selectedTool?.item_id === tool.item_id ? 2 : 1,
                        borderColor: selectedTool?.item_id === tool.item_id ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                      onClick={() => {
                        setSelectedTool(tool)
                        setShowMobileDetails(true)
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
                          {tool.product_name}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {tool.company}
                          </Typography>
                          <Chip
                            label={formatPrice(tool.price)}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        </Stack>
                        {tool.sku && (
                          <Typography variant="caption" color="text.secondary">
                            SKU: {tool.sku}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              )}
            </Box>
          </Paper>
        </Box>

        {/* Right Panel - Tool Details or Edit Form */}
        <Box sx={{ 
          flexGrow: 1, 
          display: { xs: showMobileDetails ? 'block' : 'none', md: 'block' },
          height: { xs: '100%', md: 'auto' }
        }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', overflow: 'auto' }}>
            {selectedTool || isAdding ? (
              <Box>
                {/* Mobile Back Button */}
                <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                  <Button
                    onClick={() => {
                      setSelectedTool(null)
                      setIsEditing(false)
                      setIsAdding(false)
                      setShowMobileDetails(false)
                    }}
                    startIcon={<ArrowBack />}
                    variant="outlined"
                    fullWidth
                    sx={{
                      minHeight: '48px', // Touch-friendly height
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      borderColor: 'primary.main',
                      color: 'primary.main',
                      '&:hover': {
                        backgroundColor: 'primary.50',
                        borderColor: 'primary.dark',
                      },
                    }}
                  >
                    Back to Tool List
                  </Button>
                </Box>

                {/* Action Buttons */}
                {!isEditing && !isAdding && (
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                    <Button
                      onClick={handleEdit}
                      startIcon={<Edit />}
                      variant="contained"
                      color="primary"
                      fullWidth
                      size="large"
                      sx={{
                        borderRadius: 2,
                        py: { xs: 1.25, sm: 1.5 },
                        textTransform: 'none',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #4CAF50 30%, #8BC34A 90%)',
                        boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                        minHeight: { xs: '48px', sm: '56px' }, // Touch-friendly height
                        '&:hover': {
                          background: 'linear-gradient(45deg, #388E3C 30%, #689F38 90%)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 10px 2px rgba(76, 175, 80, .3)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      onClick={handleDelete}
                      startIcon={<Delete />}
                      variant="contained"
                      color="error"
                      fullWidth
                      size="large"
                      sx={{
                        borderRadius: 2,
                        py: { xs: 1.25, sm: 1.5 },
                        textTransform: 'none',
                        fontSize: { xs: '0.9rem', sm: '1rem' },
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #f44336 30%, #ff7961 90%)',
                        boxShadow: '0 3px 5px 2px rgba(244, 67, 54, .3)',
                        minHeight: { xs: '48px', sm: '56px' }, // Touch-friendly height
                        '&:hover': {
                          background: 'linear-gradient(45deg, #d32f2f 30%, #f57c00 90%)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 10px 2px rgba(244, 67, 54, .3)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Delete
                    </Button>
                  </Stack>
                )}

                {/* Edit/Add Form */}
                {(isEditing || isAdding) ? (
                  <Box>
                    <Typography variant="h5" sx={{ mb: 3 }}>
                      {isAdding ? 'Add New Tool' : 'Edit Tool'}
                    </Typography>
                    
                    <Stack spacing={3}>
                      <TextField
                        label="Product Name"
                        value={editForm.product_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, product_name: e.target.value })}
                        fullWidth
                        required
                      />

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          label="Company"
                          value={editForm.company || ''}
                          onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                          fullWidth
                        />
                        <TextField
                          label="SKU"
                          value={editForm.sku || ''}
                          onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                          fullWidth
                        />
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          label="Price"
                          type="number"
                          inputProps={{ step: 0.01 }}
                          value={editForm.price || 0}
                          onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) || 0 })}
                          fullWidth
                        />
                        <TextField
                          label="Quantity"
                          type="number"
                          value={editForm.qty || 0}
                          onChange={(e) => setEditForm({ ...editForm, qty: parseInt(e.target.value) || 0 })}
                          fullWidth
                        />
                      </Stack>

                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                          label="Location"
                          value={editForm.location || ''}
                          onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                          fullWidth
                        />
                        <TextField
                          label="Sub Location"
                          value={editForm.sub_location || ''}
                          onChange={(e) => setEditForm({ ...editForm, sub_location: e.target.value })}
                          fullWidth
                        />
                      </Stack>

                      <TextField
                        label="Tags"
                        value={editForm.tags || ''}
                        onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                        placeholder="Comma-separated tags"
                        fullWidth
                      />

                      <TextField
                        label="Purchased From"
                        value={editForm.purchased || ''}
                        onChange={(e) => setEditForm({ ...editForm, purchased: e.target.value })}
                        fullWidth
                      />

                      <TextField
                        label="Barcode"
                        value={editForm.barcode || ''}
                        onChange={(e) => setEditForm({ ...editForm, barcode: e.target.value })}
                        fullWidth
                      />

                      <TextField
                        label="Website Link"
                        type="url"
                        value={editForm.html_link || ''}
                        onChange={(e) => setEditForm({ ...editForm, html_link: e.target.value })}
                        placeholder="https://..."
                        fullWidth
                      />

                      <TextField
                        label="Notes"
                        value={editForm.notes || ''}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                        multiline
                        rows={3}
                        fullWidth
                      />

                      {/* Images Section */}
                      <Box>
                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                          <ImageIcon />
                          Images
                        </Typography>

                        {/* Existing Images (Edit Mode) */}
                        {!isAdding && images.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              Current Images (click to mark for deletion):
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 2 }}>
                              {images.map((img) => (
                                <Box
                                  key={img.id}
                                  onClick={() => handleMarkImageForDeletion(img.id)}
                                  sx={{
                                    position: 'relative',
                                    cursor: 'pointer',
                                    border: imagesToDelete.includes(img.id) ? 2 : 1,
                                    borderColor: imagesToDelete.includes(img.id) ? 'error.main' : 'divider',
                                    borderRadius: 1,
                                    p: 0.5,
                                    bgcolor: imagesToDelete.includes(img.id) ? 'error.light' : 'background.paper',
                                    opacity: imagesToDelete.includes(img.id) ? 0.5 : 1,
                                    transition: 'all 0.2s'
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={`${apiBaseUrl}/inventory/images/${img.id}`}
                                    alt={img.image_name}
                                    sx={{
                                      width: '100%',
                                      height: 100,
                                      objectFit: 'cover',
                                      borderRadius: 0.5
                                    }}
                                  />
                                  {imagesToDelete.includes(img.id) && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        color: 'error.main'
                                      }}
                                    >
                                      <Cancel sx={{ fontSize: 32 }} />
                                    </Box>
                                  )}
                                  <Typography variant="caption" noWrap sx={{ display: 'block', mt: 0.5 }}>
                                    {img.image_name}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* New Images to Upload */}
                        {selectedImages.length > 0 && (
                          <Box sx={{ mb: 3 }}>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              New Images to Upload:
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 2 }}>
                              {selectedImages.map((file, index) => (
                                <Box
                                  key={index}
                                  sx={{
                                    position: 'relative',
                                    border: 2,
                                    borderColor: 'success.main',
                                    borderRadius: 1,
                                    p: 0.5,
                                    bgcolor: 'success.light'
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    sx={{
                                      width: '100%',
                                      height: 100,
                                      objectFit: 'cover',
                                      borderRadius: 0.5
                                    }}
                                  />
                                  <IconButton
                                    onClick={() => handleRemoveSelectedImage(index)}
                                    size="small"
                                    sx={{
                                      position: 'absolute',
                                      top: 4,
                                      right: 4,
                                      bgcolor: 'error.main',
                                      color: 'white',
                                      '&:hover': { bgcolor: 'error.dark' }
                                    }}
                                  >
                                    <Close fontSize="small" />
                                  </IconButton>
                                  <Typography variant="caption" noWrap sx={{ display: 'block', mt: 0.5 }}>
                                    {file.name}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* Upload Button */}
                        <input
                          type="file"
                          id="image-upload"
                          multiple
                          accept="image/*"
                          onChange={handleImageSelect}
                          style={{ display: 'none' }}
                        />
                        <Button
                          component="label"
                          htmlFor="image-upload"
                          variant="outlined"
                          startIcon={<CloudUpload />}
                          color="primary"
                        >
                          Add Images
                        </Button>
                      </Box>

                      {/* Action Buttons */}
                      <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
                        <Button
                          onClick={handleSave}
                          startIcon={<Save />}
                          variant="contained"
                          color="success"
                          size="large"
                          fullWidth
                        >
                          Save
                        </Button>
                        <Button
                          onClick={handleCancel}
                          startIcon={<Close />}
                          variant="outlined"
                          color="inherit"
                          size="large"
                          fullWidth
                        >
                          Cancel
                        </Button>
                      </Stack>
                    </Stack>
                  </Box>
                ) : selectedTool ? (
                  /* View Mode */
                  <Box>
                    <Typography variant="h4" gutterBottom>
                      {selectedTool.product_name}
                    </Typography>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      ID: {selectedTool.item_id}
                    </Typography>

                    <Stack spacing={4} sx={{ mt: 3 }}>
                      {/* Company Information */}
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Business />
                            Company Information
                          </Typography>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Company:</Typography>
                              <Typography variant="body1">{selectedTool.company || 'N/A'}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Purchased From:</Typography>
                              <Typography variant="body1">{selectedTool.purchased || 'N/A'}</Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* Pricing & Inventory */}
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <AttachMoney />
                            Pricing & Inventory
                          </Typography>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Price:</Typography>
                              <Typography variant="h6" color="primary">{formatPrice(selectedTool.price)}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Quantity:</Typography>
                              <Typography variant="body1">{selectedTool.qty}</Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* Product Codes */}
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <TagIcon />
                            Product Codes
                          </Typography>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">SKU:</Typography>
                              <Typography variant="body1">{selectedTool.sku || 'N/A'}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Order Number:</Typography>
                              <Typography variant="body1">{selectedTool.order_number || 'N/A'}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Barcode:</Typography>
                              <Typography variant="body1">{selectedTool.barcode || 'N/A'}</Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* Location */}
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <LocationOn />
                            Location
                          </Typography>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Location:</Typography>
                              <Typography variant="body1">{selectedTool.location || 'N/A'}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Sub Location:</Typography>
                              <Typography variant="body1">{selectedTool.sub_location || 'N/A'}</Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* Order Information */}
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <CalendarMonth />
                            Order Information
                          </Typography>
                          <Box>
                            <Typography variant="body2" color="text.secondary">Order Date:</Typography>
                            <Typography variant="body1">{selectedTool.order_date ? formatDate(selectedTool.order_date) : 'N/A'}</Typography>
                          </Box>
                        </CardContent>
                      </Card>

                      {/* Additional Info */}
                      <Card>
                        <CardContent>
                          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <TagIcon />
                            Additional Info
                          </Typography>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Tags:</Typography>
                              <Typography variant="body1">{selectedTool.tags || 'N/A'}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Product Detail:</Typography>
                              <Typography variant="body1">{selectedTool.product_detail || 'N/A'}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="body2" color="text.secondary">Notes:</Typography>
                              <Typography variant="body1">{selectedTool.notes || 'N/A'}</Typography>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>

                      {/* External Links */}
                      {selectedTool.html_link && (
                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <Launch />
                              External Links
                            </Typography>
                            <Button
                              href={selectedTool.html_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              startIcon={<Launch />}
                              variant="outlined"
                            >
                              View on Website
                            </Button>
                          </CardContent>
                        </Card>
                      )}

                      {/* Images Section */}
                      {images.length > 0 && (
                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                              <ImageIcon />
                              Images ({images.length})
                            </Typography>
                            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 2 }}>
                              {images.map((img) => (
                                <Box
                                  key={img.id}
                                  onClick={() => setViewingImage(img.id)}
                                  sx={{
                                    cursor: 'pointer',
                                    border: 2,
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    p: 0.5,
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      borderColor: 'primary.main',
                                      transform: 'scale(1.05)'
                                    }
                                  }}
                                >
                                  <Box
                                    component="img"
                                    src={`${apiBaseUrl}/inventory/images/${img.id}`}
                                    alt={img.image_name}
                                    sx={{
                                      width: '100%',
                                      height: 150,
                                      objectFit: 'cover',
                                      borderRadius: 0.5
                                    }}
                                  />
                                  <Typography variant="caption" noWrap sx={{ display: 'block', mt: 0.5 }}>
                                    {img.image_name}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </CardContent>
                        </Card>
                      )}
                    </Stack>
                  </Box>
                ) : null}
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50%', color: 'text.secondary' }}>
                <Inventory sx={{ fontSize: 64, mb: 2 }} />
                <Typography variant="h6">Select a tool from the list to view details</Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>

      {/* Image Modal */}
      <Dialog
        open={viewingImage !== null}
        onClose={() => setViewingImage(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { bgcolor: 'rgba(0, 0, 0, 0.9)' }
        }}
      >
        <DialogActions sx={{ p: 1 }}>
          <IconButton
            onClick={() => setViewingImage(null)}
            sx={{ color: 'white' }}
          >
            <Close />
          </IconButton>
        </DialogActions>
        <DialogContent sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
          {viewingImage && (
            <Box
              component="img"
              src={`${apiBaseUrl}/inventory/images/${viewingImage}`}
              alt="Full size"
              sx={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain'
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Container>
  )
}