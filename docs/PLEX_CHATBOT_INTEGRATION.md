# Plex Library Chatbot Integration

## Overview
Your Azure OpenAI chatbot can now answer questions about your Plex media libraries! The bot automatically detects when you ask about movies, shows, or libraries and fetches real-time data from your Plex server.

## Features

### 1. Library Statistics
Ask about library counts and get instant answers:
- **"How many movies in my 4K library?"**
- **"How many items in my Halloween Movies library?"**
- **"List all my libraries"**
- **"What libraries do I have?"**

### 2. Library Existence Checks
The bot will tell you if a library exists or not:
- **"Do I have an Anime library?"** → Bot checks and responds with library details or suggests available libraries

### 3. Total Counts
Get aggregate statistics across all libraries:
- **"How many total movies do I have?"**
- **"How many TV shows do I have?"**

## How It Works

### Backend API Endpoints

#### 1. Get All Library Sections
```
GET /api/plex/sections
```
Returns all available Plex library sections with metadata.

#### 2. Get Specific Library Content
```
GET /api/plex/sections/:key/all
```
Returns all items in a specific library by its key.

#### 3. Get Library Statistics
```
GET /api/plex/stats
```
Returns aggregated statistics for all libraries (used by chatbot).

**Response Example:**
```json
{
  "libraries": [
    {
      "key": "11",
      "title": "3D Movies",
      "type": "movie",
      "count": 121,
      "uuid": "90655b30-ad2e-464a-b8bf-376aa1b75d37"
    },
    {
      "key": "6",
      "title": "4K Movies",
      "type": "movie",
      "count": 499,
      "uuid": "048d69c8-20c4-..."
    },
    {
      "key": "9",
      "title": "Halloween Movies",
      "type": "movie",
      "count": 61,
      "uuid": "acfbaa85-ba38-4cd0-b6ce-776513bbb642"
    }
  ]
}
```

### Frontend Integration

The chatbot (`ChatApp.tsx`) automatically:
1. Detects Plex-related keywords in your questions
2. Fetches library statistics from the backend
3. Enhances your question with relevant library data
4. Sends the enriched question to Azure OpenAI
5. Returns a context-aware response

### Detection Keywords
The bot recognizes these keywords as Plex-related:
- library, libraries, plex
- movie, movies, film, films
- show, shows, tv
- media, collection, watch, watching
- 4k, halloween, anime (library names)

## Example Conversations

### Example 1: Check Library Count
**You:** "How many movies in my 4K library?"

**Bot Context (internal):**
```
Available libraries:
- "3D Movies" (movie): 121 items
- "4K Movies" (movie): 499 items
- "Halloween Movies" (movie): 61 items
...

Requested library "4K Movies":
- Type: movie
- Total items: 499
```

**Bot Response:** "You have 499 movies in your 4K Movies library."

### Example 2: Check Non-Existent Library
**You:** "How many movies in my Anime library?"

**Bot Response:** "You don't have an Anime library. Here are your available libraries: 3D Movies (121), 4K Movies (499), Halloween Movies (61), ALL Movies (3829), ..."

### Example 3: Total Count
**You:** "How many total movies do I have?"

**Bot Response:** "You have a total of 4,510 movies across all your movie libraries."

## Configuration

### Plex Settings (server.js)
```javascript
const plexConfig = {
  baseUrl: process.env.PLEX_BASE_URL || 'https://plex.enzolopez.net:32400',
  token: process.env.PLEX_TOKEN || '5kj8hCXerpUCNp5AxH5V',
  librarySection: process.env.PLEX_LIBRARY_SECTION || '9'
}
```

### Environment Variables
Set these in your `.env` file:
```
PLEX_BASE_URL=https://plex.enzolopez.net:32400
PLEX_TOKEN=your_plex_token_here
```

## Combining with Shop Inventory

The bot can handle questions about BOTH your tool inventory AND Plex libraries in the same conversation:

**You:** "How much did I spend on tools in 2024 and how many movies are in my Halloween library?"

**Bot:** "In 2024, you spent $X,XXX on XX tools. Your Halloween Movies library contains 61 movies."

## Technical Details

### Data Flow
1. User asks question → ChatApp.tsx
2. Question analyzed for keywords (shop OR plex)
3. If Plex detected → Fetch `/api/plex/stats`
4. Generate context with library data
5. Enhanced question + context → Azure OpenAI
6. AI response → User

### Performance
- Library stats are fetched in real-time
- Typical response time: 1-2 seconds
- Cached by Plex server for efficiency
- No database required (queries Plex API directly)

## Troubleshooting

### Bot doesn't recognize library questions
- Check that keywords are in the question
- Try being more explicit: "How many movies in my Plex 4K library?"

### Wrong library count
- Check Plex server is running
- Verify token is valid: `curl http://localhost:3001/api/plex/stats`
- Check server logs: `pm2 logs secretapp-backend`

### API errors
```bash
# Test endpoints manually
curl http://localhost:3001/api/plex/sections
curl http://localhost:3001/api/plex/sections/9/all
curl http://localhost:3001/api/plex/stats
```

## Future Enhancements

Potential improvements:
- [ ] Query specific movie details
- [ ] Search for movies by name
- [ ] Get recently added items
- [ ] Compare libraries (e.g., "Do I have more 4K or 3D movies?")
- [ ] Genre statistics
- [ ] Watch history analysis
- [ ] Recommendation engine integration

## Support

For issues or questions:
1. Check PM2 logs: `pm2 logs secretapp-backend`
2. Test API endpoints manually (see Troubleshooting)
3. Verify Plex server is accessible
4. Check Azure OpenAI API credits/limits

---

✨ **Enjoy your enhanced chatbot with Plex integration!** ✨
