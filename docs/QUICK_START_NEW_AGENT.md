# Quick Start: Adding a New Chat Agent

## 5-Minute Guide

### Step 1: Create Agent File
Create `src/ChatAgent/MyAgent.ts`:

```typescript
/**
 * MyAgent - Handles [domain] queries
 */

// 1. Define detection function
export const isMyQuestion = (question: string): boolean => {
  const keywords = ['keyword1', 'keyword2']
  return keywords.some(k => question.toLowerCase().includes(k))
}

// 2. Define data fetching (optional)
export const fetchMyData = async (apiBaseUrl: string) => {
  const response = await fetch(`${apiBaseUrl}/my-endpoint`)
  return response.json()
}

// 3. Generate context for Azure OpenAI
export const generateMyContext = async (question: string, apiBaseUrl: string): Promise<string> => {
  let context = `\n\nYou have access to [data]. Here's the info:\n`
  
  try {
    const data = await fetchMyData(apiBaseUrl)
    context += `- Key info: ${data.something}\n`
    context += `\nAnswer using this data.`
  } catch (error) {
    console.error('Error:', error)
    context += `- Unable to fetch data\n`
  }
  
  return context
}
```

### Step 2: Add to ChatApp
In `src/ChatApp.tsx`:

```typescript
// 1. Import at top
import { isMyQuestion, generateMyContext } from './ChatAgent/MyAgent'

// 2. Add to handleSubmit (around line 340)
if (isMyQuestion(currentQuestion)) {
  const myContext = await generateMyContext(currentQuestion, apiBaseUrl)
  enhancedQuestion = currentQuestion + myContext
}
```

### Step 3: Add Backend Endpoint (if needed)
In `server.js`:

```javascript
app.get('/api/my-endpoint', async (req, res) => {
  try {
    const data = { something: 'value' }
    res.json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed' })
  }
})
```

### Step 4: Build & Deploy
```bash
npm run build
powershell -ExecutionPolicy Bypass -File .\quick-deploy.ps1
```

## Done! 🎉

Test your agent:
1. Go to chat
2. Ask a question with your keywords
3. Agent detects → fetches data → enriches question → AI answers

## Example: Weather Agent

```typescript
// WeatherAgent.ts
export const isWeatherQuestion = (q: string): boolean => {
  return /weather|temperature|forecast|rain|sunny/i.test(q)
}

export const generateWeatherContext = async (q: string, api: string) => {
  const weather = await fetch(`${api}/weather`).then(r => r.json())
  return `\n\nCurrent weather: ${weather.temp}°F, ${weather.conditions}\n`
}
```

```typescript
// In ChatApp.tsx handleSubmit:
if (isWeatherQuestion(currentQuestion)) {
  const weatherContext = await generateWeatherContext(currentQuestion, apiBaseUrl)
  enhancedQuestion = currentQuestion + weatherContext
}
```

That's it! Your agent is now integrated. 🚀

## Pattern Summary

Every agent needs:
1. ✅ `isXQuestion()` - Detection
2. ✅ `generateXContext()` - Context generation  
3. ✅ Import in ChatApp.tsx
4. ✅ Call in handleSubmit

See `src/ChatAgent/README.md` for full documentation.
