/**
 * ChatApp.tsx - Main Chat Application Component
 * 
 * WHAT THIS FILE DOES:
 * This is the main chat interface where users can:
 * 1. Type messages and get AI responses
 * 2. Manage multiple conversations (create, switch, delete)
 * 3. Get intelligent responses about their Plex media library
 * 4. Get answers about woodworking shop data
 * 
 * KEY LEARNING CONCEPTS FOR STUDENTS:
 * - React Hooks (useState, useEffect, useRef)
 * - Material-UI component library
 * - Async/await for API calls
 * - TypeScript interfaces and type safety
 * - State management in React
 * - Event handling (onClick, onSubmit, etc.)
 * - Real-time UI updates
 * - Local storage and persistence
 * - Array manipulation and rendering
 * 
 * ARCHITECTURE OVERVIEW:
 * ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
 * │   ChatApp.tsx   │───▶│   PlexAgent.ts   │───▶│   server.js     │
 * │  (Frontend UI)  │    │ (Smart Context)  │    │   (Backend)     │
 * └─────────────────┘    └──────────────────┘    └─────────────────┘
 *         │                                              │
 *         ▼                                              ▼
 * ┌─────────────────┐                            ┌─────────────────┐
 * │ Azure OpenAI    │                            │  Plex Server    │
 * │   (AI Brain)    │                            │ (Media Library) │
 * └─────────────────┘                            └─────────────────┘
 */

// Import React hooks for managing component state and lifecycle
import { useState, useRef, useEffect } from 'react'

// Import Material-UI components for beautiful, pre-built UI elements
import {
  Box,          // Generic container component
  Paper,        // Component with shadow/elevation effect
  TextField,    // Text input field
  Typography,   // For displaying text with consistent styling
  Chip,         // Small labeled UI element
  AppBar,       // Top navigation bar
  Toolbar,      // Container for AppBar content
  Container,    // Responsive layout container
  Stack,        // Component for arranging items in a column/row
  Avatar,       // Circular profile picture component
  Fade,         // Animation component for fade in/out
  Grow,         // Animation component for grow effect
  useTheme,     // Hook to access Material-UI theme
  alpha,        // Function to add transparency to colors
  Tooltip,      // Popup information on hover
  Fab,          // Floating Action Button
  IconButton,   // Button that displays an icon
  Select,       // Dropdown selection component
  MenuItem,     // Individual option in a Select dropdown
  FormControl,  // Wrapper for form controls
  CircularProgress // Loading spinner
} from '@mui/material'

// Import Material-UI icons
import {
  Send as SendIcon,         // Send message icon
  Person as PersonIcon,     // User avatar icon
  SmartToy as BotIcon,      // AI bot icon
  Clear as ClearIcon,       // Clear/X icon
  AutoAwesome as SparkleIcon, // Sparkle/magic icon
  Add as AddIcon,           // Plus/add icon
  Delete as DeleteIcon,     // Trash/delete icon
  Check as CheckIcon,       // Checkmark icon for confirmation
  Close as CloseIcon        // Close/X icon for cancellation
} from '@mui/icons-material'

// Import Azure OpenAI client for AI functionality
// NOTE: We no longer import AzureOpenAI directly - we use our backend API instead
// import { AzureOpenAI } from "openai"

// Import local data and services
import shopData from './assets/MyShop.json'  // Woodworking shop data
import { isPlexQuestion, generatePlexContext, isPlaylistCreationRequest, extractPlaylistDetails, executePlaylistCreation } from './ChatAgent/PlexAgent'  // Plex intelligence
import MarkdownRenderer from './components/MarkdownRenderer'  // For formatting AI responses
import { ConversationService, type Conversation, type ConversationMessage } from './services/conversationService'  // Database operations

// Configuration for the chat model
const modelName = "gpt-5-chat";
const deployment = "gpt-5-chat";

/**
 * Azure OpenAI API Call Function (Secure Backend Version)
 * 
 * WHAT THIS FUNCTION DOES:
 * This function sends your conversation to Azure OpenAI via our secure backend.
 * The backend handles all the sensitive API keys and configuration.
 * 
 * HOW IT WORKS:
 * 1. Takes an array of messages (your conversation history)
 * 2. Sends them to our backend API endpoint
 * 3. Backend securely calls Azure OpenAI's GPT-5 model
 * 4. Returns the AI-generated response to display in the chat
 * 
 * LEARNING CONCEPTS:
 * - Secure API architecture (sensitive data on backend)
 * - Fetch API for HTTP requests
 * - Error handling with try/catch
 * - JSON data parsing
 * - RESTful API communication
 * 
 * SECURITY IMPROVEMENT:
 * This is much more secure than the previous version! API keys are now
 * safely stored on the backend server instead of exposed in frontend code.
 * 
 * @param messages - Array of conversation messages to send to AI
 * @returns Promise that resolves to the AI's response
 */
