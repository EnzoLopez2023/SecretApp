/**
 * Plex Agent - Handles Plex media library queries and context generation
 * 
 * WHAT THIS FILE DOES:
 * This agent is like a "smart assistant" that helps answer questions about your Plex media library.
 * When you ask "Do I have The Matrix?", this agent:
 * 1. Detects that it's a Plex-related question
 * 2. Fetches your actual library data from your Plex server
 * 3. Creates detailed context information
 * 4. Sends that context to Azure OpenAI so it can give you accurate answers
 * 
 * LEARNING CONCEPTS DEMONSTRATED:
 * - TypeScript interfaces for type safety
 * - Async/await for handling network requests
 * - Regular expressions for pattern matching
 * - Array methods like filter(), map(), find()
 * - Error handling with try/catch blocks
 * - API integration with external services (Plex server)
 * - Context enrichment for AI systems
 */

// ================================================================================================
// TYPESCRIPT INTERFACES - These define the "shape" of our data
// Think of interfaces like blueprints that tell TypeScript what properties an object should have
// ================================================================================================

/**
 * PlexLibrary Interface
 * This describes what a Plex library object looks like when we get it from the server
 * 
 * STUDENT NOTE: Interfaces help prevent bugs by ensuring we use the right property names
 * and data types. If you try to access library.name instead of library.title, TypeScript
 * will catch that error before your code even runs!
 */
export interface PlexLibrary {
  key: string        // Unique identifier for the library (like "1", "2", "3")
  title: string      // Human-readable name (like "Movies", "TV Shows")
  type: string       // What kind of media ("movie", "show", "artist")
  count: number      // How many items are in this library
  uuid: string       // Another unique identifier (more complex than key)
  error?: string     // Optional error message if something went wrong
}

/**
 * PlexStatsResponse Interface
 * This describes the response we get when asking for library statistics
 * 
 * STUDENT NOTE: The "?" in error? means this property is optional - it might not exist
 */
export interface PlexStatsResponse {
  libraries: PlexLibrary[]  // Array of PlexLibrary objects
}

/**
 * MovieDetails Interface
 * This describes detailed information about a specific movie from external databases (like IMDb)
 * 
 * LEARNING POINT: Notice how we can combine data from multiple sources:
 * - Basic info from Plex (title, year)
 * - Detailed info from movie databases (plot, cast, ratings)
 */
export interface MovieDetails {
  title: string         // Movie title
  year: string          // Release year
  rated: string         // Rating (PG, PG-13, R, etc.)
  released: string      // Exact release date
  runtime: string       // How long the movie is
  genre: string         // Categories (Action, Comedy, etc.)
  director: string      // Who directed it
  writer: string        // Who wrote the screenplay
  actors: string        // Main cast members
  plot: string          // Story summary
  language: string      // Primary language
  country: string       // Country of origin
  awards: string        // Awards and nominations
  poster: string        // URL to movie poster image
  imdbRating: string    // IMDb score (like "8.7")
  imdbVotes: string     // How many people voted
  boxOffice?: string    // Optional: how much money it made
  production?: string   // Optional: production company
}

/**
 * PlexMovieSearchResponse Interface
 * This describes what we get back when searching for movies in Plex
 */
export interface PlexMovieSearchResponse {
  movies: Array<{       // Array of movie objects
    title: string       // Movie title
    year: number        // Release year (as a number this time)
    key: string         // Plex's internal ID for this movie
    guid: string        // Global unique identifier
  }>
}

// ================================================================================================
// DETECTION FUNCTIONS - These analyze user questions to understand what they're asking
// ================================================================================================

/**
 * Detects if a question is related to Plex media libraries
 * 
 * HOW IT WORKS:
 * 1. Creates an array of keywords that indicate Plex-related questions
 * 2. Converts the question to lowercase for case-insensitive matching
 * 3. Uses Array.some() to check if ANY keyword appears in the question
 * 
 * STUDENT LEARNING:
 * - Array.some() returns true if at least one element passes the test
 * - includes() method checks if a string contains another string
 * - toLowerCase() ensures "Movie" and "movie" are treated the same
 * 
 * @param question - The user's question
 * @returns true if the question contains Plex-related keywords
 */
export const isPlexQuestion = (question: string): boolean => {
  // Define keywords that suggest the user is asking about their media library
  const plexKeywords = [
    'library', 'libraries', 'plex', 'movie', 'movies', 'show', 'shows', 'tv', 'media',
    '4k', 'halloween', 'anime', 'collection', 'watch', 'watching', 'film', 'films',
    '3d', 'section', 'sections'
  ]
  
  // Convert to lowercase to make matching case-insensitive
  const lowerQuestion = question.toLowerCase()
  
  // Check if ANY of our keywords appear in the question
  // some() stops checking as soon as it finds a match (efficient!)
  return plexKeywords.some(keyword => lowerQuestion.includes(keyword))
}

