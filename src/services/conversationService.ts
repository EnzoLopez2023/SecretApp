// Conversation service for managing chat conversations
export interface Conversation {
  id: number
  title: string
  created_at: string
  updated_at: string
  message_count: number
  last_message_preview?: string
}

export interface ConversationMessage {
  id: string
  type: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface ConversationWithMessages {
  conversation: Conversation
  messages: ConversationMessage[]
}

const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:3001/api' : `${window.location.origin}/api`

export class ConversationService {
  // Get all conversations
  static async getAllConversations(): Promise<Conversation[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`)
      if (!response.ok) {
        throw new Error(`Failed to fetch conversations: ${response.status}`)
      }
      const data = await response.json()
      return data.conversations
    } catch (error) {
      console.error('Error fetching conversations:', error)
      throw error
    }
  }

  // Get a specific conversation with its messages
  static async getConversation(id: number): Promise<ConversationWithMessages> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${id}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch conversation: ${response.status}`)
      }
      const data = await response.json()
      
      // Convert timestamp strings back to Date objects
      data.messages = data.messages.map((msg: any) => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      }))
      
      return data
    } catch (error) {
      console.error('Error fetching conversation:', error)
      throw error
    }
  }

  // Create a new conversation
  static async createConversation(title?: string): Promise<Conversation> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.status}`)
      }
      
      const data = await response.json()
      return data.conversation
    } catch (error) {
      console.error('Error creating conversation:', error)
      throw error
    }
  }

  // Save messages to a conversation
  static async saveConversation(conversationId: number, messages: ConversationMessage[]): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      })
      
      if (!response.ok) {
        throw new Error(`Failed to save conversation: ${response.status}`)
      }
    } catch (error) {
      console.error('Error saving conversation:', error)
      throw error
    }
  }

  // Add a single message to a conversation
  static async addMessage(conversationId: number, message: ConversationMessage): Promise<void> {
    try {
      console.log(`Making request to: ${API_BASE_URL}/conversations/${conversationId}/message`)
      console.log('Message payload:', { message })
      
      const response = await fetch(`${API_BASE_URL}/conversations/${conversationId}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      })
      
      console.log('Response status:', response.status)
      const responseText = await response.text()
      console.log('Response body:', responseText)
      
      if (!response.ok) {
        throw new Error(`Failed to add message: ${response.status} - ${responseText}`)
      }
    } catch (error) {
      console.error('Error adding message:', error)
      throw error
    }
  }

  // Delete a conversation
  static async deleteConversation(id: number): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/conversations/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`Failed to delete conversation: ${response.status}`)
      }
    } catch (error) {
      console.error('Error deleting conversation:', error)
      throw error
    }
  }

  // Generate a conversation title based on the first user message
  static generateConversationTitle(firstMessage: string): string {
    // Take first 50 characters and clean it up
    let title = firstMessage.substring(0, 50).trim()
    
    // Remove markdown formatting
    title = title.replace(/[*_`#]/g, '')
    
    // Add ellipsis if truncated
    if (firstMessage.length > 50) {
      title += '...'
    }
    
    return title || `Conversation ${new Date().toLocaleString()}`
  }
}