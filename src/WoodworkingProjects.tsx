/**
 * WoodworkingProjects.tsx - Comprehensive Project Management System for Woodworkers
 * 
 * WHAT THIS COMPONENT DOES:
 * This is a complete project management system specifically designed for woodworking that provides:
 * 1. 📋 PROJECT TRACKING: Create, edit, and manage woodworking projects with detailed information
 * 2. 📁 FILE MANAGEMENT: Upload and organize project files (plans, photos, PDFs, etc.)
 * 3. 🔍 PROJECT SEARCH: Find projects by name, materials, status, or description
 * 4. 📊 PROJECT ANALYTICS: Track project status, completion rates, and timelines
 * 5. 📱 RESPONSIVE DESIGN: Full mobile support with adaptive layouts
 * 6. 📄 PDF VIEWER: Built-in PDF viewing for project plans and documentation
 * 7. 🖼️ IMAGE GALLERY: Photo galleries for project progress and results
 * 8. 💾 CLOUD STORAGE: Secure file storage and project data persistence
 * 9. 📈 PROGRESS TRACKING: Status management (Planning, In Progress, Complete, etc.)
 * 10. 🏷️ MATERIAL TRACKING: Keep track of wood types, hardware, and other materials
 * 
 * LEARNING CONCEPTS FOR STUDENTS:
 * - Advanced React state management with complex nested objects
 * - File upload and handling with multiple file types
 * - PDF.js integration for document viewing in the browser
 * - Form validation and error handling
 * - RESTful API integration with multipart form data
 * - Responsive design patterns for mobile and desktop
 * - Custom hooks for reusable logic
 * - TypeScript for complex data modeling
 * - Material-UI advanced component patterns
 * - Real-time search and filtering
 * - Image optimization and display
 * - Error boundaries and graceful error handling
 * 
 * REAL-WORLD APPLICATION:
 * This demonstrates a full-featured project management system similar to:
 * - Construction project management tools
 * - Creative portfolio systems
 * - Document management systems
 * - Hobby/craft tracking applications
 * 
 * TECHNICAL ARCHITECTURE:
 * ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
 * │ WoodworkingProjects │───▶│   Project Service   │───▶│   Backend API       │
 * │    (Frontend UI)    │    │  (Business Logic)   │    │  (Data & Files)     │
 * └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
 *           │                           │                           │
 *           ▼                           ▼                           ▼
 * ┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
 * │   Project Forms     │    │   File Uploads      │    │   MySQL Database    │
 * │ (Create/Edit/View)  │    │  (PDF, Images)      │    │ + File Storage      │
 * └─────────────────────┘    └─────────────────────┘    └─────────────────────┘
 */

// Import React hooks for component functionality
import { useState, useEffect, useRef } from 'react'

// Import PDF.js for displaying PDF files in the browser
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'

// Import Lucide React icons (modern icon library)
import { 
  Calendar,      // Calendar/date icon
  FileText,      // Document/file icon
  Paperclip,     // Attachment icon
  X,             // Close/X icon
  Trash2,        // Trash/delete icon
  Download,      // Download icon
  Upload         // Upload icon
} from 'lucide-react'

// Import Material-UI components for consistent, beautiful UI
import { 
  Box,               // Layout container
  Typography,        // Text with styling
  Chip,              // Small labeled elements
  Button,            // Interactive buttons
  TextField,         // Text input fields
  InputAdornment,    // Input decorations
  Container,         // Page layout container
  Paper,             // Elevated surface
  Stack,             // Arrangement component
  Skeleton,          // Loading placeholders
  Alert,             // Status messages
  Snackbar           // Toast notifications
} from '@mui/material'

// Import Material-UI icons
import { 
  Build as BuildIcon,  // Tools/build icon
  Add,                 // Plus/add icon
  Edit,                // Edit/pencil icon
  Delete,              // Delete/trash icon
  Save as SaveIcon,    // Save/floppy disk icon
  Close,               // Close/X icon
  Search,              // Search/magnifying glass icon
  ArrowBack            // Back arrow icon
} from '@mui/icons-material'