/**
 * Detects if a question is asking for detailed movie information
 * 
 * PURPOSE: Some questions want basic info ("Do I have this movie?") while others want
 * detailed info ("Tell me about this movie"). This function identifies the latter.
 * 
 * LEARNING CONCEPTS:
 * - Regular expressions (coming up in extractMovieTitleFromQuestion)
 * - The difference between existence queries vs. detail queries
 * 
 * @param question - The user's question
 * @returns true if the question asks for movie details, cast, plot, etc.
 */
export const isMovieDetailQuestion = (question: string): boolean => {
  // Keywords that indicate someone wants detailed information
  const movieDetailKeywords = [
    'tell me about', 'tell me more about', 'who are the actors', 'who stars in', 'cast',
    'plot', 'story', 'synopsis', 'director', 'directed by', 'genre', 'rating',
    'release date', 'when was', 'released', 'imdb', 'rotten tomatoes', 'reviews',
    'budget', 'box office', 'awards', 'nominations', 'runtime', 'duration'
  ]
  
  const lowerQuestion = question.toLowerCase()
  return movieDetailKeywords.some(keyword => lowerQuestion.includes(keyword))
}

/**
 * Detects if a question is asking to create a playlist
 * 
 * PURPOSE: Identifies when users want to create playlists like:
 * - "Create a playlist of Iron Man movies"
 * - "Make a Marvel playlist"
 * - "Create a playlist with all Batman movies in order"
 * 
 * LEARNING CONCEPTS:
 * - Pattern recognition for user intent detection
 * - Regular expressions for complex pattern matching
 * - Action detection vs information queries
 * 
 * @param question - The user's question
 * @returns true if the question asks to create a playlist
 */
export const isPlaylistCreationRequest = (question: string): boolean => {
  const playlistKeywords = [
    'create playlist', 'make playlist', 'playlist of', 'playlist with', 'playlist containing',
    'create a playlist', 'make a playlist', 'build playlist', 'generate playlist',
    'playlist for', 'new playlist'
  ]
  
  const lowerQuestion = question.toLowerCase()
  return playlistKeywords.some(keyword => lowerQuestion.includes(keyword))
}

/**
 * Extracts playlist details from a user's request
 * 
 * PURPOSE: Parses playlist creation requests to extract:
 * - What movies/shows to include
 * - Desired playlist name
 * - Any ordering requirements
 * 
 * EXAMPLE INPUTS:
 * - "Create a playlist of Iron Man movies in chronological order"
 * - "Make a Marvel playlist with all Avengers movies"
 * - "Create a playlist called 'Action Movies' with John Wick and Mission Impossible"
 * 
 * @param question - The user's playlist creation request
 * @returns Object with playlist details
 */
export const extractPlaylistDetails = (question: string): {
  searchTerm: string
  playlistName: string
  orderBy: 'chronological' | 'alphabetical' | 'release' | 'none'
} => {
  const lowerQuestion = question.toLowerCase()
  
  // Extract search term (what movies/shows to find)
  let searchTerm = ''
  
  // Look for patterns like "Iron Man movies", "Marvel movies", "Batman films"
  const searchPatterns = [
    /(?:playlist (?:of|with|containing) )([^,]+?)(?:\s+(?:movies|films|shows))/i,
    /(?:playlist (?:of|with|containing) )([^,]+)/i,
    /(?:called '[^']+' with )([^,]+)/i,
    /(?:called "[^"]+" with )([^,]+)/i
  ]
  
  for (const pattern of searchPatterns) {
    const match = question.match(pattern)
    if (match) {
      searchTerm = match[1].trim()
      break
    }
  }
  
  // Extract playlist name if specified
  let playlistName = ''
  const namePatterns = [
    /(?:playlist called|called) '([^']+)'/i,
    /(?:playlist called|called) "([^"]+)"/i,
    /(?:playlist called|called) ([^,\s]+)/i
  ]
  
  for (const pattern of namePatterns) {
    const match = question.match(pattern)
    if (match) {
      playlistName = match[1].trim()
      break
    }
  }
  
  // If no explicit name, generate one from search term
  if (!playlistName && searchTerm) {
    playlistName = `${searchTerm} Collection`
  }
  
  // Determine ordering preference
  let orderBy: 'chronological' | 'alphabetical' | 'release' | 'none' = 'none'
  
  if (lowerQuestion.includes('chronological') || lowerQuestion.includes('in order')) {
    orderBy = 'chronological'
  } else if (lowerQuestion.includes('alphabetical') || lowerQuestion.includes('a-z')) {
    orderBy = 'alphabetical'
  } else if (lowerQuestion.includes('release date') || lowerQuestion.includes('release order')) {
    orderBy = 'release'
  }
  
  return {
    searchTerm,
    playlistName,
    orderBy
  }
}

// ================================================================================================
// API COMMUNICATION FUNCTIONS - These talk to external services
// ================================================================================================

