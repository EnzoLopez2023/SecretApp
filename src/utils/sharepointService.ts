// SharePoint/Microsoft Graph API Helper - Backend Proxy Version

interface SharePointConfig {
  siteId: string
  folderPath: string
  apiUrl?: string // Backend API URL
}

class SharePointService {
  private config: SharePointConfig
  private driveId: string | null = null
  private apiUrl: string

  constructor(config: SharePointConfig) {
    this.config = config
    this.apiUrl = config.apiUrl || 'http://localhost:3001/api'
  }

  // Get Drive ID from backend
  private async getDriveId(): Promise<string> {
    if (this.driveId) {
      return this.driveId
    }

    const response = await fetch(`${this.apiUrl}/sharepoint/drive`)
    
    if (!response.ok) {
      throw new Error('Failed to get drive ID')
    }

    const data = await response.json()
    this.driveId = data.id
    return data.id
  }

  // Upload file to SharePoint via backend
  async uploadFile(file: File, fileName: string): Promise<{ name: string; url: string; type: string; sharePointId: string }> {
    try {
      const driveId = await this.getDriveId()
      
      // Convert file to base64
      const fileData = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1]
          resolve(base64)
        }
        reader.readAsDataURL(file)
      })

      const response = await fetch(`${this.apiUrl}/sharepoint/upload`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driveId,
          folderPath: this.config.folderPath,
          fileName,
          fileData
        })
      })

      if (!response.ok) {
        throw new Error('Failed to upload file')
      }

      const data = await response.json()
      
      return {
        name: data.name,
        url: data.webUrl || data['@microsoft.graph.downloadUrl'],
        type: file.type,
        sharePointId: data.id
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  // Delete file from SharePoint
  async deleteFile(fileId: string): Promise<void> {
    try {
      const driveId = await this.getDriveId()
      
      const response = await fetch(`${this.apiUrl}/sharepoint/file/${fileId}?driveId=${driveId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  // Load projects data from SharePoint
  async loadProjectsData(): Promise<any[]> {
    try {
      const driveId = await this.getDriveId()
      
      const response = await fetch(
        `${this.apiUrl}/sharepoint/data/projects.json?driveId=${driveId}&folderPath=${this.config.folderPath}`
      )

      if (!response.ok) {
        return []
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error loading projects:', error)
      return []
    }
  }

  // Save projects data to SharePoint
  async saveProjectsData(projects: any[]): Promise<void> {
    try {
      const driveId = await this.getDriveId()
      
      const response = await fetch(`${this.apiUrl}/sharepoint/data/projects.json`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          driveId,
          folderPath: this.config.folderPath,
          data: projects
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save projects data')
      }
    } catch (error) {
      console.error('Error saving projects:', error)
      throw error
    }
  }
}

export default SharePointService