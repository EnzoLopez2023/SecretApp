/**
 * PlaylistCreator.tsx - Intelligent Plex Playlist Creation Tool
 * 
 * WHAT THIS COMPONENT DOES:
 * 1. 🤖 Uses Azure OpenAI to search the internet for movie collections
 * 2. 🎬 Searches Plex server for matching movies with fallback logic
 * 3. 📝 Displays real-time log of all operations
 * 4. 🎭 Creates creative playlist titles
 * 5. 📋 Creates and populates Plex playlists automatically
 */

import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Fade,
  Zoom
} from '@mui/material'
import {
  Search as SearchIcon,
  PlaylistAdd as PlaylistAddIcon,
  Movie as MovieIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Info as InfoIcon
} from '@mui/icons-material'

// Types for our data structures
interface MovieInfo {
  title: string
  year: number
  director?: string
}

interface PlexMovie {
  title: string
  year: number
  key: string
  guid: string
  ratingKey: string
  section: string
}

interface LogEntry {
  id: number
  timestamp: string
  message: string
  type: 'info' | 'success' | 'error' | 'warning'
}

type WorkflowStep = 'search' | 'process' | 'verify' | 'create' | 'complete'

export default function PlaylistCreator() {
  // ============================================================================================
  // STATE MANAGEMENT
  // ============================================================================================
  
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('search')
  const [movieList, setMovieList] = useState<MovieInfo[]>([])
  const [foundMovies, setFoundMovies] = useState<PlexMovie[]>([])
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [playlistTitle, setPlaylistTitle] = useState('')
  const [playlistId, setPlaylistId] = useState('')
  
  // Refs for auto-scrolling
  const logContainerRef = useRef<HTMLDivElement>(null)
  const logIdCounter = useRef(0)

  // ============================================================================================
  // LOGGING SYSTEM
  // ============================================================================================
  
  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const newLog: LogEntry = {
      id: ++logIdCounter.current,
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    }
    
    setLogs(prevLogs => {
      const updatedLogs = [...prevLogs, newLog]
      // Keep only the last 25 entries
      return updatedLogs.slice(-25)
    })
  }

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight
    }
  }, [logs])

  // ============================================================================================
  // API INTEGRATION FUNCTIONS
  // ============================================================================================

  // Step 1: Search for movie collection using Azure OpenAI
  const searchMovieCollection = async () => {
    if (!searchQuery.trim()) return
    
    setLoading(true)
    setCurrentStep('search')
    addLog(`🔍 Searching for "${searchQuery}" movie collection...`, 'info')
    
    try {
      console.log('🔍 Making request to search collection...')
      const response = await fetch('/api/playlist-creator/search-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery })
      })
      
      console.log('📡 Response received:', response.status, response.statusText)
      console.log('📡 Response headers:', response.headers)
      
      if (response.ok) {
        console.log('✅ Response is OK, parsing JSON...')
        const responseText = await response.text()
        console.log('📄 Raw response:', responseText)
        
        let data
        try {
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError)
          console.error('❌ Response text was:', responseText)
          throw new Error('Invalid JSON response from server')
        }
        
        if (data.movies && Array.isArray(data.movies)) {
          setMovieList(data.movies)
          addLog(`✅ Found ${data.movies.length} movies in the collection`, 'success')
          setCurrentStep('process')
        } else {
          addLog(`❌ Invalid response format: missing movies array`, 'error')
        }
      } else {
        // Handle error responses
        let errorMessage = `HTTP ${response.status}`
        try {
          const errorText = await response.text()
          console.log('❌ Error response text:', errorText)
          const errorData = JSON.parse(errorText)
          errorMessage = errorData.error || errorMessage
        } catch {
          // If JSON parsing fails, use the status text
          errorMessage = response.statusText || errorMessage
        }
        addLog(`❌ Error: ${errorMessage}`, 'error')
      }
    } catch (err) {
      console.error('❌ Full error object:', err)
      addLog(`❌ Network error: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Step 2-4: Process movies, search Plex, and verify
  const processMovies = async () => {
    if (movieList.length === 0) return
    
    setLoading(true)
    setCurrentStep('process')
    addLog('🎬 Starting to search for movies on Plex server...', 'info')
    
    try {
      const response = await fetch('/api/playlist-creator/process-movies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ movies: movieList })
      })
      
      if (!response.ok) {
        throw new Error('Failed to process movies')
      }
      
      // This endpoint will use Server-Sent Events for real-time updates
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error('No response body')
      
      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'log') {
                addLog(data.message, data.logType || 'info')
              } else if (data.type === 'movie_found') {
                setFoundMovies(prev => [...prev, data.movie])
              } else if (data.type === 'complete') {
                setCurrentStep('verify')
                addLog(`🎯 Successfully found ${data.totalFound} out of ${movieList.length} movies`, 'success')
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (err) {
      addLog(`❌ Error processing movies: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Step 5-7: Create playlist
  const createPlaylist = async () => {
    if (foundMovies.length === 0) return
    
    setLoading(true)
    setCurrentStep('create')
    addLog('🎭 Generating creative playlist title...', 'info')
    
    try {
      const response = await fetch('/api/playlist-creator/create-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          movies: foundMovies,
          originalQuery: searchQuery
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to create playlist')
      }
      
      // Similar SSE handling for playlist creation
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) throw new Error('No response body')
      
      let buffer = ''
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              
              if (data.type === 'log') {
                addLog(data.message, data.logType || 'info')
              } else if (data.type === 'title_generated') {
                setPlaylistTitle(data.title)
                addLog(`🎬 Generated title: "${data.title}"`, 'success')
              } else if (data.type === 'playlist_created') {
                setPlaylistId(data.playlistId)
                addLog(`📋 Playlist created with ID: ${data.playlistId}`, 'success')
              } else if (data.type === 'complete') {
                setCurrentStep('complete')
                setPlaylistTitle(data.title || playlistTitle)
                addLog(`🎉 Playlist "${data.title || playlistTitle}" created successfully with ${data.movieCount || foundMovies.length} movies!`, 'success')
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
    } catch (err) {
      addLog(`❌ Error creating playlist: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  // Reset function to start over
  const resetWorkflow = () => {
    setSearchQuery('')
    setCurrentStep('search')
    setMovieList([])
    setFoundMovies([])
    setLogs([])
    setPlaylistTitle('')
    setPlaylistId('')
    addLog('🔄 Workflow reset. Ready for new playlist creation!', 'info')
  }

  // ============================================================================================
  // HELPER FUNCTIONS
  // ============================================================================================
  
  const getLogIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'success': return <CheckCircleIcon sx={{ color: 'success.main', fontSize: 16 }} />
      case 'error': return <ErrorIcon sx={{ color: 'error.main', fontSize: 16 }} />
      case 'warning': return <ErrorIcon sx={{ color: 'warning.main', fontSize: 16 }} />
      default: return <InfoIcon sx={{ color: 'info.main', fontSize: 16 }} />
    }
  }

  const getStepColor = (step: WorkflowStep) => {
    const stepOrder = ['search', 'process', 'verify', 'create', 'complete']
    const currentIndex = stepOrder.indexOf(currentStep)
    const stepIndex = stepOrder.indexOf(step)
    
    if (stepIndex < currentIndex) return 'success'
    if (stepIndex === currentIndex) return 'primary'
    return 'default'
  }

  // ============================================================================================
  // RENDER COMPONENT
  // ============================================================================================
  
  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Paper elevation={2} sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PlaylistAddIcon sx={{ color: 'white', fontSize: 40 }} />
          <Box>
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
              Intelligent Playlist Creator
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'rgba(255,255,255,0.8)' }}>
              AI-powered movie collection discovery and Plex playlist generation
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Workflow Steps Indicator */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>Workflow Progress</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label="1. Search Collection" 
              color={getStepColor('search')}
              variant={currentStep === 'search' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="2. Process Movies" 
              color={getStepColor('process')}
              variant={currentStep === 'process' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="3. Verify Results" 
              color={getStepColor('verify')}
              variant={currentStep === 'verify' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="4. Create Playlist" 
              color={getStepColor('create')}
              variant={currentStep === 'create' ? 'filled' : 'outlined'}
            />
            <Chip 
              label="5. Complete!" 
              color={getStepColor('complete')}
              variant={currentStep === 'complete' ? 'filled' : 'outlined'}
            />
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Left Column - Main Interface */}
        <Box sx={{ flex: 1 }}>
          {/* Step 1: Search Input */}
          {currentStep === 'search' && (
            <Fade in timeout={500}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SearchIcon /> Search for Movie Collection
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Enter a movie collection or series name (e.g., "Mission Impossible", "Star Wars", "Marvel Cinematic Universe")
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      fullWidth
                      placeholder="Enter movie collection name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchMovieCollection()}
                      disabled={loading}
                    />
                    <Button
                      variant="contained"
                      onClick={searchMovieCollection}
                      disabled={loading || !searchQuery.trim()}
                      startIcon={<SearchIcon />}
                    >
                      Search
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Movie Collection Results */}
          {movieList.length > 0 && (
            <Zoom in timeout={500}>
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MovieIcon /> Found Movie Collection
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>#</strong></TableCell>
                          <TableCell><strong>Title</strong></TableCell>
                          <TableCell><strong>Year</strong></TableCell>
                          <TableCell><strong>Director</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {movieList.map((movie, index) => (
                          <TableRow key={index}>
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>{movie.title}</TableCell>
                            <TableCell>{movie.year}</TableCell>
                            <TableCell>{movie.director || 'N/A'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {currentStep === 'process' && (
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={processMovies}
                        disabled={loading}
                        size="large"
                      >
                        Continue - Search Plex Server
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Zoom>
          )}

          {/* Action Buttons */}
          {currentStep === 'verify' && foundMovies.length > 0 && (
            <Fade in timeout={500}>
              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h6" gutterBottom>
                    Ready to Create Playlist
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Found {foundMovies.length} out of {movieList.length} movies on your Plex server
                  </Typography>
                  <Button
                    variant="contained"
                    color="success"
                    onClick={createPlaylist}
                    disabled={loading}
                    size="large"
                    startIcon={<PlaylistAddIcon />}
                  >
                    Confirm - Create Playlist
                  </Button>
                </CardContent>
              </Card>
            </Fade>
          )}

          {/* Completion Status */}
          {currentStep === 'complete' && (
            <Zoom in timeout={500}>
              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <CheckCircleIcon sx={{ fontSize: 60, color: 'success.main', mb: 2 }} />
                  <Typography variant="h5" gutterBottom color="success.main">
                    Playlist Created Successfully!
                  </Typography>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    "{playlistTitle}"
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Playlist ID: {playlistId} • {foundMovies.length} movies added
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={resetWorkflow}
                    size="large"
                  >
                    Create Another Playlist
                  </Button>
                </CardContent>
              </Card>
            </Zoom>
          )}

          {/* Loading Progress */}
          {loading && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary" textAlign="center">
                  Processing... Please wait
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Right Column - Real-time Log */}
        <Card sx={{ width: { xs: '100%', lg: 500 }, height: 'fit-content' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Real-time Activity Log
            </Typography>
            <Box
              ref={logContainerRef}
              sx={{
                height: 500,
                overflowY: 'auto',
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 1,
                p: 1,
                backgroundColor: 'grey.50',
                fontFamily: 'monospace',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '3px',
                },
              }}
            >
              {logs.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Activity log will appear here...
                </Typography>
              ) : (
                logs.map((log) => (
                  <Box
                    key={log.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      mb: 0.5,
                      fontSize: '0.75rem',
                    }}
                  >
                    {getLogIcon(log.type)}
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          display: 'block',
                          fontSize: '0.7rem',
                        }}
                      >
                        {log.timestamp}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: '0.75rem',
                          lineHeight: 1.3,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {log.message}
                      </Typography>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}