export async function callAzureOpenAI(messages: Array<{role: string, content: string}>) {
  try {
    // Log what we're sending (helpful for debugging)
    console.log('🔧 Making secure API call to backend with:', {
      deployment: deployment,
      model: modelName,
      messageCount: messages.length
    });

    // Make a POST request to our secure backend endpoint
    const response = await fetch('/api/azure-openai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: messages
      })
    });

    // Check if the request was successful
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Backend API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
    }

    // Parse the JSON response from our backend
    const data = await response.json();
    
    // Extract the AI's response from the API response
    // The ?. is "optional chaining" - safely access properties that might not exist
    return data.choices[0]?.message?.content || 'No response received';

  } catch (error) {
    console.error('❌ Error calling Azure OpenAI via backend:', error);
    throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ================================================================================================
// DATA TYPES AND INTERFACES
// ================================================================================================

/**
 * TypeScript Interface for Inventory Items
 * 
 * WHAT INTERFACES DO:
 * Interfaces define the "shape" of data objects. They tell TypeScript what properties
 * an object should have and what types those properties should be.
 * 
 * LEARNING BENEFIT:
 * - Catch errors at compile time instead of runtime
 * - Get autocomplete suggestions in your editor
 * - Make code self-documenting
 * 
 * EXAMPLE: If you try to access item.Name instead of item.ProductName,
 * TypeScript will warn you before you even run the code!
 */
interface InventoryItem {
  ProductName: string;        // Name of the product
  Company: string;           // Which company makes it
  Price: number | string;    // Cost (can be number or string like "$25.99")
  OrderDate?: number;        // When it was ordered (Excel date format, optional)
  Tags?: string;            // Categories or labels (optional)
  SKU?: string | number;    // Stock Keeping Unit - product ID (optional)
  [key: string]: unknown;   // Allow other properties we haven't defined
}

// ================================================================================================
// SHOP DATA ANALYSIS UTILITIES
// ================================================================================================

/**
 * Utility object for analyzing woodworking shop inventory data
 * 
 * PURPOSE: This object contains helper functions to analyze the shop data
 * and provide insights like spending by year, most expensive items, etc.
 * 
 * LEARNING CONCEPTS:
 * - Object methods and properties
 * - Date manipulation in JavaScript
 * - Array methods (filter, reduce, sort)
 * - Error handling with try/catch
 * - Type checking and conversions
 */
const analyzeShopData = {
  /**
   * Converts Excel date numbers to JavaScript Date objects
   * 
   * WHY THIS IS NEEDED: Excel stores dates as numbers (days since 1900-01-01)
   * JavaScript uses a different date system, so we need to convert.
   * 
   * MATH EXPLANATION:
   * - Excel epoch: January 1, 1900
   * - JavaScript epoch: January 1, 1970
   * - Difference: 25569 days
   * - Convert to milliseconds: multiply by 86400 (seconds/day) * 1000 (ms/second)
   */
  convertExcelDate: (excelDate: number): Date => {
    const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return jsDate;
  },

  /**
   * Analyzes spending for a specific year
   * 
   * WHAT IT DOES:
   * 1. Filters all inventory items to find ones bought in the specified year
   * 2. Calculates total money spent that year
   * 3. Counts how many items were bought
   * 4. Returns all the data for further analysis
   * 
   * ARRAY METHODS USED:
   * - filter(): Creates new array with items that pass a test
   * - reduce(): Reduces array to single value (sum of prices)
   */
  getSpendingByYear: (year: number): { total: number, count: number, items: InventoryItem[] } => {
    try {
      // Filter items to only include those from the specified year
      const yearItems = shopData.Inventory.filter((item: InventoryItem) => {
        try {
          const itemDate = analyzeShopData.convertExcelDate(item.OrderDate || 0)
          return itemDate.getFullYear() === year
        } catch {
          return false  // If date conversion fails, exclude this item
        }
      })
      
      // Calculate total spending using reduce()
      const total = yearItems.reduce((sum, item) => {
        // Handle both number and string prices
        const price = typeof item.Price === 'number' ? item.Price : parseFloat(item.Price) || 0
        return sum + price
      }, 0)
      
      return { total, count: yearItems.length, items: yearItems }
    } catch (error) {
      console.error('Error in getSpendingByYear:', error)
      return { total: 0, count: 0, items: [] }  // Return safe defaults on error
    }
  },

  // Find most expensive item
  getMostExpensive: () => {
    try {
      return shopData.Inventory.reduce((max, item) => {
        const itemPrice = typeof item.Price === 'number' ? item.Price : parseFloat(item.Price) || 0
        const maxPrice = typeof max.Price === 'number' ? max.Price : parseFloat(max.Price) || 0
        return itemPrice > maxPrice ? item : max
      })
    } catch (error) {
      console.error('Error in getMostExpensive:', error)
      return shopData.Inventory[0] || {}
    }
  },

  // Find least expensive item
  getLeastExpensive: () => {
    try {
      const validItems = shopData.Inventory.filter((item: InventoryItem) => {
        const price = typeof item.Price === 'number' ? item.Price : parseFloat(item.Price) || 0
        return price > 0
      })
      return validItems.reduce((min: InventoryItem, item: InventoryItem) => {
        const itemPrice = typeof item.Price === 'number' ? item.Price : parseFloat(item.Price) || 0
        const minPrice = typeof min.Price === 'number' ? min.Price : parseFloat(min.Price) || Infinity
        return itemPrice < minPrice ? item : min
      }, validItems[0])
    } catch (error) {
      console.error('Error in getLeastExpensive:', error)
      return shopData.Inventory[0] || {}
    }
  },

  // Get items by company
  getItemsByCompany: (company: string) => {
    return shopData.Inventory.filter((item: InventoryItem) => 
      item.Company?.toLowerCase().includes(company.toLowerCase())
    )
  },

  // Get spending by company
  getSpendingByCompany: () => {
    try {
      const companySpending: { [key: string]: { total: number, count: number } } = {}
      
      shopData.Inventory.forEach((item: InventoryItem) => {
        const company = item.Company || 'Unknown'
        if (!companySpending[company]) {
          companySpending[company] = { total: 0, count: 0 }
        }
        const price = typeof item.Price === 'number' ? item.Price : parseFloat(item.Price) || 0
        companySpending[company].total += price
        companySpending[company].count += 1
      })
      
      return Object.entries(companySpending)
        .map(([company, data]) => ({ company, ...data }))
        .sort((a, b) => b.total - a.total)
    } catch (error) {
      console.error('Error in getSpendingByCompany:', error)
      return []
    }
  },

  // Get total inventory value
  getTotalValue: () => {
    try {
      return shopData.Inventory.reduce((sum: number, item: InventoryItem) => {
        const price = typeof item.Price === 'number' ? item.Price : parseFloat(item.Price) || 0
        return sum + price
      }, 0)
    } catch (error) {
      console.error('Error in getTotalValue:', error)
      return 0
    }
  },

  // Search items by keyword
  searchItems: (keyword: string) => {
    const lowerKeyword = keyword.toLowerCase()
    return shopData.Inventory.filter((item: InventoryItem) =>
      item.ProductName?.toLowerCase().includes(lowerKeyword) ||
      item.Company?.toLowerCase().includes(lowerKeyword) ||
      item.Tags?.toLowerCase().includes(lowerKeyword) ||
      String(item.SKU)?.toLowerCase().includes(lowerKeyword)
    )
  }
}

// Detect if question is about shop data
const isShopQuestion = (question: string): boolean => {
  const shopKeywords = [
    'tool', 'tools', 'shop', 'inventory', 'spend', 'spent', 'cost', 'price', 'expensive', 'cheap',
    'woodpecker', 'company', 'brand', 'buy', 'bought', 'purchase', 'purchased', 'money',
    'total', 'value', 'worth', 'collection', 'own', 'have', 'item', 'items', 'product'
  ]
  
  const lowerQuestion = question.toLowerCase()
  return shopKeywords.some(keyword => lowerQuestion.includes(keyword))
}

// Generate context for shop-related questions
const generateShopContext = (question: string): string => {
  const lowerQuestion = question.toLowerCase()
  let context = `\n\nYou have access to the user's shop tool inventory data. Here's relevant information:\n`
  
  // Add total inventory stats
  const totalValue = analyzeShopData.getTotalValue()
  const totalItems = shopData.Inventory.length
  context += `- Total inventory: ${totalItems} items worth $${totalValue.toFixed(2)}\n`
  
  // Check for year-specific questions
  const yearMatch = question.match(/(\d{4})/)
  if (yearMatch) {
    const year = parseInt(yearMatch[1])
    const yearData = analyzeShopData.getSpendingByYear(year)
    context += `- ${year} spending: $${yearData.total.toFixed(2)} on ${yearData.count} items\n`
    
    if (yearData.items.length > 0 && yearData.items.length <= 10) {
      context += `- ${year} purchases: ${yearData.items.map(item => `${item.ProductName} ($${item.Price})`).join(', ')}\n`
    }
  }
  
  // Check for most/least expensive queries
  if (lowerQuestion.includes('most expensive') || lowerQuestion.includes('priciest')) {
    const mostExpensive = analyzeShopData.getMostExpensive()
    context += `- Most expensive item: ${mostExpensive.ProductName} by ${mostExpensive.Company} - $${mostExpensive.Price}\n`
  }
  
  if (lowerQuestion.includes('least expensive') || lowerQuestion.includes('cheapest')) {
    const leastExpensive = analyzeShopData.getLeastExpensive()
    context += `- Least expensive item: ${leastExpensive.ProductName} by ${leastExpensive.Company} - $${leastExpensive.Price}\n`
  }
  
  // Check for company-specific queries
  const companies = ['woodpecker', 'festool', 'dewalt', 'makita', 'milwaukee']
  const mentionedCompany = companies.find(company => lowerQuestion.includes(company))
  if (mentionedCompany) {
    const companyItems = analyzeShopData.getItemsByCompany(mentionedCompany)
    const companyTotal = companyItems.reduce((sum, item) => {
      const price = typeof item.Price === 'number' ? item.Price : parseFloat(item.Price) || 0
      return sum + price
    }, 0)
    context += `- ${mentionedCompany} items: ${companyItems.length} items worth $${companyTotal.toFixed(2)}\n`
  }
  
  // Add top spending by company
  if (lowerQuestion.includes('company') || lowerQuestion.includes('brand')) {
    const topCompanies = analyzeShopData.getSpendingByCompany().slice(0, 5)
    context += `- Top companies by spending: ${topCompanies.map(c => `${c.company} ($${c.total.toFixed(2)})`).join(', ')}\n`
  }
  
  context += `\nPlease answer the user's question using this inventory data. Format currency as USD dollars and be specific with numbers and details.`
  
  return context
}

// ================================================================================================
// MAIN CHAT APPLICATION COMPONENT
// ================================================================================================

/**
 * ChatApp - The Main Chat Interface Component
 * 
 * THIS IS THE HEART OF THE APPLICATION! This React component manages:
 * 
 * 1. 💬 CHAT INTERFACE: Display messages and handle user input
 * 2. 🧠 AI INTEGRATION: Send messages to Azure OpenAI and get responses
 * 3. 💾 CONVERSATION MANAGEMENT: Save, load, switch between conversations
 * 4. 🎬 PLEX INTELLIGENCE: Enhance movie questions with library context
 * 5. 🔨 SHOP DATA: Answer questions about woodworking inventory
 * 
 * REACT CONCEPTS FOR STUDENTS:
 * - useState: For managing component state (messages, loading states, etc.)
 * - useEffect: For side effects (loading data, auto-scrolling, auto-saving)
 * - useRef: For direct DOM access (scrolling to bottom)
 * - Event handlers: Functions that run when user clicks, types, etc.
 * - Conditional rendering: Show different UI based on state
 * - Component lifecycle: What happens when component mounts, updates, unmounts
 * 
 * STATE MANAGEMENT EXPLANATION:
 * React components re-render when state changes. Think of state as the component's memory.
 * When you type a message, we update the `question` state, which causes React to re-render
 * and show your typed text on screen.
 */
export default function ChatApp() {
  // ============================================================================================
  // STATE VARIABLES - The component's memory
  // ============================================================================================
  
  // Current message being typed
  const [question, setQuestion] = useState('')
  
  // Whether we're waiting for AI response
  const [loading, setLoading] = useState(false)
  
  // Array of messages in current conversation
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  
  // List of all saved conversations
  const [conversations, setConversations] = useState<Conversation[]>([])
  
  // ID of currently active conversation
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null)
  
  // Whether we're loading conversations from database
  const [loadingConversations, setLoadingConversations] = useState(true)
  
  // Whether we're saving current conversation
  const [savingConversation, setSavingConversation] = useState(false)
  
  // Playlist creation workflow state
  const [pendingPlaylistDetails, setPendingPlaylistDetails] = useState<any>(null)
  const [showPlaylistConfirmation, setShowPlaylistConfirmation] = useState(false)
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  
  // Reference to the bottom of messages (for auto-scrolling)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ============================================================================================
  // DEBUG LOGGING - Help us understand what's happening
  // ============================================================================================
  
  console.log('=== Azure OpenAI Configuration (Backend) ===')
  console.log('Model Name:', modelName)
  console.log('Deployment:', deployment)
  console.log('Backend API:', '/api/azure-openai/chat')
  console.log('===========================================')
  
  // Calculate if send button should be disabled
  const isButtonDisabled = loading || !question.trim()
  console.log('Button disabled:', isButtonDisabled, 'Loading:', loading, 'Question length:', question.length, 'Question trimmed:', question.trim().length)

  // ============================================================================================
  // REACT EFFECTS - Side effects that happen at specific times
  // ============================================================================================
  
  // EFFECT 1: Load conversations when component first mounts
  useEffect(() => {
    loadConversations()
  }, [])  // Empty dependency array = run once on mount

  // EFFECT 2: Auto-scroll to bottom when new messages appear
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, loading])  // Run when conversation or loading changes

  // EFFECT 3: Auto-save conversation when messages change (with debouncing)
  useEffect(() => {
    if (currentConversationId && conversation.length > 0) {
      // Debouncing: Wait 2 seconds after last change before saving
      // This prevents saving on every single keystroke
      const saveTimer = setTimeout(() => {
        saveCurrentConversation()
      }, 2000)

      // Cleanup function: Cancel the timer if component unmounts or dependencies change
      return () => clearTimeout(saveTimer)
    }
  }, [conversation, currentConversationId])

  // ============================================================================================
  // CONVERSATION MANAGEMENT FUNCTIONS
  // ============================================================================================
  
  /**
   * Load all conversations from the database
   * This runs when the app starts up
   */
  const loadConversations = async () => {
    try {
      setLoadingConversations(true)
      const loadedConversations = await ConversationService.getAllConversations()
      setConversations(loadedConversations)
      
      // If no current conversation and no saved conversations, create a new one
      if (!currentConversationId && loadedConversations.length === 0) {
        await createNewConversation()
      }
    } catch (error) {
      console.error('Failed to load conversations:', error)
    } finally {
      setLoadingConversations(false)
    }
  }

  // Create a new conversation
  const createNewConversation = async (title?: string) => {
    try {
      const newConversation = await ConversationService.createConversation(title)
      setCurrentConversationId(newConversation.id)
      setConversation([])
      await loadConversations() // Refresh the list
    } catch (error) {
      console.error('Failed to create new conversation:', error)
    }
  }

  // Load a specific conversation
  const loadConversation = async (conversationId: number) => {
    try {
      const { messages } = await ConversationService.getConversation(conversationId)
      setCurrentConversationId(conversationId)
      setConversation(messages)
    } catch (error) {
      console.error('Failed to load conversation:', error)
    }
  }

  // Save current conversation
  const saveCurrentConversation = async () => {
    if (!currentConversationId || conversation.length === 0) return

    try {
      setSavingConversation(true)
      await ConversationService.saveConversation(currentConversationId, conversation)
      await loadConversations() // Refresh to update preview and timestamp
    } catch (error) {
      console.error('Failed to save conversation:', error)
    } finally {
      setSavingConversation(false)
    }
  }

  // Delete a conversation
  const deleteConversation = async (conversationId: number) => {
    // Add confirmation dialog
    const confirmed = window.confirm('Are you sure you want to delete this conversation? This action cannot be undone.')
    if (!confirmed) {
      return
    }

    try {
      console.log('Attempting to delete conversation:', conversationId)
      await ConversationService.deleteConversation(conversationId)
      console.log('Conversation deleted successfully')
      
      // If we deleted the current conversation, clear the state
      if (conversationId === currentConversationId) {
        console.log('Deleted current conversation, clearing state')
        setCurrentConversationId(null)
        setConversation([])
      }
      
      console.log('Reloading conversations list')
      const updatedConversations = await ConversationService.getAllConversations()
      setConversations(updatedConversations)
      console.log('Conversations reloaded, count:', updatedConversations.length)
      
      // Only create a new conversation if no conversations exist
      if (updatedConversations.length === 0) {
        console.log('No conversations exist, creating new one')
        await createNewConversation()
      }
    } catch (error) {
      console.error('Failed to delete conversation:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to delete conversation: ${errorMessage}`)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Form submitted, question:', question)
    e.preventDefault()
    e.stopPropagation()
    
    if (!question.trim() || loading) {
      console.log('Submit cancelled - empty question or loading')
      return
    }

    const currentQuestion = question.trim()
    
    // Check if this is a response to playlist confirmation
    if (showPlaylistConfirmation) {
      const isConfirmation = /^(yes|y|yeah|sure|ok|okay|proceed|go ahead|create it|do it)$/i.test(currentQuestion) ||
                           /^(no|n|nope|cancel|don't|dont|nevermind|never mind)$/i.test(currentQuestion)
      
      if (isConfirmation) {
        const confirmed = /^(yes|y|yeah|sure|ok|okay|proceed|go ahead|create it|do it)$/i.test(currentQuestion)
        await handlePlaylistConfirmation(confirmed, currentQuestion)
        return
      }
    }
    
    // Create a new conversation if we don't have one
    let conversationId = currentConversationId
    if (!conversationId) {
      const title = ConversationService.generateConversationTitle(currentQuestion)
      const newConversation = await ConversationService.createConversation(title)
      conversationId = newConversation.id
      setCurrentConversationId(conversationId)
      await loadConversations()
    }

    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: currentQuestion,
      timestamp: new Date()
    }
    
    setConversation(prev => [...prev, userMessage])
    
    // Save user message to database
    try {
      console.log('Attempting to save user message:', userMessage)
      await ConversationService.addMessage(conversationId, userMessage)
      console.log('User message saved successfully')
    } catch (error) {
      console.error('Error saving user message:', error)
    }
    
    setQuestion('')
    setLoading(true)
    
    // Check if this is a shop-related or Plex-related question and enhance with context
    let enhancedQuestion = currentQuestion
    
    try {
      // Get API base URL
      const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
      const apiBaseUrl = configuredBase || (import.meta.env.DEV ? 'http://localhost:3001/api' : `${window.location.origin}/api`)
      
      // Check for shop questions
      if (isShopQuestion(currentQuestion)) {
        const shopContext = generateShopContext(currentQuestion)
        enhancedQuestion = currentQuestion + shopContext
      }
      
      // Check for Plex questions (can be combined with shop questions)
      if (isPlexQuestion(currentQuestion)) {
        const plexContext = await generatePlexContext(currentQuestion, apiBaseUrl)
        enhancedQuestion = currentQuestion + plexContext
      }
      
      // Check for playlist creation requests
      if (isPlaylistCreationRequest(currentQuestion)) {
        const playlistDetails = extractPlaylistDetails(currentQuestion)
        setPendingPlaylistDetails(playlistDetails)
        setShowPlaylistConfirmation(true)
        setLoading(false)
        
        // Add confirmation message to conversation
        const confirmationMessage: ConversationMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `I can create a playlist "${playlistDetails.playlistName}" with movies matching "${playlistDetails.searchTerm}". Would you like me to proceed?`,
          timestamp: new Date()
        }
        
        setConversation(prev => [...prev, confirmationMessage])
        
        // Save confirmation message to database
        try {
          await ConversationService.addMessage(conversationId, confirmationMessage)
        } catch (error) {
          console.error('Error saving confirmation message:', error)
        }
        
        return // Exit here to wait for user confirmation
      }
    } catch (error) {
      console.error('Error generating context:', error)
      // Continue with original question if context generation fails
      enhancedQuestion = currentQuestion
    }
    
    try {
      // Build conversation history for context
      const conversationHistory = conversation.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }))
      
      // Add system message and conversation history with enhanced question
      const messages = [
        { role: 'system', content: 'You are a helpful assistant. Format your responses using Markdown for better readability. Use **bold** for emphasis, *italics* for movie titles and character names, bullet points for lists, and proper headings when appropriate. For movie information, organize details clearly with headers and lists.' },
        ...conversationHistory,
        { role: 'user', content: enhancedQuestion }
      ]

      const aiResponse = await callAzureOpenAI(messages)
      
      // Add AI response to conversation
      const assistantMessage: ConversationMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: aiResponse,
        timestamp: new Date()
      }
      
      setConversation(prev => [...prev, assistantMessage])
      
      // Save AI response to database
      try {
        console.log('Attempting to save assistant message:', assistantMessage)
        await ConversationService.addMessage(conversationId, assistantMessage)
        console.log('Assistant message saved successfully')
      } catch (error) {
        console.error('Error saving assistant message:', error)
      }
    } catch (error) {
      console.error('Error:', error)
      let errorMessage = 'Sorry, there was an error processing your request.'
      
      if (error instanceof Error) {
        if (error.message.includes('401')) {
          errorMessage = 'Authentication error: Please check if your Azure OpenAI API key is valid.'
        } else if (error.message.includes('403')) {
          errorMessage = 'Permission denied: Please check your Azure OpenAI permissions.'
        } else if (error.message.includes('404')) {
          errorMessage = 'Endpoint not found: Please check your Azure OpenAI endpoint URL.'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error: Please check your internet connection.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      // Add error message to conversation
      const errorMessageObj: ConversationMessage = {
        id: `error-${Date.now()}`,
        type: 'assistant',
        content: errorMessage,
        timestamp: new Date()
      }
      
      setConversation(prev => [...prev, errorMessageObj])
      
      // Save error message to database
      try {
        if (conversationId) {
          await ConversationService.addMessage(conversationId, errorMessageObj)
        }
      } catch (error) {
        console.error('Error saving error message:', error)
      }
    } finally {
      setLoading(false)
    }
  }

  // Handle playlist creation confirmation
  const handlePlaylistConfirmation = async (confirmed: boolean, userResponse: string) => {
    if (!pendingPlaylistDetails || !currentConversationId) return
    
    // Add user's confirmation response to conversation
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: userResponse,
      timestamp: new Date()
    }
    
    setConversation(prev => [...prev, userMessage])
    
    try {
      await ConversationService.addMessage(currentConversationId, userMessage)
    } catch (error) {
      console.error('Error saving user response:', error)
    }

    if (confirmed) {
      setCreatingPlaylist(true)
      
      try {
        // Get API base URL
        const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
        const apiBaseUrl = configuredBase || (import.meta.env.DEV ? 'http://localhost:3001/api' : `${window.location.origin}/api`)
        
        const result = await executePlaylistCreation(
          userResponse,
          pendingPlaylistDetails.searchTerm,
          pendingPlaylistDetails.playlistName,
          pendingPlaylistDetails.orderBy || 'chronological',
          apiBaseUrl
        )
        
        // Add success message to conversation
        const successMessage: ConversationMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: result,
          timestamp: new Date()
        }
        
        setConversation(prev => [...prev, successMessage])
        await ConversationService.addMessage(currentConversationId, successMessage)
        
      } catch (error) {
        console.error('Error creating playlist:', error)
        
        // Add error message to conversation
        const errorMessage: ConversationMessage = {
          id: `assistant-${Date.now()}`,
          type: 'assistant',
          content: `Sorry, I encountered an error creating the playlist: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date()
        }
        
        setConversation(prev => [...prev, errorMessage])
        await ConversationService.addMessage(currentConversationId, errorMessage)
      } finally {
        setCreatingPlaylist(false)
      }
    } else {
      // User declined
      const declineMessage: ConversationMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: 'Playlist creation cancelled.',
        timestamp: new Date()
      }
      
      setConversation(prev => [...prev, declineMessage])
      await ConversationService.addMessage(currentConversationId, declineMessage)
    }
    
    // Reset playlist state
    setPendingPlaylistDetails(null)
    setShowPlaylistConfirmation(false)
  }

  const theme = useTheme()
  const [showScrollButton, setShowScrollButton] = useState(false)
  const conversationRef = useRef<HTMLDivElement>(null)

  // Handle scroll detection for scroll-to-bottom button
  useEffect(() => {
    const handleScroll = () => {
      if (conversationRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = conversationRef.current
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
        setShowScrollButton(conversation.length > 3 && !isNearBottom)
      }
    }

    const element = conversationRef.current
    if (element) {
      element.addEventListener('scroll', handleScroll)
      return () => element.removeEventListener('scroll', handleScroll)
    }
  }, [conversation.length])

  return (
    <Box sx={{ 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      bgcolor: theme.palette.background.default
    }}>
      {/* Header */}
      <AppBar 
        position="static" 
        elevation={0}
        sx={{ 
          bgcolor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', minHeight: '64px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar sx={{ 
              bgcolor: theme.palette.primary.main,
              width: 32,
              height: 32
            }}>
              <BotIcon />
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  color: theme.palette.text.primary,
                  fontWeight: 600
                }}
              >
                Workshop Studio AI (GPT-5)
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: theme.palette.text.secondary,
                  fontSize: '0.7rem',
                  opacity: 0.7
                }}
              >
                Sweden Central • {deployment}
              </Typography>
            </Box>
          </Box>

          {/* Conversation Dropdown */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <Select
                value={currentConversationId?.toString() || 'new'}
                onChange={(e) => {
                  const value = e.target.value
                  if (value === 'new') {
                    createNewConversation()
                  } else if (value) {
                    loadConversation(Number(value))
                  }
                }}
                displayEmpty
                sx={{
                  bgcolor: alpha(theme.palette.background.default, 0.8),
                  '& .MuiSelect-select': {
                    py: 1,
                    fontSize: '0.875rem'
                  }
                }}
              >
                <MenuItem value="new">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AddIcon fontSize="small" />
                    New Conversation
                  </Box>
                </MenuItem>
                {!loadingConversations && conversations.map((conv) => (
                  <MenuItem key={conv.id} value={conv.id}>
                    <Box>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 180 }}>
                        {conv.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {conv.message_count} messages • {new Date(conv.updated_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {savingConversation && (
                <CircularProgress size={20} sx={{ color: theme.palette.primary.main }} />
              )}
              
              {currentConversationId && (
                <Tooltip title="Delete conversation">
                  <IconButton 
                    onClick={() => deleteConversation(currentConversationId)}
                    size="small"
                    sx={{ 
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.2)
                      }
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {conversation.length > 0 && (
                <Tooltip title="Clear current conversation">
                  <IconButton 
                    onClick={() => createNewConversation()}
                    size="small"
                    sx={{ 
                      bgcolor: alpha(theme.palette.warning.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.warning.main, 0.2)
                      }
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Messages Container */}
      <Box 
        ref={conversationRef}
        sx={{ 
          flex: 1, 
          overflow: 'auto',
          bgcolor: alpha(theme.palette.background.default, 0.3),
          position: 'relative'
        }}
      >
        <Container 
          maxWidth="md" 
          sx={{ 
            py: 2,
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {conversation.length === 0 ? (
            <Fade in timeout={800}>
              <Box sx={{ 
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                gap: 3
              }}>
                <Avatar sx={{ 
                  width: 80, 
                  height: 80,
                  bgcolor: theme.palette.primary.main,
                  mb: 2
                }}>
                  <SparkleIcon sx={{ fontSize: 40 }} />
                </Avatar>
                
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 700,
                    background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  Welcome to Workshop Studio
                </Typography>
                
                <Typography 
                  variant="h6" 
                  color="text.secondary"
                  sx={{ maxWidth: 600, lineHeight: 1.6 }}
                >
                  Your intelligent GPT-5 powered assistant for managing projects, tools, entertainment, and more. 
                  Ask me about your shop inventory, Plex library, or any general questions.
                </Typography>

                <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                  <Chip 
                    label="🔧 Shop Tools" 
                    variant="outlined" 
                    sx={{ 
                      borderColor: theme.palette.primary.main,
                      color: theme.palette.primary.main,
                      '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                    }}
                  />
                  <Chip 
                    label="🎬 Plex Movies" 
                    variant="outlined"
                    sx={{ 
                      borderColor: theme.palette.secondary.main,
                      color: theme.palette.secondary.main,
                      '&:hover': { bgcolor: alpha(theme.palette.secondary.main, 0.1) }
                    }}
                  />
                  <Chip 
                    label="💡 General Q&A" 
                    variant="outlined"
                    sx={{ 
                      borderColor: theme.palette.success.main,
                      color: theme.palette.success.main,
                      '&:hover': { bgcolor: alpha(theme.palette.success.main, 0.1) }
                    }}
                  />
                </Stack>
              </Box>
            </Fade>
          ) : (
            <Stack spacing={3} sx={{ pb: 2 }}>
              {conversation.map((message, index) => (
                <Grow 
                  key={message.id} 
                  in 
                  timeout={300 + index * 100}
                >
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: message.type === 'user' ? 'flex-end' : 'flex-start',
                    alignItems: 'flex-start',
                    gap: 1.5
                  }}>
                    {message.type === 'assistant' && (
                      <Avatar sx={{ 
                        bgcolor: theme.palette.primary.main,
                        width: 32,
                        height: 32,
                        mt: 0.5
                      }}>
                        <BotIcon fontSize="small" />
                      </Avatar>
                    )}
                    
                    <Paper
                      elevation={message.type === 'user' ? 2 : 1}
                      sx={{
                        maxWidth: '75%',
                        p: 2,
                        bgcolor: message.type === 'user' 
                          ? theme.palette.primary.main 
                          : theme.palette.background.paper,
                        color: message.type === 'user' 
                          ? theme.palette.primary.contrastText 
                          : theme.palette.text.primary,
                        borderRadius: message.type === 'user' 
                          ? '18px 18px 4px 18px' 
                          : '18px 18px 18px 4px',
                        border: message.type === 'assistant' 
                          ? `1px solid ${theme.palette.divider}`
                          : 'none'
                      }}
                    >
                      {message.type === 'assistant' ? (
                        <MarkdownRenderer>
                          {message.content}
                        </MarkdownRenderer>
                      ) : (
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word',
                            lineHeight: 1.6
                          }}
                        >
                          {message.content}
                        </Typography>
                      )}
                      
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          display: 'block',
                          mt: 1,
                          opacity: 0.7,
                          textAlign: message.type === 'user' ? 'right' : 'left'
                        }}
                      >
                        {message.timestamp.toLocaleTimeString()}
                      </Typography>
                    </Paper>

                    {message.type === 'user' && (
                      <Avatar sx={{ 
                        bgcolor: theme.palette.secondary.main,
                        width: 32,
                        height: 32,
                        mt: 0.5
                      }}>
                        <PersonIcon fontSize="small" />
                      </Avatar>
                    )}
                  </Box>
                </Grow>
              ))}
              
              {loading && (
                <Fade in>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                    gap: 1.5
                  }}>
                    <Avatar sx={{ 
                      bgcolor: theme.palette.primary.main,
                      width: 32,
                      height: 32,
                      mt: 0.5
                    }}>
                      <BotIcon fontSize="small" />
                    </Avatar>
                    
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        bgcolor: theme.palette.background.paper,
                        borderRadius: '18px 18px 18px 4px',
                        border: `1px solid ${theme.palette.divider}`
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                        {[0, 1, 2].map((i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              bgcolor: theme.palette.primary.main,
                              animation: 'pulse 1.4s ease-in-out infinite',
                              animationDelay: `${i * 0.2}s`,
                              '@keyframes pulse': {
                                '0%, 80%, 100%': {
                                  opacity: 0.3,
                                  transform: 'scale(0.8)'
                                },
                                '40%': {
                                  opacity: 1,
                                  transform: 'scale(1)'
                                }
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Paper>
                  </Box>
                </Fade>
              )}
            </Stack>
          )}
          <div ref={messagesEndRef} />
        </Container>
        
        {/* Floating Scroll to Bottom Button */}
        {showScrollButton && (
          <Fade in>
            <Fab
              size="small"
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              sx={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                bgcolor: theme.palette.background.paper,
                color: theme.palette.text.secondary,
                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                '&:hover': {
                  bgcolor: theme.palette.background.paper,
                  transform: 'scale(1.1)',
                },
              }}
            >
              ↓
            </Fab>
          </Fade>
        )}
      </Box>

      {/* Input Area */}
      <Paper 
        elevation={8}
        sx={{ 
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper
        }}
      >
        <Container maxWidth="md">
          <Box 
            component="form" 
            onSubmit={handleSubmit}
            sx={{ 
              display: 'flex', 
              gap: 1,
              alignItems: 'flex-end'
            }}
          >
            <TextField
              multiline
              maxRows={6}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                creatingPlaylist ? "Creating playlist..." :
                showPlaylistConfirmation ? "Use the buttons to confirm or cancel playlist creation" : 
                "Type your message here..."
              }
              variant="outlined"
              fullWidth
              disabled={showPlaylistConfirmation || creatingPlaylist}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '24px',
                  bgcolor: alpha(theme.palette.background.default, 0.5),
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.main,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: theme.palette.primary.main,
                  }
                }
              }}
            />
            
            {showPlaylistConfirmation ? (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Fab
                  size="medium"
                  color="success"
                  onClick={() => handlePlaylistConfirmation(true, 'yes')}
                  disabled={creatingPlaylist}
                  sx={{ 
                    minWidth: 48,
                    minHeight: 48,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <CheckIcon />
                </Fab>
                <Fab
                  size="medium"
                  color="error"
                  onClick={() => handlePlaylistConfirmation(false, 'no')}
                  disabled={creatingPlaylist}
                  sx={{ 
                    minWidth: 48,
                    minHeight: 48,
                    transition: 'all 0.2s',
                    '&:hover': {
                      transform: 'scale(1.05)'
                    }
                  }}
                >
                  <CloseIcon />
                </Fab>
              </Box>
            ) : (
              <Fab
                type="submit"
                disabled={isButtonDisabled}
                size="medium"
                color="primary"
                sx={{ 
                  minWidth: 48,
                  minHeight: 48,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'scale(1.05)'
                  },
                  '&:active': {
                    transform: 'scale(0.95)'
                  }
                }}
              >
                <SendIcon />
              </Fab>
            )}
          </Box>
        </Container>
      </Paper>
    </Box>
  )
}