/**
 * Fetches Plex library statistics from the backend API
 * 
 * WHAT HAPPENS HERE:
 * 1. Makes an HTTP GET request to our backend server
 * 2. Our backend then talks to the actual Plex server
 * 3. Returns library information (names, counts, types)
 * 
 * WHY WE DO IT THIS WAY:
 * - Plex servers require authentication tokens
 * - It's safer to keep those tokens on the backend
 * - Frontend just asks our backend, which handles the Plex communication
 * 
 * STUDENT LEARNING CONCEPTS:
 * - async/await for handling promises
 * - fetch() API for HTTP requests
 * - Error handling with try/catch
 * - JSON parsing
 * - Backend vs Frontend architecture
 * 
 * @param apiBaseUrl - The base URL for the API (like "http://localhost:3001/api")
 * @returns Promise with Plex statistics or null on error
 */
export const fetchPlexStats = async (apiBaseUrl: string): Promise<PlexStatsResponse | null> => {
  try {
    // Make HTTP request to our backend API
    const response = await fetch(`${apiBaseUrl}/plex/stats`)
    
    // Check if the request was successful (status 200-299)
    if (!response.ok) {
      throw new Error(`Failed to fetch Plex stats: ${response.status} ${response.statusText}`)
    }
    
    // Convert the response from JSON string to JavaScript object
    return await response.json()
  } catch (error) {
    // If anything goes wrong, log it and return null
    // This prevents the whole app from crashing if Plex is down
    console.error('Error fetching Plex stats:', error)
    return null
  }
}

/**
 * Searches for movies in the Plex library
 * 
 * PURPOSE: When you ask "Do I have The Matrix?", this function searches all your
 * movie libraries to find matches.
 * 
 * HOW THE SEARCH WORKS:
 * 1. Sends movie title to our backend API
 * 2. Backend searches ALL movie libraries in your Plex server
 * 3. Returns list of matching movies with their details
 * 
 * STUDENT NOTE: Notice the encodeURIComponent() function - this is important!
 * It converts special characters in movie titles so they work in URLs.
 * Example: "Spider-Man: No Way Home" becomes "Spider-Man%3A%20No%20Way%20Home"
 * 
 * @param movieTitle - The movie title to search for
 * @param apiBaseUrl - The base URL for the API
 * @returns Promise with matching movies or null on error
 */
export const searchPlexMovies = async (movieTitle: string, apiBaseUrl: string): Promise<PlexMovieSearchResponse | null> => {
  try {
    // Encode the movie title to be URL-safe (handles spaces, special characters, etc.)
    const response = await fetch(`${apiBaseUrl}/plex/search?query=${encodeURIComponent(movieTitle)}&type=movie`)
    
    if (!response.ok) {
      throw new Error(`Failed to search Plex movies: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error searching Plex movies:', error)
    return null
  }
}

/**
 * Fetches detailed movie information from external sources (OMDb API)
 * 
 * WHAT THIS DOES:
 * While Plex tells us IF you have a movie, this function gets rich details about
 * the movie itself - plot, cast, director, ratings, etc.
 * 
 * DATA FLOW:
 * User asks "Tell me about The Matrix" →
 * This function calls our backend →
 * Backend calls OMDb API (movie database) →
 * Returns detailed movie information
 * 
 * LEARNING CONCEPTS:
 * - Optional parameters (year?: number)
 * - Default parameter values
 * - Environment detection (window object exists in browser, not in Node.js)
 * - URL construction with query parameters
 * 
 * @param movieTitle - The movie title
 * @param year - Optional year for better matching (helps with remakes)
 * @param apiBaseUrl - The base URL for the API
 * @returns Promise with movie details or null on error
 */
export const fetchMovieDetails = async (movieTitle: string, year?: number, apiBaseUrl?: string): Promise<MovieDetails | null> => {
  try {
    // Figure out the base URL - use provided one, or detect from environment
    // This handles both development (localhost) and production scenarios
    const baseUrl = apiBaseUrl || (typeof window !== 'undefined' && window.location ? 
      `${window.location.origin}/api` : 'http://localhost:3001/api')
    
    // Build the URL with the movie title
    let url = `${baseUrl}/movie/details?title=${encodeURIComponent(movieTitle)}`
    
    // Add year if provided (helps distinguish between original and remake)
    if (year) {
      url += `&year=${year}`
    }
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch movie details: ${response.status} ${response.statusText}`)
    }
    
    return await response.json()
  } catch (error) {
    console.error('Error fetching movie details:', error)
    return null
  }
}

