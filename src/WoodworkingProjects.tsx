import { useState, useEffect } from 'react'
import { ArrowLeft, Hammer, Plus, Calendar, FileText, Paperclip, Save, X, Edit2, Trash2, Download, Upload, Cloud } from 'lucide-react'
import SharePointService from './utils/sharepointService'
import './App.css'

type WoodworkingProject = {
  id: string
  title: string
  date: string
  materials: string
  description?: string
  status?: 'planned' | 'in-progress' | 'completed'
  files?: { name: string; url: string; type: string; sharePointId?: string }[]
  createdAt: string
  updatedAt: string
}

interface WoodworkingProjectsProps {
  onNavigateBack: () => void
}

// Configure SharePoint - UPDATE THESE VALUES
const sharePointConfig = {
  tenantId: import.meta.env.VITE_SHAREPOINT_TENANT_ID,
  clientId: import.meta.env.VITE_SHAREPOINT_CLIENT_ID,
  clientSecret: import.meta.env.VITE_SHAREPOINT_CLIENT_SECRET,
  siteId: import.meta.env.VITE_SHAREPOINT_SITE_ID,
  folderPath: 'Projects'
}

const sharePointService = new SharePointService(sharePointConfig)

export default function WoodworkingProjects({ onNavigateBack }: WoodworkingProjectsProps) {
  const [projects, setProjects] = useState<WoodworkingProject[]>([])
  const [selectedProject, setSelectedProject] = useState<WoodworkingProject | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<Partial<WoodworkingProject>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    materials: '',
    description: '',
    status: 'planned',
    files: []
  })

  // Load projects from SharePoint
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await sharePointService.loadProjectsData()
      setProjects(data as WoodworkingProject[])
      
      if (data.length > 0) {
        setSelectedProject(data[0] as WoodworkingProject)
      }
    } catch (err) {
      console.error('Error loading projects:', err)
      setError('Failed to load projects from SharePoint')
      
      // Fallback to localStorage
      const savedProjects = localStorage.getItem('woodworkingProjects')
      if (savedProjects) {
        const parsedProjects = JSON.parse(savedProjects)
        setProjects(parsedProjects)
        if (parsedProjects.length > 0) {
          setSelectedProject(parsedProjects[0])
        }
      }
    } finally {
      setLoading(false)
    }
  }

  // Save projects to SharePoint
  const saveProjects = async (updatedProjects: WoodworkingProject[]) => {
    try {
      setSyncing(true)
      await sharePointService.saveProjectsData(updatedProjects)
      setProjects(updatedProjects)
      
      // Also save to localStorage as backup
      localStorage.setItem('woodworkingProjects', JSON.stringify(updatedProjects))
    } catch (err) {
      console.error('Error saving projects:', err)
      alert('Failed to sync with SharePoint. Saved locally instead.')
      
      // Save to localStorage as fallback
      localStorage.setItem('woodworkingProjects', JSON.stringify(updatedProjects))
      setProjects(updatedProjects)
    } finally {
      setSyncing(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Generate unique filename
        const timestamp = Date.now()
        const fileName = `${timestamp}_${file.name}`
        
        const uploadedFile = await sharePointService.uploadFile(file, fileName)
        return uploadedFile
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      
      setFormData(prev => ({
        ...prev,
        files: [...(prev.files || []), ...uploadedFiles]
      }))

      alert(`Successfully uploaded ${uploadedFiles.length} file(s) to SharePoint`)
    } catch (err) {
      console.error('Error uploading files:', err)
      alert('Failed to upload files to SharePoint')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = async (index: number) => {
    const file = formData.files?.[index]
    
    // If file has SharePoint ID, try to delete it from SharePoint
    if (file?.sharePointId) {
      try {
        await sharePointService.deleteFile(file.sharePointId)
      } catch (err) {
        console.error('Error deleting file from SharePoint:', err)
      }
    }
    
    setFormData(prev => ({
      ...prev,
      files: prev.files?.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title?.trim()) {
      alert('Please enter a project title')
      return
    }

    const now = new Date().toISOString()

    if (isEditing && selectedProject) {
      // Update existing project
      const updatedProjects = projects.map(p => 
        p.id === selectedProject.id 
          ? { ...p, ...formData, updatedAt: now } as WoodworkingProject
          : p
      )
      await saveProjects(updatedProjects)
      setSelectedProject({ ...selectedProject, ...formData, updatedAt: now } as WoodworkingProject)
    } else {
      // Create new project
      const newProject: WoodworkingProject = {
        id: Date.now().toString(),
        title: formData.title || '',
        date: formData.date || new Date().toISOString().split('T')[0],
        materials: formData.materials || '',
        description: formData.description,
        status: formData.status || 'planned',
        files: formData.files || [],
        createdAt: now,
        updatedAt: now
      }
      
      const updatedProjects = [newProject, ...projects]
      await saveProjects(updatedProjects)
      setSelectedProject(newProject)
    }

    // Reset form
    setShowForm(false)
    setIsEditing(false)
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      materials: '',
      description: '',
      status: 'planned',
      files: []
    })
  }

  const handleEdit = (project: WoodworkingProject) => {
    setFormData({
      title: project.title,
      date: project.date,
      materials: project.materials,
      description: project.description,
      status: project.status,
      files: project.files
    })
    setIsEditing(true)
    setShowForm(true)
  }

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      const projectToDelete = projects.find(p => p.id === projectId)
      
      // Delete associated files from SharePoint
      if (projectToDelete?.files) {
        for (const file of projectToDelete.files) {
          if (file.sharePointId) {
            try {
              await sharePointService.deleteFile(file.sharePointId)
            } catch (err) {
              console.error('Error deleting file:', err)
            }
          }
        }
      }
      
      const updatedProjects = projects.filter(p => p.id !== projectId)
      await saveProjects(updatedProjects)
      
      if (selectedProject?.id === projectId) {
        setSelectedProject(updatedProjects.length > 0 ? updatedProjects[0] : null)
      }
    }
  }

  const handleNewProject = () => {
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      materials: '',
      description: '',
      status: 'planned',
      files: []
    })
    setIsEditing(false)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setIsEditing(false)
    setFormData({
      title: '',
      date: new Date().toISOString().split('T')[0],
      materials: '',
      description: '',
      status: 'planned',
      files: []
    })
  }

  const handleExportBackup = () => {
    const dataStr = JSON.stringify(projects, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `woodworking-projects-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleSync = async () => {
    await loadProjects()
    alert('Synced with SharePoint!')
  }

  const testConnection = async () => {
    try {
      const token = await sharePointService['getAccessToken']()
      console.log('✅ Token obtained successfully')
      
      const driveId = await sharePointService['getDriveId']()
      console.log('✅ Drive ID:', driveId)
      
      alert('SharePoint connection successful!')
    } catch (error) {
      console.error('❌ Connection failed:', error)
      alert('Connection failed: ' + error)
    }
  }

  const filteredProjects = projects.filter(project =>
    project.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.materials?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'planned': return '#6c757d'
      case 'in-progress': return '#ffc107'
      case 'completed': return '#28a745'
      default: return '#6c757d'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="shop-tools-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading projects from SharePoint...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="shop-tools-container">
      {/* Header */}
      <div className="shop-header">
        <button onClick={onNavigateBack} className="back-button">
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </button>
        
        <div className="header-title">
          <Hammer className="w-6 h-6" />
          <h1>Woodworking Projects</h1>
          {syncing && <Cloud className="w-4 h-4" style={{ animation: 'pulse 2s infinite', marginLeft: '0.5rem' }} />}
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={handleSync} className="back-button" title="Sync with SharePoint" disabled={syncing}>
            <Cloud className="w-4 h-4" />
          </button>
          <button onClick={handleExportBackup} className="back-button" title="Export backup">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={testConnection} className="back-button" title="Test SharePoint Connection" style={{ backgroundColor: '#28a745' }}>
            🔧 Test
          </button>
          <div className="tools-count">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderBottom: '1px solid #ffc107', color: '#856404' }}>
          ⚠️ {error} - Using local storage as fallback
        </div>
      )}

      <div className="shop-content">
        {/* Left Side - Project List */}
        <div className="tools-list-panel">
          <div className="search-section">
            <button onClick={handleNewProject} className="random-button">
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>

          <div className="search-section" style={{ paddingTop: '0.5rem' }}>
            <input
              type="text"
              className="search-input"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="tools-list">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => {
                  setSelectedProject(project)
                  setShowForm(false)
                }}
                className={`tool-item ${selectedProject?.id === project.id && !showForm ? 'selected' : ''}`}
              >
                <div className="tool-name">{project.title}</div>
                <div className="tool-meta">
                  <span className="tool-company">{formatDate(project.date)}</span>
                  <span 
                    className="tool-price" 
                    style={{ backgroundColor: getStatusColor(project.status), color: 'white', padding: '2px 8px', borderRadius: '12px' }}
                  >
                    {project.status}
                  </span>
                </div>
                {project.materials && (
                  <div className="tool-sku">{project.materials.substring(0, 50)}{project.materials.length > 50 ? '...' : ''}</div>
                )}
              </div>
            ))}
            {filteredProjects.length === 0 && (
              <div style={{ padding: '2rem', textAlign: 'center', color: '#6c757d' }}>
                <p>No projects yet. Click "New Project" to get started!</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Project Details or Form */}
        <div className="tool-details-panel">
          {showForm ? (
            <div className="tool-details">
              <div className="details-header">
                <h2 className="details-title">{isEditing ? 'Edit Project' : 'New Project'}</h2>
                <button onClick={handleCancelForm} className="back-button" style={{ marginLeft: 'auto' }}>
                  <X className="w-4 h-4" />
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmit} className="project-form">
                <div className="form-group">
                  <label htmlFor="title">Project Title *</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className="search-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="search-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="search-input"
                  >
                    <option value="planned">Planned</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="materials">Materials</label>
                  <textarea
                    id="materials"
                    name="materials"
                    value={formData.materials}
                    onChange={handleInputChange}
                    className="search-input"
                    rows={3}
                    placeholder="List the materials needed..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="search-input"
                    rows={5}
                    placeholder="Describe your project..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="files">
                    <Upload className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Upload Files to SharePoint (Images, PDFs, etc.)
                  </label>
                  <input
                    type="file"
                    id="files"
                    onChange={handleFileUpload}
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    disabled={uploading}
                    style={{ display: 'block', marginTop: '0.5rem' }}
                  />
                  {uploading && <p style={{ color: '#ffc107', marginTop: '0.5rem' }}>Uploading files to SharePoint...</p>}
                  
                  {formData.files && formData.files.length > 0 && (
                    <div className="attached-files" style={{ marginTop: '1rem' }}>
                      {formData.files.map((file, index) => (
                        <div key={index} className="file-item" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '0.5rem' }}>
                          <Cloud className="w-4 h-4" style={{ color: '#0078d4' }} />
                          <span style={{ flex: 1 }}>{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="random-button" style={{ marginTop: '1rem' }} disabled={uploading || syncing}>
                  <Save className="w-4 h-4" />
                  {isEditing ? 'Update Project' : 'Save Project'}
                </button>
              </form>
            </div>
          ) : selectedProject ? (
            <div className="tool-details">
              <div className="details-header">
                <div>
                  <h2 className="details-title">{selectedProject.title}</h2>
                  <span 
                    className="tag" 
                    style={{ backgroundColor: getStatusColor(selectedProject.status), color: 'white', marginTop: '0.5rem', display: 'inline-block' }}
                  >
                    {selectedProject.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(selectedProject)} className="back-button">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(selectedProject.id)} 
                    className="back-button" 
                    style={{ backgroundColor: '#dc3545' }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">
                    <Calendar className="w-4 h-4" style={{ display: 'inline', marginRight: '0.5rem' }} />
                    Date
                  </span>
                  <span className="detail-value">{formatDate(selectedProject.date)}</span>
                </div>

                <div className="detail-item">
                  <span className="detail-label">Created</span>
                  <span className="detail-value">{new Date(selectedProject.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedProject.materials && (
                <div className="detail-section">
                  <h3 className="section-title">
                    <FileText className="w-4 h-4" />
                    Materials
                  </h3>
                  <p className="section-content" style={{ whiteSpace: 'pre-wrap' }}>{selectedProject.materials}</p>
                </div>
              )}

              {selectedProject.description && (
                <div className="detail-section">
                  <h3 className="section-title">Description</h3>
                  <p className="section-content" style={{ whiteSpace: 'pre-wrap' }}>{selectedProject.description}</p>
                </div>
              )}

              {selectedProject.files && selectedProject.files.length > 0 && (
                <div className="detail-section">
                  <h3 className="section-title">
                    <Cloud className="w-4 h-4" />
                    Files on SharePoint ({selectedProject.files.length})
                  </h3>
                  <div className="files-grid">
                    {selectedProject.files.map((file, index) => (
                      <div key={index} className="file-preview">
                        {file.type.startsWith('image/') ? (
                          <img src={file.url} alt={file.name} style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '0.5rem' }} />
                        ) : (
                          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center', marginBottom: '0.5rem' }}>
                            <Paperclip className="w-8 h-8" style={{ margin: '0 auto' }} />
                          </div>
                        )}
                        <a href={file.url} target="_blank" rel="noopener noreferrer" className="external-link" style={{ fontSize: '0.875rem' }}>
                          {file.name}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <Hammer size={64} />
              <p>Select a project or create a new one!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}