/**
 * Plex Agent - Handles Plex media library queries and context generation
 * 
 * This agent detects questions about Plex libraries, fetches real-time data,
 * and generates enriched context for Azure OpenAI to provide accurate answers.
 */

export interface PlexLibrary {
  key: string
  title: string
  type: string
  count: number
  uuid: string
  error?: string
}

export interface PlexStatsResponse {
  libraries: PlexLibrary[]
}

export interface MovieDetails {
  title: string
  year: string
  rated: string
  released: string
  runtime: string
  genre: string
  director: string
  writer: string
  actors: string
  plot: string
  language: string
  country: string
  awards: string
  poster: string
  imdbRating: string
  imdbVotes: string
  boxOffice?: string
  production?: string
}

export interface PlexMovieSearchResponse {
  movies: Array<{
    title: string
    year: number
    key: string
    guid: string
  }>
}

/**
 * Detects if a question is related to Plex media libraries
 * @param question - The user's question
 * @returns true if the question contains Plex-related keywords
 */
export const isPlexQuestion = (question: string): boolean => {
  const plexKeywords = [
    'library', 'libraries', 'plex', 'movie', 'movies', 'show', 'shows', 'tv', 'media',
    '4k', 'halloween', 'anime', 'collection', 'watch', 'watching', 'film', 'films',
    '3d', 'section', 'sections'
  ]
  
  const lowerQuestion = question.toLowerCase()
  return plexKeywords.some(keyword => lowerQuestion.includes(keyword))
}

/**
 * Detects if a question is asking for detailed movie information
 * @param question - The user's question
 * @returns true if the question asks for movie details, cast, plot, etc.
 */
