import { useState } from 'react'
import { FileSpreadsheet, Package } from 'lucide-react'
import shopData from './assets/MyShop.json'
import './App.css'

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

interface ChatAppProps {
  onNavigateToConverter: () => void;
  onNavigateToShop: () => void;
}

export default function ChatApp({ onNavigateToConverter, onNavigateToShop }: ChatAppProps) {
  const [question, setQuestion] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [questionHistory, setQuestionHistory] = useState<string[]>([])

  // Debug: Check if Azure OpenAI credentials are loaded
  console.log('Azure endpoint loaded:', !!import.meta.env.VITE_AZURE_OPENAI_ENDPOINT)
  console.log('Azure API key loaded:', !!import.meta.env.VITE_AZURE_OPENAI_API_KEY)
  console.log('Endpoint:', import.meta.env.VITE_AZURE_OPENAI_ENDPOINT)
  
  // Debug: Log button state
  const isButtonDisabled = loading || !question.trim()
  console.log('Button disabled:', isButtonDisabled, 'Loading:', loading, 'Question length:', question.length, 'Question trimmed:', question.trim().length)

  const handleSubmit = async (e: React.FormEvent) => {
    console.log('Form submitted, question:', question)
    e.preventDefault()
    e.stopPropagation()
    
    if (!question.trim() || loading) {
      console.log('Submit cancelled - empty question or loading')
      return
    }

    const currentQuestion = question.trim()
    
    // Check if this is a shop-related question and enhance with context
    let enhancedQuestion = currentQuestion
    try {
      if (isShopQuestion(currentQuestion)) {
        const shopContext = generateShopContext(currentQuestion)
        enhancedQuestion = currentQuestion + shopContext
      }
    } catch (error) {
      console.error('Error generating shop context:', error)
      // Continue with original question if shop analysis fails
      enhancedQuestion = currentQuestion
    }
    
    setLoading(true)
    try {
      const response = await fetch(import.meta.env.VITE_AZURE_OPENAI_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': import.meta.env.VITE_AZURE_OPENAI_API_KEY
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: enhancedQuestion
            }
          ],
          max_tokens: 1500,
          temperature: 0.7
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const aiResponse = data.choices?.[0]?.message?.content || 'No response received'
      
      // Add question to history and clear input
      setQuestionHistory(prev => [...prev, currentQuestion])
      setQuestion('')
      setResponse(aiResponse)
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
      
      setResponse(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      {/* Navigation Header */}
      <div className="app-header">
        <h1>AI Chat Assistant</h1>
        <div className="nav-buttons">
          <button
            onClick={onNavigateToConverter}
            className="nav-button"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel to JSON Converter
          </button>
          <button
            onClick={onNavigateToShop}
            className="nav-button"
          >
            <Package className="w-4 h-4" />
            My Shop Tools
          </button>
        </div>
      </div>
      
      <div className="app-content">
        <div className="left-panel">
          <h2>Ask a Question</h2>
          
          {/* Question History */}
          <div className="question-history">
            <h3>Previous Questions</h3>
            <div className="history-list">
              {questionHistory.length === 0 ? (
                <div className="history-placeholder">No previous questions yet...</div>
              ) : (
                questionHistory.map((q, index) => (
                  <div key={index} className="history-item">
                    {index + 1}. {q}
                  </div>
                ))
              )}
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="question-form">
            <textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Type your question here..."
              className="question-input"
              rows={3}
            />
            <button 
              type="submit" 
              disabled={isButtonDisabled}
              className="submit-button"
            >
              {loading ? 'Thinking...' : 'Submit'}
            </button>
          </form>
        </div>
        
        <div className="right-panel">
          <h2>Response</h2>
          <div className="response-area">
            {loading ? (
              <div className="loading">Processing your question...</div>
            ) : response ? (
              <div className="response-text">{response}</div>
            ) : (
              <div className="placeholder">Your answer will appear here...</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}