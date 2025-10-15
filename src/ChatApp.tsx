import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Paper,
  TextField,
  Typography,
  Chip,
  AppBar,
  Toolbar,
  Container,
  Stack,
  Avatar,
  Fade,
  Grow,
  useTheme,
  alpha,
  Tooltip,
  Fab,
  IconButton
} from '@mui/material'
import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  Clear as ClearIcon,
  AutoAwesome as SparkleIcon
} from '@mui/icons-material'
import { AzureOpenAI } from "openai"
import shopData from './assets/MyShop.json'
import { isPlexQuestion, generatePlexContext } from './ChatAgent/PlexAgent'

// Azure OpenAI configuration
const endpoint = "https://enzol-mgr7she7-swedencentral.cognitiveservices.azure.com/";
const modelName = "gpt-5-chat";
const deployment = "gpt-5-chat";

export async function callAzureOpenAI(messages: Array<{role: string, content: string}>) {
  const apiKey = "CMAJXHUEw8cWYiD6bd6UhnjIqxYLO7FngHwiuIOkpRjcIABZKVBxJQQJ99BJACfhMk5XJ3w3AAAAACOGxNoa";
  const apiVersion = "2024-04-01-preview";
  const options = { 
    endpoint, 
    apiKey, 
    deployment, 
    apiVersion,
    dangerouslyAllowBrowser: true 
  }

  console.log('🔧 Making API call with:', {
    endpoint: endpoint,
    deployment: deployment,
    model: modelName,
    apiVersion: apiVersion
  });

  const client = new AzureOpenAI(options);

  const response = await client.chat.completions.create({
    messages: messages.map(msg => ({
      role: msg.role as "system" | "user" | "assistant",
      content: msg.content
    })),
    max_tokens: 16384,
    temperature: 1,
    top_p: 1,
    model: modelName
  });

  return response.choices[0]?.message?.content || 'No response received';
}

// Define the type for inventory items
interface InventoryItem {
  ProductName: string;
  Company: string;
  Price: number | string;
  OrderDate?: number;
  Tags?: string;
  SKU?: string | number;
  [key: string]: unknown; // Remove this line if you want stricter typing
}

// Utility object for shop data analysis
const analyzeShopData = {
  convertExcelDate: (excelDate: number): Date => {
    // Excel date to JS date conversion
    // Excel's epoch starts at 1900-01-01
    const jsDate = new Date(Math.round((excelDate - 25569) * 86400 * 1000));
    return jsDate;
  },

  getSpendingByYear: (year: number): { total: number, count: number, items: InventoryItem[] } => {
    try {
      const yearItems = shopData.Inventory.filter((item: InventoryItem) => {
        try {
          const itemDate = analyzeShopData.convertExcelDate(item.OrderDate || 0)
          return itemDate.getFullYear() === year
        } catch {
          return false
        }
      })
      
      const total = yearItems.reduce((sum, item) => {
        const price = typeof item.Price === 'number' ? item.Price : parseFloat(item.Price) || 0
        return sum + price
      }, 0)
      return { total, count: yearItems.length, items: yearItems }
    } catch (error) {
      console.error('Error in getSpendingByYear:', error)
      return { total: 0, count: 0, items: [] }
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

// Interface for conversation messages
interface ConversationMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatApp() {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Debug: Azure OpenAI GPT-5 configuration
  console.log('=== Azure OpenAI Configuration ===')
  console.log('Endpoint:', endpoint)
  console.log('Model Name:', modelName)
  console.log('Deployment:', deployment)
  console.log('API Version:', '2024-04-01-preview')
  console.log('==================================')
  
  // Debug: Log button state
  const isButtonDisabled = loading || !question.trim()
  console.log('Button disabled:', isButtonDisabled, 'Loading:', loading, 'Question length:', question.length, 'Question trimmed:', question.trim().length)

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [conversation, loading])

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Form submitted, question:', question)
    e.preventDefault()
    e.stopPropagation()
    
    if (!question.trim() || loading) {
      console.log('Submit cancelled - empty question or loading')
      return
    }

    const currentQuestion = question.trim()
    
    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: currentQuestion,
      timestamp: new Date()
    }
    
    setConversation(prev => [...prev, userMessage])
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
        { role: 'system', content: 'You are a helpful assistant.' },
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
    } finally {
      setLoading(false)
    }
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
        <Toolbar sx={{ justifyContent: 'space-between' }}>
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
          
          {conversation.length > 0 && (
            <Tooltip title="Clear conversation">
              <IconButton 
                onClick={() => setConversation([])}
                size="small"
                sx={{ 
                  bgcolor: alpha(theme.palette.error.main, 0.1),
                  '&:hover': {
                    bgcolor: alpha(theme.palette.error.main, 0.2)
                  }
                }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
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
              placeholder="Type your message here..."
              variant="outlined"
              fullWidth
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
          </Box>
        </Container>
      </Paper>
    </Box>
  )
}