export const isMovieDetailQuestion = (question: string): boolean => {
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
 * Fetches Plex library statistics from the backend API
 * @param apiBaseUrl - The base URL for the API
 * @returns Promise with Plex statistics or null on error
 */
export const fetchPlexStats = async (apiBaseUrl: string): Promise<PlexStatsResponse | null> => {
  try {
    const response = await fetch(`${apiBaseUrl}/plex/stats`)
    if (!response.ok) {
      throw new Error(`Failed to fetch Plex stats: ${response.status} ${response.statusText}`)
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching Plex stats:', error)
    return null
  }
}

/**
 * Searches for movies in the Plex library
 * @param movieTitle - The movie title to search for
 * @param apiBaseUrl - The base URL for the API
 * @returns Promise with matching movies or null on error
 */
export const searchPlexMovies = async (movieTitle: string, apiBaseUrl: string): Promise<PlexMovieSearchResponse | null> => {
  try {
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
 * @param movieTitle - The movie title
 * @param year - Optional year for better matching
 * @param apiBaseUrl - The base URL for the API
 * @returns Promise with movie details or null on error
 */
export const fetchMovieDetails = async (movieTitle: string, year?: number, apiBaseUrl?: string): Promise<MovieDetails | null> => {
  try {
    const baseUrl = apiBaseUrl || (typeof window !== 'undefined' && window.location ? 
      `${window.location.origin}/api` : 'http://localhost:3001/api')
    
    let url = `${baseUrl}/movie/details?title=${encodeURIComponent(movieTitle)}`
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
 * Extracts movie title from a question
 * @param question - The user's question
 * @returns Extracted movie title or null if not found
 */
const extractMovieTitleFromQuestion = (question: string): string | null => {
  const lowerQuestion = question.toLowerCase()
  
  // Pattern matching for common movie question formats
  const patterns = [
    /tell me (?:more )?about (?:the movie )?["']?([^"'?]+)["']?/i,
    /who (?:are the actors|stars) in (?:the movie )?["']?([^"'?]+)["']?/i,
    /what (?:is|'s) (?:the movie )?["']?([^"'?]+)["']? about/i,
    /(?:cast|plot|story|director) (?:of|for) (?:the movie )?["']?([^"'?]+)["']?/i,
    /["']([^"']+)["'] (?:movie|film)/i
  ]
  
  for (const pattern of patterns) {
    const match = question.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  
  return null
}

/**
 * Generates enriched context for Plex-related questions
 * This context is appended to the user's question before sending to Azure OpenAI
 * 
 * @param question - The user's question
 * @param apiBaseUrl - The base URL for the API
 * @returns Promise with enriched context string
 */
export const generatePlexContext = async (question: string, apiBaseUrl: string): Promise<string> => {
  const lowerQuestion = question.toLowerCase()
  let context = `\n\nYou have access to the user's Plex media library data. Here's the information:\n`
  
  try {
    // Check if this is a movie detail question
    if (isMovieDetailQuestion(question)) {
      const movieTitle = extractMovieTitleFromQuestion(question)
      
      if (movieTitle) {
        console.log(`🎬 Detected movie detail request for: "${movieTitle}"`)
        
        // Try to fetch detailed movie information
        const movieDetails = await fetchMovieDetails(movieTitle, undefined, apiBaseUrl)
        
        if (movieDetails) {
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
          
          if (movieDetails.boxOffice) {
            context += `💰 Box Office: ${movieDetails.boxOffice}\n`
          }
          if (movieDetails.production) {
            context += `🏢 Production: ${movieDetails.production}\n`
          }
          
          context += `\nThis detailed information was fetched from external movie databases to provide comprehensive details about the movie.\n`
          context += `Please use this rich information to answer the user's question about "${movieTitle}".\n\n`
        } else {
          context += `\n⚠️ Could not fetch detailed information for "${movieTitle}" from external sources.\n`
        }
      }
    }
    
    const plexData = await fetchPlexStats(apiBaseUrl)
    
    if (!plexData || !plexData.libraries) {
      return context + `- Unable to fetch library data at this time. Please try again later.\n`
    }
    
    const libraries = plexData.libraries
    
    // List all available libraries
    context += `\nAvailable libraries:\n`
    libraries.forEach((lib) => {
      if (lib.error) {
        context += `- "${lib.title}" (${lib.type}): Error fetching count\n`
      } else {
        context += `- "${lib.title}" (${lib.type}): ${lib.count} items\n`
      }
    })
    
    // Check for specific library mentions
    const matchedLibrary = libraries.find((lib) => 
      lowerQuestion.includes(lib.title.toLowerCase())
    )
    
    if (matchedLibrary) {
      context += `\nRequested library "${matchedLibrary.title}":\n`
      context += `- Type: ${matchedLibrary.type}\n`
      if (matchedLibrary.error) {
        context += `- Status: Error fetching data\n`
      } else {
        context += `- Total items: ${matchedLibrary.count}\n`
      }
    }
    
    // Calculate total counts by type
    const totalMovies = libraries
      .filter((lib) => lib.type === 'movie')
      .reduce((sum, lib) => sum + (lib.count || 0), 0)
    
    const totalShows = libraries
      .filter((lib) => lib.type === 'show')
      .reduce((sum, lib) => sum + (lib.count || 0), 0)
    
    const totalMusic = libraries
      .filter((lib) => lib.type === 'artist')
      .reduce((sum, lib) => sum + (lib.count || 0), 0)
    
    context += `\nTotal across all libraries:\n`
    if (totalMovies > 0) context += `- Movies: ${totalMovies}\n`
    if (totalShows > 0) context += `- TV Shows: ${totalShows}\n`
    if (totalMusic > 0) context += `- Music Artists: ${totalMusic}\n`
    
    // Check for comparison questions
    if (lowerQuestion.includes('more') || lowerQuestion.includes('compare')) {
      context += `\nNote: You can compare library counts to answer "which has more" questions.\n`
    }
    
    // Check for "do I have" or existence questions
    if (lowerQuestion.includes('do i have') || lowerQuestion.includes('do you have')) {
      context += `\nNote: Check if the requested library exists in the available libraries list above.\n`
    }
    
    context += `\nPlease answer the user's question using this Plex library data. Be specific with library names and counts. If a library doesn't exist, suggest available alternatives from the list above.`
    
  } catch (error) {
    console.error('Error generating Plex context:', error)
    context += `- Error fetching library information: ${error instanceof Error ? error.message : 'Unknown error'}\n`
  }
  
  return context
}

/**
 * Main entry point for the Plex Agent
 * Call this function to check if a question is Plex-related and get enriched context
 * 
 * @param question - The user's question
 * @param apiBaseUrl - The base URL for the API
 * @returns Promise with enriched question or original question if not Plex-related
 */
export const handlePlexQuestion = async (question: string, apiBaseUrl: string): Promise<string> => {
  if (!isPlexQuestion(question)) {
    return question
  }
  
  const plexContext = await generatePlexContext(question, apiBaseUrl)
  return question + plexContext
}

export default {
  isPlexQuestion,
  isMovieDetailQuestion,
  fetchPlexStats,
  searchPlexMovies,
  fetchMovieDetails,
  generatePlexContext,
  handlePlexQuestion
}