/**
 * Creates a Plex playlist with specified movies
 * 
 * WHAT THIS DOES:
 * 1. Searches for movies matching the criteria
 * 2. Creates a new playlist in Plex
 * 3. Adds found movies to the playlist in specified order
 * 4. Returns confirmation with details
 * 
 * EXAMPLE USAGE:
 * await createPlexPlaylist("Iron Man", "MCU Iron Man Movies", "chronological", apiBaseUrl)
 * 
 * LEARNING CONCEPTS:
 * - API integration for create operations (not just read)
 * - Data transformation and sorting
 * - User confirmation and feedback
 * - Error handling for complex operations
 * 
 * @param searchTerm - What to search for (e.g., "Iron Man")
 * @param playlistName - Name for the new playlist
 * @param orderBy - How to order the movies
 * @param apiBaseUrl - API endpoint
 * @returns Promise with playlist creation result
 */
export const createPlexPlaylist = async (
  searchTerm: string,
  playlistName: string,
  orderBy: 'chronological' | 'alphabetical' | 'release' | 'none',
  apiBaseUrl: string
): Promise<{
  success: boolean
  message: string
  playlistId?: string
  moviesAdded: number
  movieTitles: string[]
}> => {
  try {
    // Step 1: Search for movies matching the criteria
    console.log(`🎬 Searching for movies matching: "${searchTerm}"`)
    const searchResponse = await searchPlexMovies(searchTerm, apiBaseUrl)
    
    if (!searchResponse || !searchResponse.movies || searchResponse.movies.length === 0) {
      return {
        success: false,
        message: `No movies found matching "${searchTerm}". Please check the spelling or try a different search term.`,
        moviesAdded: 0,
        movieTitles: []
      }
    }

    let movies = searchResponse.movies
    
    // Step 2: Sort movies based on user preference
    switch (orderBy) {
      case 'alphabetical':
        movies = movies.sort((a, b) => a.title.localeCompare(b.title))
        break
      case 'release':
      case 'chronological':
        movies = movies.sort((a, b) => (a.year || 0) - (b.year || 0))
        break
      case 'none':
      default:
        // Keep original order from search
        break
    }

    // Step 3: Create the playlist
    console.log(`📝 Creating playlist: "${playlistName}"`)
    const createResponse = await fetch(`${apiBaseUrl}/plex/playlists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: playlistName,
        type: 'video'
      })
    })

    if (!createResponse.ok) {
      throw new Error(`Failed to create playlist: ${createResponse.status}`)
    }

    const playlistData = await createResponse.json()
    const playlistId = playlistData.MediaContainer?.Metadata?.[0]?.ratingKey

    if (!playlistId) {
      throw new Error('Created playlist but could not get playlist ID')
    }

    // Step 4: Add movies to the playlist
    console.log(`➕ Adding ${movies.length} movies to playlist`)
    const movieKeys = movies.map(movie => movie.key).filter(key => key)
    
    if (movieKeys.length === 0) {
      return {
        success: false,
        message: 'Found movies but could not get their IDs for playlist creation.',
        moviesAdded: 0,
        movieTitles: []
      }
    }

    // Create URI string for multiple movies
    const uri = movieKeys.map(key => `server://your-plex-server/com.plexapp.plugins.library/library/metadata/${key}`).join(',')

    const addResponse = await fetch(`${apiBaseUrl}/plex/playlists/${playlistId}/items`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ uri })
    })

    if (!addResponse.ok) {
      throw new Error(`Failed to add movies to playlist: ${addResponse.status}`)
    }

    const movieTitles = movies.map(movie => movie.title)
    
    return {
      success: true,
      message: `Successfully created playlist "${playlistName}" with ${movies.length} movies!`,
      playlistId,
      moviesAdded: movies.length,
      movieTitles
    }

  } catch (error) {
    console.error('❌ Playlist creation error:', error)
    return {
      success: false,
      message: `Failed to create playlist: ${error instanceof Error ? error.message : 'Unknown error'}`,
      moviesAdded: 0,
      movieTitles: []
    }
  }
}

// ================================================================================================
// TEXT PARSING FUNCTIONS - These extract information from user questions
// ================================================================================================

/**
 * Extracts movie title from a question using pattern matching
 * 
 * WHY THIS IS NEEDED:
 * Users ask questions in many different ways:
 * - "Tell me about The Matrix"
 * - "Do I have Spider-Man?"
 * - "Is 'The Dark Knight' in my library?"
 * 
 * This function finds the movie title no matter how they ask.
 * 
 * HOW REGULAR EXPRESSIONS WORK:
 * Regular expressions (regex) are patterns that match text. Think of them like
 * super-powered search patterns that can find flexible matches.
 * 
 * REGEX BREAKDOWN (for students):
 * /tell me (?:more )?about (?:the movie )?["']?([^"'?]+)["']?/i
 * 
 * - /.../ = regex boundaries
 * - (?:...) = non-capturing group (matches but doesn't save)
 * - ? = means "optional" (zero or one occurrence)
 * - ["']? = optional quote marks
 * - ([^"'?]+) = capturing group - this is what we want to extract
 * - [^"'?] = any character EXCEPT quotes or question marks
 * - + = one or more characters
 * - /i = case insensitive flag
 * 
 * @param question - The user's question
 * @returns Extracted movie title or null if not found
 */
