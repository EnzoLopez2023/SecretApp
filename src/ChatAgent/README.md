# Chat Agents

This directory contains modular chat agents that enhance the Azure OpenAI chatbot with specialized knowledge and capabilities.

## Architecture

Each agent is responsible for:
1. **Detection** - Identifying when questions are relevant to their domain
2. **Data Fetching** - Retrieving real-time data from APIs or local sources
3. **Context Generation** - Creating enriched context for Azure OpenAI

## Available Agents

### PlexAgent.ts
**Domain:** Plex media library queries

**Capabilities:**
- Detects questions about movies, TV shows, and media libraries
- Fetches real-time library statistics from Plex server
- Provides library counts, comparisons, and existence checks
- Supports queries across all library types (movies, shows, music)

**Example Questions:**
- "How many movies in my 4K library?"
- "Do I have a Halloween Movies library?"
- "Compare my 3D and 4K movie collections"

**Usage:**
```typescript
import { isPlexQuestion, generatePlexContext } from './ChatAgent/PlexAgent'

if (isPlexQuestion(question)) {
  const context = await generatePlexContext(question, apiBaseUrl)
  enhancedQuestion = question + context
}
```

## Creating a New Agent

To create a new agent, follow this pattern:

### 1. Create Agent File
Create `src/ChatAgent/YourAgent.ts`:

```typescript
/**
 * YourAgent - Handles [domain] queries and context generation
 */

export interface YourDataType {
  // Define your data structure
}

/**
 * Detects if a question is related to your domain
 */
export const isYourQuestion = (question: string): boolean => {
  const keywords = ['keyword1', 'keyword2', 'keyword3']
  const lowerQuestion = question.toLowerCase()
  return keywords.some(keyword => lowerQuestion.includes(keyword))
}

/**
 * Fetches data from your data source
 */
export const fetchYourData = async (apiBaseUrl: string): Promise<YourDataType | null> => {
  try {
    const response = await fetch(`${apiBaseUrl}/your-endpoint`)
    if (!response.ok) {
      throw new Error('Failed to fetch data')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching data:', error)
    return null
  }
}

/**
 * Generates enriched context for your domain
 */
export const generateYourContext = async (question: string, apiBaseUrl: string): Promise<string> => {
  let context = `\n\nYou have access to [domain] data. Here's the information:\n`
  
  try {
    const data = await fetchYourData(apiBaseUrl)
    
    if (!data) {
      return context + `- Unable to fetch data at this time.\n`
    }
    
    // Add relevant context based on the question and data
    context += `- [Relevant information]\n`
    
    context += `\nPlease answer using this data. Be specific and accurate.`
  } catch (error) {
    console.error('Error generating context:', error)
    context += `- Error fetching information.\n`
  }
  
  return context
}

export default {
  isYourQuestion,
  fetchYourData,
  generateYourContext
}
```

### 2. Add Backend Endpoint (if needed)
In `server.js`, add API endpoint:

```javascript
app.get('/api/your-endpoint', async (req, res) => {
  try {
    // Fetch and process data
    const data = await fetchSomeData()
    res.json(data)
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ error: 'Failed to fetch data' })
  }
})
```

### 3. Integrate with ChatApp
In `src/ChatApp.tsx`:

```typescript
import { isYourQuestion, generateYourContext } from './ChatAgent/YourAgent'

// In handleSubmit function:
if (isYourQuestion(currentQuestion)) {
  const yourContext = await generateYourContext(currentQuestion, apiBaseUrl)
  enhancedQuestion = currentQuestion + yourContext
}
```

## Agent Design Principles

### 1. Single Responsibility
Each agent should handle ONE specific domain:
- ✅ PlexAgent handles Plex libraries
- ✅ ShopAgent (future) handles tool inventory
- ✅ WeatherAgent (future) handles weather queries
- ❌ Don't create a "GeneralPurposeAgent" that does everything

### 2. Graceful Degradation
Agents should fail gracefully:
```typescript
if (!data) {
  return `- Unable to fetch data. Answering with general knowledge.\n`
}
```

### 3. Context Over Raw Data
Provide **interpreted context**, not raw data dumps:
- ✅ "You have 499 movies in your 4K library"
- ❌ `{"count": 499, "type": "movie", "library": "4K"...}`

### 4. Performance
- Use async/await for data fetching
- Cache when appropriate
- Timeout long-running requests
- Don't block the UI

### 5. Error Handling
Always catch and log errors:
```typescript
try {
  // Agent logic
} catch (error) {
  console.error('Agent error:', error)
  return fallbackResponse
}
```

## Future Agent Ideas

Potential agents to implement:

### 🛠️ ShopAgent
- Query tool inventory
- Already has local data analysis in ChatApp.tsx (move to agent)
- Example: "How much did I spend on Festool tools?"

### 🌤️ WeatherAgent
- Current weather and forecasts
- Location-based queries
- Example: "What's the weather like today?"

### 📅 CalendarAgent
- Check calendar events
- Schedule management
- Example: "Do I have any meetings today?"

### 📧 EmailAgent
- Email summary and search
- Unread count, recent messages
- Example: "Do I have any important emails?"

### 🏠 SmartHomeAgent
- Control smart home devices
- Status queries
- Example: "Is my garage door closed?"

### 📊 FinanceAgent
- Budget tracking
- Expense analysis
- Example: "How much did I spend on groceries this month?"

### 🎵 MusicAgent
- Music library queries (if you have Plex Music)
- Playlist management
- Example: "How many albums do I have?"

## Testing Agents

### Unit Testing
Test each function independently:
```typescript
import { isPlexQuestion, generatePlexContext } from './PlexAgent'

// Test detection
console.assert(isPlexQuestion("How many movies?") === true)
console.assert(isPlexQuestion("What's the weather?") === false)

// Test context generation
const context = await generatePlexContext("How many movies?", apiUrl)
console.assert(context.includes("Plex"))
```

### Integration Testing
Test the full flow:
1. Ask a question in the chatbot
2. Verify agent is triggered
3. Check context is added
4. Confirm Azure OpenAI receives enriched question
5. Validate response accuracy

### Manual Testing Checklist
For each agent, test:
- [ ] Detection works with various phrasings
- [ ] API endpoint returns valid data
- [ ] Context generation is accurate
- [ ] Error handling works (disconnect API)
- [ ] Performance is acceptable (<2s)
- [ ] Azure OpenAI provides good answers

## Best Practices

### ✅ DO:
- Keep agents focused and modular
- Use TypeScript types and interfaces
- Document with JSDoc comments
- Handle errors gracefully
- Log useful debugging information
- Test thoroughly before deploying

### ❌ DON'T:
- Mix multiple domains in one agent
- Expose sensitive data in context
- Block the UI with synchronous operations
- Ignore error cases
- Hardcode values (use config/env vars)
- Forget to update this README when adding agents

## File Structure

```
src/
└── ChatAgent/
    ├── README.md           # This file
    ├── PlexAgent.ts        # Plex media library agent
    ├── Agent.ts            # (Empty - reserved for base agent class)
    └── [Future agents...]
```

## Contributing

When adding a new agent:
1. Create the agent file following the pattern above
2. Add backend endpoints if needed (server.js)
3. Integrate with ChatApp.tsx
4. Update this README with agent details
5. Test thoroughly
6. Document example questions
7. Add to "Available Agents" section above

---

**Happy agent building!** 🤖✨
