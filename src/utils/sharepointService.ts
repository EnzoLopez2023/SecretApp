// SharePoint/Microsoft Graph API Helper

interface SharePointConfig {
  tenantId: string
  clientId: string
  clientSecret: string
  siteId: string
  driveId?: string
  folderPath: string // e.g., "WoodworkingProjects"
}

class SharePointService {
  private config: SharePointConfig
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  constructor(config: SharePointConfig) {
    this.config = config
  }

  // Get access token using client credentials flow
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken ?? ''
    }

    const tokenEndpoint = `https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`
    
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      scope: 'https://graph.microsoft.com/.default',
      grant_type: 'client_credentials'
    })

    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      })

      if (!response.ok) {
        throw new Error('Failed to get access token')
      }

      const data = await response.json()
      this.accessToken = data.access_token
      this.tokenExpiry = Date.now() + (data.expires_in * 1000) - 60000 // Refresh 1 min before expiry
      
      return this.accessToken ?? ''
    } catch (error) {
      console.error('Error getting access token:', error)
      throw error
    }
  }

  // Get Drive ID from site
  private async getDriveId(): Promise<string> {
    if (this.config.driveId) {
      return this.config.driveId
    }

    const token = await this.getAccessToken()
    const response = await fetch(
      `https://graph.microsoft.com/v1.0/sites/${this.config.siteId}/drive`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    )

    if (!response.ok) {
      throw new Error('Failed to get drive ID')
    }

    const data = await response.json()
    this.config.driveId = data.id
    return data.id
  }

  // Upload file to SharePoint
  async uploadFile(file: File, fileName: string): Promise<{ name: string; url: string; type: string; sharePointId: string }> {
    try {
      const token = await this.getAccessToken()
      const driveId = await this.getDriveId()
      
      // Create folder if it doesn't exist
      await this.ensureFolderExists()

      // Upload file
      const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${this.config.folderPath}/${fileName}:/content`
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': file.type
        },
        body: file
      })

      if (!response.ok) {
        throw new Error(`Failed to upload file: ${response.statusText}`)
      }

      const data = await response.json()

      return {
        name: fileName,
        url: data.webUrl,
        type: file.type,
        sharePointId: data.id
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      throw error
    }
  }

  // Ensure folder exists
  private async ensureFolderExists(): Promise<void> {
    try {
      const token = await this.getAccessToken()
      const driveId = await this.getDriveId()

      // Try to get folder
      const checkUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${this.config.folderPath}`
      
      const checkResponse = await fetch(checkUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (checkResponse.ok) {
        return // Folder exists
      }

      // Create folder
      const createUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root/children`
      
      await fetch(createUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: this.config.folderPath,
          folder: {},
          '@microsoft.graph.conflictBehavior': 'fail'
        })
      })
    } catch (error) {
      console.error('Error ensuring folder exists:', error)
    }
  }

  // Download file from SharePoint
  async downloadFile(sharePointId: string): Promise<Blob> {
    try {
      const token = await this.getAccessToken()
      const driveId = await this.getDriveId()

      const downloadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${sharePointId}/content`
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      return await response.blob()
    } catch (error) {
      console.error('Error downloading file:', error)
      throw error
    }
  }

  // Save JSON data to SharePoint
  async saveProjectsData(projects: unknown[]): Promise<void> {
    try {
      const token = await this.getAccessToken()
      const driveId = await this.getDriveId()

      await this.ensureFolderExists()

      const jsonContent = JSON.stringify(projects, null, 2)
      const blob = new Blob([jsonContent], { type: 'application/json' })

      const uploadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${this.config.folderPath}/projects.json:/content`
      
      const response = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: blob
      })

      if (!response.ok) {
        throw new Error('Failed to save projects data')
      }
    } catch (error) {
      console.error('Error saving projects data:', error)
      throw error
    }
  }

  // Load JSON data from SharePoint
  async loadProjectsData(): Promise<unknown[]> {
    try {
      const token = await this.getAccessToken()
      const driveId = await this.getDriveId()

      const downloadUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/root:/${this.config.folderPath}/projects.json:/content`
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.status === 404) {
        return [] // File doesn't exist yet
      }

      if (!response.ok) {
        throw new Error('Failed to load projects data')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error loading projects data:', error)
      return []
    }
  }

  // Delete file from SharePoint
  async deleteFile(sharePointId: string): Promise<void> {
    try {
      const token = await this.getAccessToken()
      const driveId = await this.getDriveId()

      const deleteUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${sharePointId}`
      
      await fetch(deleteUrl, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }
}

export default SharePointService