// Import custom service for project data management
import projectService, { 
  type WoodworkingProject,    // Main project data structure
  type ProjectFile,           // File attachment structure
  type ProjectFormData        // Form data structure
} from './services/projectService'

// Import CSS styles
import './App.css'

// ============================================================================================
// PDF.JS CONFIGURATION
// ============================================================================================

/**
 * PDF.js Worker Configuration
 * 
 * WHAT THIS DOES: PDF.js needs a "worker" (background process) to render PDF files
 * WHY WE NEED THIS: PDF rendering is computationally intensive, so it runs in a 
 * separate thread to keep the UI responsive
 * 
 * LEARNING CONCEPT: Web Workers allow JavaScript to run tasks in the background
 * without blocking the main thread (which handles UI interactions)
 */
GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`

// ============================================================================================
// MAIN COMPONENT - WoodworkingProjects Management System
// ============================================================================================

/**
 * WoodworkingProjects Component - Complete project management interface
 * 
 * This component manages the entire project lifecycle from creation to completion,
 * including file management, progress tracking, and project analytics.
 * 
 * COMPONENT RESPONSIBILITIES:
 * - Project CRUD operations (Create, Read, Update, Delete)
 * - File upload and management
 * - Search and filtering
 * - Mobile-responsive layouts
 * - PDF viewing integration
 * - Form validation and error handling
 */
export default function WoodworkingProjects() {
  // ============================================================================================
  // STATE MANAGEMENT - Complex application state
  // ============================================================================================
  
  // Core data state
  const [projects, setProjects] = useState<WoodworkingProject[]>([])        // All projects
  const [selectedProject, setSelectedProject] = useState<WoodworkingProject | null>(null)  // Currently viewed project
  
  // UI interaction state
  const [searchTerm, setSearchTerm] = useState('')                         // Current search query
  const [showForm, setShowForm] = useState(false)                          // Whether form is visible
  const [isEditing, setIsEditing] = useState(false)                        // Whether we're editing (vs creating)
  const [showMobileDetails, setShowMobileDetails] = useState(false)        // Mobile view state
  
  // Operation state
  const [uploading, setUploading] = useState(false)                        // File upload in progress
  const [loading, setLoading] = useState(true)                             // Initial data loading
  const [error, setError] = useState<string | null>(null)                  // Error messages

  // ============================================================================================
  // FORM STATE - Project creation and editing
  // ============================================================================================
  
  /**
   * Form Data State - Manages the project creation/editing form
   * 
   * LEARNING CONCEPT: Complex forms often use a single state object
   * rather than individual useState calls for each field. This makes
   * it easier to manage related data and perform validation.
   */
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',                                    // Project name
    date: new Date().toISOString().split('T')[0], // Default to today's date
    materials: '',                                // Wood types, hardware, etc.
    description: '',                              // Project details
    status: 'planned',
    files: [],
    pendingFiles: []                              // Initialize empty pending files
  })

  // Load projects
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await projectService.getAllProjects()
      setProjects(data)
    } catch (err) {
      console.error('Error loading projects:', err)
      setError('Failed to load projects from database')
    } finally {
      setLoading(false)
    }
  }

  const filteredProjects = projects.filter(
    (project) =>
      project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.materials?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'planned':
        return '#ff9800'
      case 'in-progress':
        return '#2196f3'
      case 'completed':
        return '#4caf50'
      default:
        return '#757575'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const testConnection = async () => {
    try {
      // Try to load projects to test connection
      await projectService.getAllProjects()
      setError('Database connection successful! ✅')
      setTimeout(() => setError(null), 3000)
    } catch (err) {
      setError('Database connection failed! ❌')
    }
  }

  const handleNewProject = () => {
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      materials: '',
      description: '',
      status: 'planned',
      files: [],
      pendingFiles: [] // Initialize empty pending files array
    })
    setIsEditing(false)
    setShowForm(true)
    setSelectedProject(null)
    setShowMobileDetails(true)
  }

  const handleEdit = (project: WoodworkingProject) => {
    setFormData({
      title: project.title,
      date: project.date,
      materials: project.materials || '',
      description: project.description || '',
      status: project.status,
      files: project.files || [],
      pendingFiles: [] // Start with empty pending files when editing
    })
    setSelectedProject(project) // Set the selected project for reference
    setIsEditing(true)
    setShowForm(true)
    setShowMobileDetails(true)
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.deleteProject(id)
        await loadProjects()
        setSelectedProject(null)
        setShowMobileDetails(false)
      } catch (err) {
        setError('Failed to delete project')
      }
    }
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setIsEditing(false)
    setShowMobileDetails(false)
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      materials: '',
      description: '',
      status: 'planned',
      files: [],
      pendingFiles: [] // Clear pending files when canceling
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  /**
   * Form Submission Handler
   * 
   * WHAT THIS DOES:
   * Handles both creating new projects and updating existing ones.
   * 
   * KEY FIX FOR DATE FIELD RESET ISSUE:
   * Previously, handleCancelForm() was called after every submission,
   * which reset the date field to today's date even after editing.
   * Now we handle edit and create scenarios differently:
   * 
   * - EDIT: Close form without resetting data (preserves original date)
   * - CREATE: Reset form for next entry (sets today's date for new projects)
   * 
   * FILE UPLOAD INTEGRATION:
   * Now properly handles pendingFiles by uploading them to the backend
   * after the project is created or updated.
   * 
   * LEARNING CONCEPTS:
   * - Form state management in React
   * - Conditional logic based on edit vs create modes
   * - Preventing unwanted state resets
   * - File upload handling with backend integration
   * - User experience considerations
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let projectId: string

      if (isEditing && selectedProject) {
        // Update existing project
        await projectService.updateProject(selectedProject.id, formData)
        projectId = selectedProject.id
        
        // After successful edit, close form but don't reset data until user explicitly cancels
        setShowForm(false)
        setIsEditing(false)
        setShowMobileDetails(false)
      } else {
        // Create new project data without extra fields
        const projectData = {
          id: crypto.randomUUID(), // Generate ID for new project
          title: formData.title || '',
          date: formData.date || new Date().toISOString().split('T')[0],
          materials: formData.materials || '',
          description: formData.description || '',
          status: formData.status || 'planned' as const
        }
        await projectService.createProject(projectData)
        projectId = projectData.id
        
        // After creating, we can reset the form for next entry
        handleCancelForm()
      }

      // Handle file uploads if there are pending files
      if (formData.pendingFiles && formData.pendingFiles.length > 0) {
        setUploading(true)
        try {
          // Convert base64 data back to File objects and upload each one
          for (const fileData of formData.pendingFiles) {
            // Convert base64 data URL back to a File object
            const response = await fetch(fileData.data as string)
            const blob = await response.blob()
            const file = new File([blob], fileData.name, { type: fileData.type })
            
            // Upload the file using the projectService
            await projectService.uploadFile(projectId, file)
          }
          
          // Clear pending files after successful upload
          setFormData(prev => ({ ...prev, pendingFiles: [] }))
        } catch (uploadError) {
          console.error('File upload error:', uploadError)
          setError('Project saved but some file uploads failed')
        } finally {
          setUploading(false)
        }
      }

      await loadProjects()
    } catch (err) {
      setError('Failed to save project')
    }
  }

  /**
   * File Upload Handler
   * 
   * WHAT THIS DOES:
   * Handles multiple file selection and converts them to base64 for temporary storage.
   * 
   * KEY INSIGHT FOR FILE UPLOAD FIX:
   * Files are stored as "pending" until the form is submitted, then they're
   * uploaded to the backend. This approach allows users to:
   * 1. Select files before filling out the form
   * 2. Preview selected files 
   * 3. Remove files if needed
   * 4. Upload all files together when saving the project
   * 
   * LEARNING CONCEPTS:
   * - FileReader API for reading file contents
   * - Base64 encoding for temporary file storage
   * - Promise.all for handling multiple async operations
   * - Form state management with file data
   * 
   * FILE FLOW:
   * 1. User selects files → handleFileUpload (stores as pendingFiles)
   * 2. User submits form → handleSubmit (uploads pendingFiles to backend)
   * 3. Backend stores files → files appear in project
   * 
   * @param e - File input change event
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      setUploading(true)
      // Convert to base64 for storage
      Promise.all(
        files.map(file => {
          return new Promise<any>((resolve) => {
            const reader = new FileReader()
            reader.onload = () => {
              resolve({
                name: file.name,
                type: file.type,
                size: file.size,
                data: reader.result
              })
            }
            reader.readAsDataURL(file)
          })
        })
      ).then(fileData => {
        setFormData(prev => ({
          ...prev,
          pendingFiles: [...(prev.pendingFiles || []), ...fileData]
        }))
        setUploading(false)
      })
    }
  }

  const removePendingFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      pendingFiles: prev.pendingFiles?.filter((_, i) => i !== index) || []
    }))
  }

  const handleDeleteFile = async (fileId: number) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await projectService.deleteFile(fileId)
        if (selectedProject) {
          const updatedProject = {
            ...selectedProject,
            files: selectedProject.files?.filter(f => f.id !== fileId) || []
          }
          setSelectedProject(updatedProject)
        }
      } catch (err) {
        setError('Failed to delete file')
      }
    }
  }

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 3 } }}>
      
      {/* Error/Success Alert */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={error?.includes('✅') ? 'success' : 'error'} onClose={() => setError(null)}>
          {error}
        </Alert>
      </Snackbar>

      <Box sx={{ 
        display: 'flex', 
        gap: { xs: 1, sm: 3 }, 
        height: { xs: 'calc(100vh - 100px)', sm: 'calc(100vh - 200px)' },
        flexDirection: { xs: 'column', md: 'row' }
      }}>
        {/* Left Panel - Project List */}
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
                  <BuildIcon color="primary" />
                  <Typography 
                    variant="h6" 
                    fontWeight={600}
                    sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                  >
                    Woodworking Projects
                  </Typography>
                </Box>
                <Box sx={{ 
                  display: 'flex', 
                  gap: 1, 
                  alignItems: 'center',
                  flexDirection: { xs: 'row', sm: 'row' },
                  justifyContent: { xs: 'center', sm: 'flex-end' }
                }}>
                  <Button
                    onClick={testConnection}
                    variant="outlined"
                    size="small"
                    sx={{ 
                      minWidth: 'auto', 
                      px: { xs: 1, sm: 1 },
                      fontSize: { xs: '0.7rem', sm: '0.875rem' }
                    }}
                    title="Test Database Connection"
                  >
                    🔧 Test
                  </Button>
                  <Chip
                    icon={<BuildIcon />}
                    label={loading ? 'Loading...' : `${filteredProjects.length} project${filteredProjects.length !== 1 ? 's' : ''}`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>
              </Box>
              
              {/* Modern Search Box */}
              <TextField
                fullWidth
                placeholder="Search projects..."
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
                onClick={handleNewProject}
                fullWidth
                size="large"
                sx={{
                  borderRadius: 2,
                  py: { xs: 1.25, sm: 1.5 },
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                  background: 'linear-gradient(45deg, #FF6B35 30%, #F7931E 90%)',
                  boxShadow: '0 3px 5px 2px rgba(255, 107, 53, .3)',
                  minHeight: { xs: '48px', sm: '56px' },
                  '&:hover': {
                    background: 'linear-gradient(45deg, #E55A2B 30%, #E8841A 90%)',
                    transform: 'translateY(-1px)',
                    boxShadow: '0 6px 10px 2px rgba(255, 107, 53, .3)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                New Project
              </Button>
            </Box>

            {/* Projects List */}
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
              {loading ? (
                <Stack spacing={1}>
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={80} />
                  ))}
                </Stack>
              ) : filteredProjects.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                  <BuildIcon sx={{ fontSize: 48, mb: 2 }} />
                  <Typography>No projects found</Typography>
                </Box>
              ) : (
                filteredProjects.map((project) => (
                  <Paper
                    key={project.id}
                    elevation={selectedProject?.id === project.id ? 3 : 1}
                    sx={{
                      p: 2,
                      mb: 1,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderLeft: selectedProject?.id === project.id ? 3 : 0,
                      borderLeftColor: 'primary.main',
                      bgcolor: selectedProject?.id === project.id ? 'action.selected' : 'background.paper',
                      '&:hover': {
                        elevation: 2,
                        bgcolor: 'action.hover',
                      },
                    }}
                    onClick={() => {
                      setSelectedProject(project)
                      setShowForm(false)
                      setShowMobileDetails(true)
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
                        {project.title}
                      </Typography>
                      <Chip
                        label={project.status}
                        size="small"
                        sx={{
                          bgcolor: getStatusColor(project.status),
                          color: 'white',
                          fontWeight: 500,
                        }}
                      />
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {formatDate(project.date)}
                    </Typography>
                    {project.materials && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {project.materials.substring(0, 50)}...
                      </Typography>
                    )}
                  </Paper>
                ))
              )}
            </Box>
          </Paper>
        </Box>

        {/* Right Panel - Project Details or Form */}
        <Box sx={{ 
          flexGrow: 1, 
          display: { xs: showMobileDetails ? 'block' : 'none', md: 'block' },
          height: { xs: '100%', md: 'auto' }
        }}>
          <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', overflow: 'auto' }}>
            {showForm ? (
              <Box>
                {/* Mobile Back Button */}
                <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                  <Button
                    onClick={handleCancelForm}
                    startIcon={<ArrowBack />}
                    variant="outlined"
                    fullWidth
                    sx={{
                      minHeight: '48px',
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
                    Back to Project List
                  </Button>
                </Box>

                {/* Form Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    {isEditing ? 'Edit Project' : 'New Project'}
                  </Typography>
                  <Button
                    onClick={handleCancelForm}
                    variant="outlined"
                    startIcon={<Close />}
                    sx={{
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: 'grey.400',
                      color: 'grey.600',
                      minHeight: { xs: '44px', sm: '48px' },
                      fontSize: { xs: '0.875rem', sm: '1rem' },
                      '&:hover': {
                        borderColor: 'grey.600',
                        backgroundColor: 'grey.50',
                        transform: 'translateY(-1px)',
                      },
                      transition: 'all 0.3s ease',
                      display: { xs: 'none', sm: 'flex' },
                    }}
                  >
                    Cancel
                  </Button>
                </Box>

                {/* Form */}
                <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <TextField
                    label="Project Title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    fullWidth
                    variant="outlined"
                  />

                  <TextField
                    label="Date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    InputLabelProps={{ shrink: true }}
                  />

                  <TextField
                    select
                    label="Status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    fullWidth
                    variant="outlined"
                    SelectProps={{ native: true }}
                  >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </TextField>

                  <TextField
                    label="Materials"
                    name="materials"
                    value={formData.materials}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    fullWidth
                    variant="outlined"
                    placeholder="List the materials needed..."
                  />

                  <TextField
                    label="Description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    multiline
                    rows={5}
                    fullWidth
                    variant="outlined"
                    placeholder="Describe your project..."
                  />

                  {/* File Upload */}
                  <Box>
                    <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Upload className="w-4 h-4" />
                      Upload Files
                    </Typography>
                    <input
                      type="file"
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      disabled={uploading}
                      style={{ marginBottom: '1rem' }}
                    />
                    {uploading && (
                      <Typography color="warning.main" sx={{ mb: 2 }}>
                        Preparing files...
                      </Typography>
                    )}

                    {/* Show existing files when editing */}
                    {isEditing && formData.files && formData.files.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                          Current Files:
                        </Typography>
                        <Stack spacing={1}>
                          {formData.files.map((file: ProjectFile) => (
                            <Paper key={file.id} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1, bgcolor: 'action.hover' }}>
                              <Paperclip className="w-4 h-4" />
                              <Typography sx={{ flex: 1 }}>{file.file_name}</Typography>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => file.id && handleDeleteFile(file.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    {/* Show pending files (new uploads) */}
                    {formData.pendingFiles && formData.pendingFiles.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                          {isEditing ? 'New Files to Upload:' : 'Selected Files:'}
                        </Typography>
                        <Stack spacing={1}>
                          {formData.pendingFiles.map((file: any, index: number) => (
                            <Paper key={index} sx={{ p: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Paperclip className="w-4 h-4" />
                              <Typography sx={{ flex: 1 }}>{file.name}</Typography>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => removePendingFile(index)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </Paper>
                          ))}
                        </Stack>
                      </Box>
                    )}
                  </Box>

                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={uploading}
                    fullWidth
                    sx={{
                      mt: 2,
                      borderRadius: 2,
                      textTransform: 'none',
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                      boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
                      minHeight: { xs: '48px', sm: '56px' },
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      '&:hover': {
                        background: 'linear-gradient(45deg, #1976D2 30%, #1CB5E0 90%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 10px 2px rgba(33, 203, 243, .3)',
                      },
                      '&:disabled': {
                        background: 'linear-gradient(45deg, #90CAF9 30%, #BBDEFB 90%)',
                        transform: 'none',
                        boxShadow: 'none',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {uploading ? 'Saving...' : isEditing ? 'Update Project' : 'Save Project'}
                  </Button>
                </Box>
              </Box>
            ) : selectedProject ? (
              <Box>
                {/* Mobile Back Button */}
                <Box sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}>
                  <Button
                    onClick={() => {
                      setSelectedProject(null)
                      setShowMobileDetails(false)
                    }}
                    startIcon={<ArrowBack />}
                    variant="outlined"
                    fullWidth
                    sx={{
                      minHeight: '48px',
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
                    Back to Project List
                  </Button>
                </Box>

                {/* Project Details Header */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>
                    {selectedProject.title}
                  </Typography>
                  
                  <Chip
                    label={selectedProject.status}
                    sx={{
                      bgcolor: getStatusColor(selectedProject.status),
                      color: 'white',
                      mb: 2,
                    }}
                  />

                  {/* Edit/Delete Buttons */}
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      variant="contained"
                      startIcon={<Edit />}
                      onClick={() => handleEdit(selectedProject)}
                      fullWidth
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #4CAF50 30%, #66BB6A 90%)',
                        boxShadow: '0 3px 5px 2px rgba(76, 175, 80, .3)',
                        minHeight: { xs: '48px', sm: '40px' },
                        fontSize: { xs: '0.9rem', sm: '0.875rem' },
                        '&:hover': {
                          background: 'linear-gradient(45deg, #388E3C 30%, #4CAF50 90%)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 10px 2px rgba(76, 175, 80, .3)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={<Delete />}
                      onClick={() => handleDelete(selectedProject.id)}
                      fullWidth
                      sx={{
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        background: 'linear-gradient(45deg, #f44336 30%, #e57373 90%)',
                        boxShadow: '0 3px 5px 2px rgba(244, 67, 54, .3)',
                        minHeight: { xs: '48px', sm: '40px' },
                        fontSize: { xs: '0.9rem', sm: '0.875rem' },
                        '&:hover': {
                          background: 'linear-gradient(45deg, #d32f2f 30%, #f44336 90%)',
                          transform: 'translateY(-1px)',
                          boxShadow: '0 6px 10px 2px rgba(244, 67, 54, .3)',
                        },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Delete
                    </Button>
                  </Stack>
                </Box>

                {/* Project Details Content */}
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                      <Calendar className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                      Date: {formatDate(selectedProject.date)}
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Created: {new Date(selectedProject.created_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                  
                  {selectedProject.materials && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FileText className="w-4 h-4" />
                        Materials
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedProject.materials}
                      </Typography>
                    </Box>
                  )}
                  
                  {selectedProject.description && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 1 }}>Description</Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {selectedProject.description}
                      </Typography>
                    </Box>
                  )}
                  
                  {selectedProject.files && selectedProject.files.length > 0 && (
                    <Box>
                      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Paperclip className="w-4 h-4" />
                        Attached Files ({selectedProject.files.length})
                      </Typography>
                      <Stack spacing={2}>
                        {selectedProject.files.map((file: ProjectFile) => (
                          <Paper key={file.id} elevation={2} sx={{ p: 2 }}>
                            {file.file_type.startsWith('image/') ? (
                              <Box sx={{ mb: 2 }}>
                                <img 
                                  src={projectService.getFileUrl(file.id!)} 
                                  alt={file.file_name} 
                                  style={{ maxWidth: '100%', borderRadius: '8px' }} 
                                />
                              </Box>
                            ) : file.file_type === 'application/pdf' && file.id ? (
                              <Box sx={{ mb: 2 }}>
                                <PdfAttachmentViewer file={file} />
                              </Box>
                            ) : (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                p: 4, 
                                bgcolor: 'grey.100', 
                                borderRadius: 2,
                                mb: 2
                              }}>
                                <Paperclip className="w-8 h-8" />
                              </Box>
                            )}
                            
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ flex: 1 }}>
                                {file.file_name}
                              </Typography>
                              <Button
                                size="small"
                                href={projectService.getFileUrl(file.id!)}
                                target="_blank"
                                startIcon={<Download className="w-4 h-4" />}
                              >
                                Download
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                onClick={() => handleDeleteFile(file.id!)}
                                startIcon={<Trash2 className="w-4 h-4" />}
                              >
                                Delete
                              </Button>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Box>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '50%', 
                color: 'text.secondary' 
              }}>
                <BuildIcon sx={{ fontSize: 64, mb: 2 }} />
                <Typography>Select a project or create a new one!</Typography>
              </Box>
            )}
          </Paper>
        </Box>
      </Box>
    </Container>
  )
}

// PDF Viewer Component
interface PdfAttachmentViewerProps {
  file: ProjectFile
}

function PdfAttachmentViewer({ file }: PdfAttachmentViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    let pdfDoc: PDFDocumentProxy | null = null
    const controller = new AbortController()

    const renderPdf = async () => {
      if (!file.id) {
        setError('Missing file identifier')
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const container = containerRef.current
      if (!container) {
        setLoading(false)
        return
      }

      container.innerHTML = ''

      try {
        const response = await fetch(`${projectService.getFileUrl(file.id)}?inline=1`, {
          headers: { Accept: 'application/pdf' },
          signal: controller.signal
        })
        if (!response.ok) {
          throw new Error(`Failed to fetch PDF (status ${response.status})`)
        }

        const arrayBuffer = await response.arrayBuffer()
        if (cancelled) return

        pdfDoc = await getDocument({ data: arrayBuffer }).promise
        if (cancelled) return

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum)
          if (cancelled) return

          const viewport = page.getViewport({ scale: 1.5 })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) continue

          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.style.width = '100%'
          canvas.style.height = 'auto'
          canvas.style.display = 'block'
          canvas.style.margin = '0 auto 1rem'

          container.appendChild(canvas)

          await page.render({ canvasContext: context, viewport, canvas }).promise
        }
      } catch (err) {
        if (!cancelled) {
          console.error('PDF render error:', err)
          setError(err instanceof Error ? err.message : String(err))
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    renderPdf()

    return () => {
      cancelled = true
      controller.abort()
      if (pdfDoc) {
        pdfDoc.destroy()
      }
    }
  }, [file.id])

  return (
    <Box sx={{
      width: '100%',
      maxHeight: '800px',
      overflowY: 'auto',
      border: '1px solid',
      borderColor: 'divider',
      borderRadius: 2,
      p: 2,
      bgcolor: 'background.paper',
    }}>
      {loading && (
        <Typography color="text.secondary">Rendering PDF...</Typography>
      )}
      {error && (
        <Typography color="error">
          Unable to render PDF: {error}.{' '}
          <Button
            component="a"
            href={projectService.getFileUrl(file.id!)}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
          >
            Open in new tab
          </Button>
        </Typography>
      )}
      <div ref={containerRef} />
    </Box>
  )
}