const extractMovieTitleFromQuestion = (question: string): string | null => {
  // Pattern matching for common movie question formats
  // Each pattern captures the movie title in parentheses ()
  const patterns = [
    // "Tell me about The Matrix" or "Tell me more about the movie The Matrix"
    /tell me (?:more )?about (?:the movie )?["']?([^"'?]+)["']?/i,
    
    // "Who are the actors in The Matrix?" or "Who stars in the movie The Matrix?"
    /who (?:are the actors|stars) in (?:the movie )?["']?([^"'?]+)["']?/i,
    
    // "What is The Matrix about?" or "What's the movie The Matrix about?"
    /what (?:is|'s) (?:the movie )?["']?([^"'?]+)["']? about/i,
    
    // "Cast of The Matrix" or "Director for the movie The Matrix"
    /(?:cast|plot|story|director) (?:of|for) (?:the movie )?["']?([^"'?]+)["']?/i,
    
    // "'The Matrix' movie" or "The Matrix film"
    /["']([^"']+)["'] (?:movie|film)/i,
    
    // Patterns for existence questions
    // "Do I have The Matrix?" or "Do you have the movie The Matrix?"
    /do (?:i|you) have (?:the movie )?["']?([^"'?]+)["']?/i,
    
    // "Is The Matrix in my library?" or "Is the movie The Matrix in your collection?"
    /is (?:the movie )?["']?([^"'?]+)["']? in (?:my|your|the)/i,
    
    // "Check if The Matrix exists" or "Check if the movie The Matrix is available"
    /check if (?:the movie )?["']?([^"'?]+)["']? (?:is|exists)/i,
    
    // "Is The Matrix available?" or "Does the movie The Matrix exist?"
    /(?:is|does) (?:the movie )?["']?([^"'?]+)["']? (?:available|exist)/i
  ]
  
  // Try each pattern until we find a match
  for (const pattern of patterns) {
    const match = question.match(pattern)
    
    // If we found a match, the captured group is in match[1]
    if (match && match[1]) {
      return match[1].trim()  // Remove any extra whitespace
    }
  }
  
  // No movie title found in the question
  return null
}

// ================================================================================================
// MAIN CONTEXT GENERATION - This is the "brain" of the Plex Agent
// ================================================================================================

/**
 * Generates enriched context for Plex-related questions
 * 
 * THIS IS THE MOST IMPORTANT FUNCTION - Here's what it does:
 * 
 * 1. ANALYZES the user's question to understand what they want
 * 2. FETCHES real-time data from your Plex server
 * 3. COMBINES that data with movie details from external sources
 * 4. CREATES a detailed context string that gets sent to Azure OpenAI
 * 5. The AI uses this context to give you accurate, personalized answers
 * 
 * EXAMPLE WORKFLOW:
 * User asks: "Tell me about The Matrix"
 * 1. Function detects it's a movie detail question
 * 2. Extracts "The Matrix" as the movie title
 * 3. Fetches detailed info from movie database (plot, cast, etc.)
 * 4. Gets your Plex library info (which libraries you have)
 * 5. Creates rich context combining all this info
 * 6. AI gets this context and can answer with your specific library details
 * 
 * LEARNING CONCEPTS DEMONSTRATED:
 * - String manipulation and concatenation
 * - Conditional logic (if/else statements)
 * - Array methods (filter, find, forEach, reduce)
 * - Async programming (multiple API calls)
 * - Data aggregation and analysis
 * - Context building for AI systems
 * 
 * @param question - The user's question
 * @param apiBaseUrl - The base URL for the API
 * @returns Promise with enriched context string
 */
export const generatePlexContext = async (question: string, apiBaseUrl: string): Promise<string> => {
  // Convert question to lowercase for easier matching
  const lowerQuestion = question.toLowerCase()
  
  // Start building our context string - this will be sent to the AI
  let context = `\n\nYou have access to the user's Plex media library data. Here's the information:\n`
  
  try {
    // ============================================================================================
    // STEP 1: Handle Movie Detail Questions (like "Tell me about The Matrix")
    // ============================================================================================
    
    // Check if this is a movie detail question
    if (isMovieDetailQuestion(question)) {
      // Try to extract the movie title from the question
      const movieTitle = extractMovieTitleFromQuestion(question)
      
      if (movieTitle) {
        console.log(`🎬 Detected movie detail request for: "${movieTitle}"`)
        
        // Try to fetch detailed movie information from external database
        const movieDetails = await fetchMovieDetails(movieTitle, undefined, apiBaseUrl)
        
        if (movieDetails) {
          // SUCCESS: We got detailed movie info, add it to our context
          context += `\n🎬 DETAILED MOVIE INFORMATION for "${movieDetails.title}" (${movieDetails.year}):\n`
          context += `📅 Released: ${movieDetails.released}\n`
          context += `⏱️ Runtime: ${movieDetails.runtime}\n`
          context += `🎭 Genre: ${movieDetails.genre}\n`
          context += `🎬 Director: ${movieDetails.director}\n`
          context += `✍️ Writer: ${movieDetails.writer}\n`
          context += `🌟 Main Cast: ${movieDetails.actors}\n`
          context += `📖 Plot: ${movieDetails.plot}\n`
          context += `🏆 Awards: ${movieDetails.awards}\n`
          context += `⭐ IMDb Rating: ${movieDetails.imdbRating}/10 (${movieDetails.imdbVotes} votes)\n`
          context += `🎫 Rated: ${movieDetails.rated}\n`
          context += `🌍 Country: ${movieDetails.country}\n`
          context += `🗣️ Language: ${movieDetails.language}\n`
          
          // Add optional information if available
          if (movieDetails.boxOffice) {
            context += `💰 Box Office: ${movieDetails.boxOffice}\n`
          }
          if (movieDetails.production) {
            context += `🏢 Production: ${movieDetails.production}\n`
          }
          
          context += `\nThis detailed information was fetched from external movie databases to provide comprehensive details about the movie.\n`
          context += `Please use this rich information to answer the user's question about "${movieTitle}".\n\n`
        } else {
          // FAILURE: Couldn't get movie details, but that's okay
          context += `\n⚠️ Could not fetch detailed information for "${movieTitle}" from external sources.\n`
        }
      }
    }
    
    // ============================================================================================
    // STEP 1.5: Handle Playlist Creation Requests
    // ============================================================================================
    
    // Check if this is a playlist creation request
    if (isPlaylistCreationRequest(question)) {
      console.log(`📝 Detected playlist creation request`)
      
      // Extract playlist details from the question
      const playlistDetails = extractPlaylistDetails(question)
      
      if (playlistDetails.searchTerm) {
        console.log(`🔍 Creating playlist: "${playlistDetails.playlistName}" with search term: "${playlistDetails.searchTerm}"`)
        
        // Create confirmation message for user
        const confirmationMessage = `
🎵 PLAYLIST CREATION REQUEST DETECTED

I can help you create a Plex playlist with the following details:
📝 Playlist Name: "${playlistDetails.playlistName}"
🔍 Search Term: "${playlistDetails.searchTerm}"
📋 Order: ${playlistDetails.orderBy}

To proceed with creating this playlist, I need your confirmation.
Would you like me to:

1. Search your Plex library for movies matching "${playlistDetails.searchTerm}"
2. Create a new playlist called "${playlistDetails.playlistName}"
3. Add the found movies in ${playlistDetails.orderBy === 'none' ? 'default' : playlistDetails.orderBy} order

Please respond with "Yes, create the playlist" to proceed, or let me know if you'd like to modify any details.

Note: This will actually create a playlist in your Plex server. The playlist will appear in all your Plex apps and can be accessed by other users with access to your server.
`
        
        context += confirmationMessage
        return context
      } else {
        context += `\n⚠️ I detected a playlist creation request, but couldn't determine what movies to include. Please specify what you'd like in the playlist (e.g., "Create a playlist of Marvel movies" or "Make a playlist with all Batman films").\n`
        return context
      }
    }
    
    // ============================================================================================
    // STEP 2: Get Plex Library Information
    // ============================================================================================
    
    // Fetch the current state of the user's Plex libraries
    const plexData = await fetchPlexStats(apiBaseUrl)
    
    // If we can't get library data, return early with error message
    if (!plexData || !plexData.libraries) {
      return context + `- Unable to fetch library data at this time. Please try again later.\n`
    }
    
    // Extract the libraries array for easier use
    const libraries = plexData.libraries
    
    // ============================================================================================
    // STEP 3: List All Available Libraries
    // ============================================================================================
    
    // Show the user what libraries they have
    context += `\nAvailable libraries:\n`
    libraries.forEach((lib) => {
      if (lib.error) {
        context += `- "${lib.title}" (${lib.type}): Error fetching count\n`
      } else {
        context += `- "${lib.title}" (${lib.type}): ${lib.count} items\n`
      }
    })
    
    // ============================================================================================
    // STEP 4: Handle Specific Library Mentions
    // ============================================================================================
    
    // Check if the user mentioned a specific library by name
    // Example: "How many movies are in my 4K Movies library?"
    const matchedLibrary = libraries.find((lib) => 
      lowerQuestion.includes(lib.title.toLowerCase())
    )
    
    if (matchedLibrary) {
      // User asked about a specific library, provide detailed info
      context += `\nRequested library "${matchedLibrary.title}":\n`
      context += `- Type: ${matchedLibrary.type}\n`
      if (matchedLibrary.error) {
        context += `- Status: Error fetching data\n`
      } else {
        context += `- Total items: ${matchedLibrary.count}\n`
      }
    }
    
    // ============================================================================================
    // STEP 5: Calculate Total Counts by Media Type
    // ============================================================================================
    
    // LEARNING NOTE: Here we use Array.filter() and Array.reduce() - powerful methods!
    
    // Calculate total movies across all movie libraries
    // filter() creates a new array with only movie libraries
    // reduce() adds up all the counts
    const totalMovies = libraries
      .filter((lib) => lib.type === 'movie')           // Only movie libraries
      .reduce((sum, lib) => sum + (lib.count || 0), 0) // Add up all counts
    
    // Same process for TV shows
    const totalShows = libraries
      .filter((lib) => lib.type === 'show')
      .reduce((sum, lib) => sum + (lib.count || 0), 0)
    
    // Same process for music (artists)
    const totalMusic = libraries
      .filter((lib) => lib.type === 'artist')
      .reduce((sum, lib) => sum + (lib.count || 0), 0)
    
    // Add summary totals to the context
    context += `\nTotal across all libraries:\n`
    if (totalMovies > 0) context += `- Movies: ${totalMovies}\n`
    if (totalShows > 0) context += `- TV Shows: ${totalShows}\n`
    if (totalMusic > 0) context += `- Music Artists: ${totalMusic}\n`
    
    // ============================================================================================
    // STEP 6: Handle Comparison Questions
    // ============================================================================================
    
    // Check if user is asking comparison questions like "Which library has more movies?"
    if (lowerQuestion.includes('more') || lowerQuestion.includes('compare')) {
      context += `\nNote: You can compare library counts to answer "which has more" questions.\n`
    }
    
    // ============================================================================================
    // STEP 7: Handle Movie Existence Questions (THE NEW IMPROVED LOGIC!)
    // ============================================================================================
    
    // This is the main improvement - smart prioritization for movie searches
    if (lowerQuestion.includes('do i have') || lowerQuestion.includes('do you have') || 
        lowerQuestion.includes('is ') || lowerQuestion.includes('check if') ||
        lowerQuestion.includes('exist') || lowerQuestion.includes('available') ||
        lowerQuestion.includes('in my librar')) {
      
      // Extract movie title if this is a movie existence question
      const movieTitle = extractMovieTitleFromQuestion(question)
      
      // Check if a specific library is mentioned in the question
      const mentionedLibrary = libraries.find((lib) => 
        lowerQuestion.includes(lib.title.toLowerCase())
      )
      
      if (mentionedLibrary) {
        // CASE 1: User mentioned a specific library
        // Example: "Do I have The Matrix in my 4K Movies library?"
        context += `\nNote: The user is asking about the "${mentionedLibrary.title}" library specifically. Check that library first.\n`
      } else if (movieTitle && (lowerQuestion.includes('movie') || lowerQuestion.includes('film'))) {
        // CASE 2: Movie question without specific library - prioritize "All Movies"
        // Example: "Do I have The Matrix?"
        
        const allMoviesLibrary = libraries.find((lib) => 
          lib.title.toLowerCase() === 'all movies'
        )
        
        if (allMoviesLibrary) {
          context += `\n🎬 MOVIE SEARCH PRIORITY for "${movieTitle}":\n`
          context += `Primary library to check: "All Movies" (${allMoviesLibrary.count} items) - This contains the most comprehensive movie collection.\n`
          context += `If not found in "All Movies", then check other movie libraries in this order:\n`
          
          // List other movie libraries as alternatives
          const otherMovieLibs = libraries.filter((lib) => 
            lib.type === 'movie' && lib.title.toLowerCase() !== 'all movies'
          )
          
          otherMovieLibs.forEach((lib, index) => {
            context += `${index + 1}. "${lib.title}" (${lib.count || 0} items)\n`
          })
          
          context += `\nWhen searching, be specific about which library contains the movie if found.\n`
        } else {
          // Fallback if "All Movies" library doesn't exist
          context += `\nNote: For movie existence questions, check the available movie libraries in the list above.\n`
        }
      } else {
        // CASE 3: General existence question (not specifically about movies)
        context += `\nNote: Check if the requested item exists in the available libraries list above.\n`
      }
    }
    
    // ============================================================================================
    // STEP 8: Final Instructions for the AI
    // ============================================================================================
    
    // This tells the AI how to use all the context we've provided
    context += `\nPlease answer the user's question using this Plex library data. Be specific with library names and counts. If a library doesn't exist, suggest available alternatives from the list above.`
    
  } catch (error) {
    // ============================================================================================
    // ERROR HANDLING
    // ============================================================================================
    
    // If anything goes wrong in this function, we don't want to crash the whole app
    // Instead, we provide a helpful error message in the context
    console.error('Error generating Plex context:', error)
    context += `- Error fetching library information: ${error instanceof Error ? error.message : 'Unknown error'}\n`
  }
  
  // Return the complete context string that will be sent to Azure OpenAI
  return context
}

// ================================================================================================
// MAIN ENTRY POINT - This is what other parts of the app call
// ================================================================================================

/**
 * Main entry point for the Plex Agent
 * 
 * THIS IS THE FUNCTION THAT GETS CALLED from ChatApp.tsx when you send a message
 * 
 * WORKFLOW:
 * 1. ChatApp.tsx calls this function with your question
 * 2. This function checks if it's Plex-related
 * 3. If yes, it enriches the question with context
 * 4. If no, it returns the original question unchanged
 * 5. The (possibly enriched) question goes to Azure OpenAI
 * 
 * LEARNING CONCEPTS:
 * - Function composition (calling other functions)
 * - Conditional execution (only do work if needed)
 * - Promise handling with async/await
 * 
 * @param question - The user's question
 * @param apiBaseUrl - The base URL for the API
 * @returns Promise with enriched question or original question if not Plex-related
 */
export const handlePlexQuestion = async (question: string, apiBaseUrl: string): Promise<string> => {
  // First, check if this is even a Plex-related question
  // No point in doing expensive API calls if the user is asking about weather!
  if (!isPlexQuestion(question)) {
    return question  // Return unchanged - not about Plex
  }
  
  // It IS a Plex question, so let's enrich it with context
  const plexContext = await generatePlexContext(question, apiBaseUrl)
  
  // Combine the original question with our enriched context
  // The AI will receive both the question AND all the library information
  return question + plexContext
}

/**
 * Handles playlist creation confirmation and execution
 * 
 * WHAT THIS DOES:
 * When a user confirms they want to create a playlist, this function:
 * 1. Detects confirmation responses
 * 2. Retrieves the previous playlist request details
 * 3. Actually creates the playlist
 * 4. Returns status and results
 * 
 * CONFIRMATION PATTERNS:
 * - "Yes, create the playlist"
 * - "Yes" (if in playlist context)
 * - "Create it"
 * - "Make the playlist"
 * 
 * @param question - User's response
 * @param previousContext - Previous conversation context with playlist details
 * @param apiBaseUrl - API endpoint
 * @returns Promise with execution result
 */
export const executePlaylistCreation = async (
  question: string,
  searchTerm: string,
  playlistName: string,
  orderBy: 'chronological' | 'alphabetical' | 'release' | 'none',
  apiBaseUrl: string
): Promise<string> => {
  const lowerQuestion = question.toLowerCase()
  
  // Check if user is confirming playlist creation
  const confirmationPatterns = [
    'yes, create the playlist',
    'yes create',
    'create it',
    'make the playlist',
    'go ahead',
    'proceed',
    'do it',
    /^yes[,.]?\s*(please)?$/
  ]
  
  const isConfirmation = confirmationPatterns.some(pattern => {
    if (typeof pattern === 'string') {
      return lowerQuestion.includes(pattern)
    } else {
      return pattern.test(lowerQuestion)
    }
  })
  
  if (isConfirmation) {
    console.log(`✅ User confirmed playlist creation`)
    
    // Actually create the playlist
    const result = await createPlexPlaylist(searchTerm, playlistName, orderBy, apiBaseUrl)
    
    if (result.success) {
      return `
🎉 SUCCESS! Playlist Created Successfully!

📝 Playlist Name: "${playlistName}"
🎬 Movies Added: ${result.moviesAdded}
📋 Order: ${orderBy === 'none' ? 'Default' : orderBy}

🍿 Movies in your playlist:
${result.movieTitles.map((title, index) => `${index + 1}. ${title}`).join('\n')}

✅ The playlist has been added to your Plex server and should be visible in all your Plex apps shortly.

You can find it in the "Playlists" section of your Plex library. Enjoy your curated movie collection! 🎬
`
    } else {
      return `
❌ Playlist Creation Failed

${result.message}

You can try:
- Checking the spelling of the search term
- Using a broader search term (e.g., "Marvel" instead of "Marvel Cinematic Universe")
- Making sure you have movies matching the criteria in your Plex library

Would you like to try again with different criteria?
`
    }
  } else {
    return `
🤔 I didn't understand your response.

To create the playlist, please respond with:
- "Yes, create the playlist"
- "Yes"
- "Create it"

To cancel or modify the request, just let me know what you'd like to change.
`
  }
}

// ================================================================================================
// EXPORTS - Making functions available to other files
// ================================================================================================

/**
 * Default export object - this allows other files to import these functions
 * 
 * LEARNING NOTE: There are two ways to export in JavaScript/TypeScript:
 * 1. Named exports (export const functionName = ...)
 * 2. Default export (export default { ... })
 * 
 * We use both here for maximum flexibility
 */
export default {
  isPlexQuestion,
  isMovieDetailQuestion,
  isPlaylistCreationRequest,
  extractPlaylistDetails,
  createPlexPlaylist,
  executePlaylistCreation,
  fetchPlexStats,
  searchPlexMovies,
  fetchMovieDetails,
  generatePlexContext,
  handlePlexQuestion
}
