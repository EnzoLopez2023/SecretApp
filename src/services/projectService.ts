// Project Service - MySQL Backend

export interface WoodworkingProject {
  id: string
  title: string
  date: string
  materials: string
  description?: string
  status?: 'planned' | 'in-progress' | 'completed'
  files?: ProjectFile[]
  created_at: string
  updated_at: string
}

export interface ProjectFile {
  id?: number
  project_id?: string
  file_name: string
  file_type: string
  uploaded_at?: string
}

export interface ProjectFormData extends Partial<WoodworkingProject> {
  pendingFiles?: Array<{
    file: File
    name: string
    type: string
  }>
}

class ProjectService {
  private apiUrl: string

  constructor() {
    const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
    if (configuredBase) {
      this.apiUrl = configuredBase
      return
    }

    const devBase = 'http://localhost:3001/api'
    const prodBase = `${window.location.origin}/api`

    this.apiUrl = import.meta.env.DEV ? devBase : prodBase
  }

  async getAllProjects(): Promise<WoodworkingProject[]> {
    const response = await fetch(`${this.apiUrl}/projects`)
    if (!response.ok) throw new Error('Failed to load projects')
    return await response.json()
  }

  async getProject(id: string): Promise<WoodworkingProject> {
    const response = await fetch(`${this.apiUrl}/projects/${id}`)
    if (!response.ok) throw new Error('Failed to load project')
    return await response.json()
  }

  async createProject(project: Omit<WoodworkingProject, 'created_at' | 'updated_at' | 'files'>): Promise<void> {
    const response = await fetch(`${this.apiUrl}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    })
    if (!response.ok) throw new Error('Failed to create project')
  }

  async updateProject(id: string, project: Partial<WoodworkingProject>): Promise<void> {
    const response = await fetch(`${this.apiUrl}/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project)
    })
    if (!response.ok) {
      const error = await response.text()
      console.error('Update failed:', error)
      throw new Error(`Failed to update project: ${error}`)
    }
  }

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${this.apiUrl}/projects/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete project')
  }

  async uploadFile(projectId: string, file: File): Promise<{ fileId: number; fileName: string; fileType: string }> {
    const fileData = await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1]
        resolve(base64)
      }
      reader.readAsDataURL(file)
    })

    const response = await fetch(`${this.apiUrl}/projects/${projectId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileData,
        fileType: file.type
      })
    })

    if (!response.ok) throw new Error('Failed to upload file')
    return await response.json()
  }

  async deleteFile(fileId: number): Promise<void> {
    const response = await fetch(`${this.apiUrl}/files/${fileId}`, {
      method: 'DELETE'
    })
    if (!response.ok) throw new Error('Failed to delete file')
  }

  getFileUrl(fileId: number): string {
    return `${this.apiUrl}/files/${fileId}`
  }
}

export default new ProjectService()
