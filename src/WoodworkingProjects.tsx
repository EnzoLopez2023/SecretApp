import { useState, useEffect, useRef } from 'react'
import { getDocument, GlobalWorkerOptions, version as pdfjsVersion } from 'pdfjs-dist'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { ArrowLeft, Hammer, Plus, Calendar, FileText, Paperclip, Save, X, Edit2, Trash2, Download, Upload } from 'lucide-react'
import projectService, { type WoodworkingProject, type ProjectFile, type ProjectFormData } from './services/projectService'
import './App.css'

GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsVersion}/pdf.worker.min.js`

interface WoodworkingProjectsProps {
  onNavigateBack: () => void
}

export default function WoodworkingProjects({ onNavigateBack }: WoodworkingProjectsProps) {
  const [projects, setProjects] = useState<WoodworkingProject[]>([])
  const [selectedProject, setSelectedProject] = useState<WoodworkingProject | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    materials: '',
    description: '',
    status: 'planned',
    files: []
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

      if (data.length > 0) {
        setSelectedProject(data[0])
      }
    } catch (err) {
      console.error('Error loading projects:', err)
      setError('Failed to load projects from database')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev: ProjectFormData) => ({ ...prev, [name]: value }))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) {
      console.log('No files selected')
      return
    }

    console.log(`Selected ${files.length} files`)
    setUploading(true)
    try {
      const uploadedFiles: any[] = []

      for (const file of Array.from(files)) {
        console.log(`Preparing file: ${file.name} (${file.type}, ${file.size} bytes)`)
        // We'll upload after saving the project
        uploadedFiles.push({
          file,
          name: file.name,
          type: file.type
        })
      }

      setFormData((prev: ProjectFormData) => {
        const newPendingFiles = [...(prev.pendingFiles || []), ...uploadedFiles]
        console.log(`Total pending files: ${newPendingFiles.length}`)
        return {
          ...prev,
          pendingFiles: newPendingFiles
        }
      })

      // Clear the file input so the same file can be selected again
      e.target.value = ''
    } catch (err) {
      console.error('Error preparing files:', err)
      alert('Failed to prepare files')
    } finally {
      setUploading(false)
    }
  }

  const removePendingFile = (index: number) => {
    setFormData((prev: ProjectFormData) => ({
      ...prev,
      pendingFiles: prev.pendingFiles?.filter((_file: any, i: number) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title?.trim()) {
      alert('Please enter a project title')
      return
    }

    setUploading(true)
    let savedProjectId: string

    try {
      if (isEditing && selectedProject) {
        savedProjectId = selectedProject.id

        // Update existing project
        await projectService.updateProject(selectedProject.id, {
          title: formData.title,
          date: formData.date,
          materials: formData.materials,
          description: formData.description,
          status: formData.status
        })

        // Upload any pending files
        if (formData.pendingFiles && formData.pendingFiles.length > 0) {
          console.log(`Uploading ${formData.pendingFiles.length} files...`)
          for (const pendingFile of formData.pendingFiles) {
            console.log(`Uploading file: ${pendingFile.name}`)
            const result = await projectService.uploadFile(selectedProject.id, pendingFile.file)
            console.log(`File uploaded successfully:`, result)
          }
        }
      } else {
        // Create new project
        savedProjectId = Date.now().toString()
        console.log(`Creating project with ID: ${savedProjectId}`)

        await projectService.createProject({
          id: savedProjectId,
          title: formData.title || '',
          date: formData.date || new Date().toISOString().split('T')[0],
          materials: formData.materials || '',
          description: formData.description,
          status: formData.status || 'planned'
        })

        // Upload files
        if (formData.pendingFiles && formData.pendingFiles.length > 0) {
          console.log(`Uploading ${formData.pendingFiles.length} files for new project...`)
          for (const pendingFile of formData.pendingFiles) {
            console.log(`Uploading file: ${pendingFile.name}`)
            const result = await projectService.uploadFile(savedProjectId, pendingFile.file)
            console.log(`File uploaded successfully:`, result)
          }
        }
      }

      // Reload projects
      await loadProjects()

      // Reload the specific project to show the uploaded files
      const updatedProject = await projectService.getProject(savedProjectId)
      setSelectedProject(updatedProject)

      // Reset form
      setShowForm(false)
      setIsEditing(false)
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        materials: '',
        description: '',
        status: 'planned',
        files: [],
        pendingFiles: []
      })

      alert('✅ Project saved successfully!')
    } catch (err) {
      console.error('Error saving project:', err)
      alert(`Failed to save project: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setUploading(false)
    }
  }

  const handleEdit = (project: WoodworkingProject) => {
    setFormData({
      title: project.title,
      date: project.date,
      materials: project.materials,
      description: project.description,
      status: project.status,
      files: project.files,
      pendingFiles: []
    })
    setIsEditing(true)
    setShowForm(true)
  }

  const handleDelete = async (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await projectService.deleteProject(projectId)
        await loadProjects()

        if (selectedProject?.id === projectId) {
          setSelectedProject(projects.length > 1 ? projects[0] : null)
        }
      } catch (err) {
        console.error('Error deleting project:', err)
        alert('Failed to delete project')
      }
    }
  }

  const handleDeleteFile = async (fileId: number) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await projectService.deleteFile(fileId)
        if (selectedProject) {
          const updated = await projectService.getProject(selectedProject.id)
          setSelectedProject(updated)
        }
      } catch (err) {
        console.error('Error deleting file:', err)
        alert('Failed to delete file')
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
      files: [],
      pendingFiles: []
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
      files: [],
      pendingFiles: []
    })
  }

  const testConnection = async () => {
    try {
      // In production, connect directly to backend on port 3001
      const productionUrl =
        window.location.hostname === 'localhost' ? 'http://localhost:3001/api' : `http://${window.location.hostname}:3001/api`

      const apiUrl = import.meta.env.DEV ? 'http://localhost:3001/api' : productionUrl
      const response = await fetch(`${apiUrl}/test`)
      const data = await response.json()

      if (data.success) {
        alert('✅ Database connection successful!')
      } else {
        alert('❌ Connection failed: ' + data.error)
      }
    } catch (error) {
      console.error('❌ Connection failed:', error)
      alert('Connection failed: ' + error)
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
        return '#6c757d'
      case 'in-progress':
        return '#ffc107'
      case 'completed':
        return '#28a745'
      default:
        return '#6c757d'
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
          <p>Loading projects from database...</p>
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
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button onClick={testConnection} className="back-button" title="Test Database Connection" style={{ backgroundColor: '#28a745' }}>
            🔧 Test
          </button>
          <div className="tools-count">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#fff3cd', borderBottom: '1px solid #ffc107', color: '#856404' }}>
          ⚠️ {error}
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
                  <div className="tool-sku">
                    {project.materials.substring(0, 50)}
                    {project.materials.length > 50 ? '...' : ''}
                  </div>
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
                  <input type="text" id="title" name="title" value={formData.title} onChange={handleInputChange} className="search-input" required />
                </div>

                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input type="date" id="date" name="date" value={formData.date} onChange={handleInputChange} className="search-input" />
                </div>

                <div className="form-group">
                  <label htmlFor="status">Status</label>
                  <select id="status" name="status" value={formData.status} onChange={handleInputChange} className="search-input">
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
                    Upload Files to Database (Images, PDFs, etc.)
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
                  {uploading && <p style={{ color: '#ffc107', marginTop: '0.5rem' }}>Preparing files...</p>}

                  {formData.pendingFiles && formData.pendingFiles.length > 0 && (
                    <div className="attached-files" style={{ marginTop: '1rem' }}>
                      {formData.pendingFiles.map((file: any, index: number) => (
                        <div
                          key={index}
                          className="file-item"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', backgroundColor: '#f8f9fa', borderRadius: '4px', marginBottom: '0.5rem' }}
                        >
                          <Paperclip className="w-4 h-4" />
                          <span style={{ flex: 1 }}>{file.name}</span>
                          <button type="button" onClick={() => removePendingFile(index)} style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }}>
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="random-button" style={{ marginTop: '1rem' }} disabled={uploading}>
                  <Save className="w-4 h-4" />
                  {uploading ? 'Saving...' : isEditing ? 'Update Project' : 'Save Project'}
                </button>
              </form>
            </div>
          ) : selectedProject ? (
            <div className="tool-details">
              <div className="details-header">
                <div>
                  <h2 className="details-title">{selectedProject.title}</h2>
                  <span className="tag" style={{ backgroundColor: getStatusColor(selectedProject.status), color: 'white', marginTop: '0.5rem', display: 'inline-block' }}>
                    {selectedProject.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => handleEdit(selectedProject)} className="back-button">
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </button>
                  <button onClick={() => handleDelete(selectedProject.id)} className="back-button" style={{ backgroundColor: '#dc3545' }}>
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
                  <span className="detail-value">{new Date(selectedProject.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {selectedProject.materials && (
                <div className="detail-section">
                  <h3 className="section-title">
                    <FileText className="w-4 h-4" />
                    Materials
                  </h3>
                  <p className="section-content" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedProject.materials}
                  </p>
                </div>
              )}

              {selectedProject.description && (
                <div className="detail-section">
                  <h3 className="section-title">Description</h3>
                  <p className="section-content" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedProject.description}
                  </p>
                </div>
              )}

              {selectedProject.files && selectedProject.files.length > 0 && (
                <div className="detail-section">
                  <h3 className="section-title">
                    <Paperclip className="w-4 h-4" />
                    Attached Files ({selectedProject.files.length})
                  </h3>
                  <div className="files-grid">
                    {selectedProject.files.map((file: ProjectFile) => (
                      <div key={file.id} className="file-preview">
                        {file.file_type.startsWith('image/') ? (
                          <img src={projectService.getFileUrl(file.id!)} alt={file.file_name} style={{ maxWidth: '100%', borderRadius: '8px', marginBottom: '0.5rem' }} />
                        ) : file.file_type === 'application/pdf' ? (
                          file.id ? (
                            <PdfAttachmentViewer file={file} />
                          ) : (
                            <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center', marginBottom: '0.5rem' }}>
                              <p style={{ marginBottom: '0.5rem' }}>Unable to preview this PDF (missing identifier).</p>
                              <a
                                href={projectService.getFileUrl(file.id ?? 0)}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  display: 'inline-block',
                                  marginTop: '0.5rem',
                                  padding: '0.5rem 1rem',
                                  backgroundColor: '#0d6efd',
                                  color: 'white',
                                  borderRadius: '0.375rem',
                                  textDecoration: 'none'
                                }}
                              >
                                Open PDF in New Tab
                              </a>
                            </div>
                          )
                        ) : (
                          <div style={{ padding: '2rem', backgroundColor: '#f8f9fa', borderRadius: '8px', textAlign: 'center', marginBottom: '0.5rem' }}>
                            <Paperclip className="w-8 h-8" style={{ margin: '0 auto' }} />
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <a
                            href={projectService.getFileUrl(file.id!)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="external-link"
                            style={{ fontSize: '0.875rem', flex: 1 }}
                          >
                            <FileText className="w-3 h-3" style={{ display: 'inline', marginRight: '0.25rem' }} />
                            {file.file_name}
                          </a>
                          <a
                            href={projectService.getFileUrl(file.id!)}
                            download={file.file_name}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#0d6efd',
                              cursor: 'pointer',
                              padding: '0.25rem',
                              textDecoration: 'none',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Download file"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => handleDeleteFile(file.id!)}
                            style={{ background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer', padding: '0.25rem' }}
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
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
        if (cancelled) {
          return
        }

        pdfDoc = await getDocument({ data: arrayBuffer }).promise
        if (cancelled) {
          return
        }

        for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
          const page = await pdfDoc.getPage(pageNum)
          if (cancelled) {
            return
          }

    const viewport = page.getViewport({ scale: 2.4 })
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) {
            continue
          }

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
    <div
      style={{
  width: '100%',
  maxHeight: '1200px',
        overflowY: 'auto',
        border: '1px solid #dee2e6',
        borderRadius: '8px',
        padding: '1rem',
        backgroundColor: '#ffffff',
        marginBottom: '0.5rem'
      }}
    >
      {loading && <p style={{ color: '#6c757d', margin: 0 }}>Rendering PDF...</p>}
      {error && (
        <p style={{ color: '#dc3545', margin: 0 }}>
          Unable to render PDF: {error}.{' '}
          <a href={projectService.getFileUrl(file.id!)} target="_blank" rel="noopener noreferrer">
            Open in new tab
          </a>
        </p>
      )}
      <div ref={containerRef} />
    </div>
  )
}
