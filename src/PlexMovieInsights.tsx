import { useState, useEffect, useMemo, useCallback } from 'react'
import { ArrowLeft } from 'lucide-react'
import { 
  Box, 
  Typography, 
  Chip, 
  Button, 
  TextField, 
  InputAdornment, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  Container,
  Paper,
  Card,
  CardContent,
  Stack
} from '@mui/material'
import { Movie as MovieIcon, Shuffle, Search, VideoLibrary } from '@mui/icons-material'
import './App.css'

interface PlexMedia {
  id: number
  duration: number
  bitrate: number
  width: number
  height: number
  aspectRatio: number
  audioChannels: number
  audioCodec: string
  videoCodec: string
  videoResolution: string
  container: string
  videoFrameRate: string
}

interface PlexImage {
  alt: string
  type: string
  url: string
}

interface PlexGenre {
  tag: string
}

interface PlexPerson {
  tag: string
}

interface PlexMovie {
  ratingKey: string
  key: string
  guid: string
  slug?: string
  studio?: string
  type: string
  title: string
  contentRating?: string
  summary: string
  rating?: number
  audienceRating?: number
  viewCount?: number
  lastViewedAt?: number
  year: number
  tagline?: string
  thumb: string
  art: string
  duration: number
  originallyAvailableAt: string
  addedAt: number
  updatedAt: number
  Media?: PlexMedia[]
  Image?: PlexImage[]
  Genre?: PlexGenre[]
  Country?: PlexPerson[]
  Director?: PlexPerson[]
  Writer?: PlexPerson[]
  Role?: PlexPerson[]
}

interface PlexResponse {
  MediaContainer: {
    size: number
    librarySectionTitle: string
    Metadata: PlexMovie[]
  }
}

interface PlexLibrary {
  key: string
  title: string
  type: string
  uuid: string
}

interface PlexSectionsResponse {
  MediaContainer: {
    Directory: PlexLibrary[]
  }
}

export default function PlexMovieInsights() {
  const [movies, setMovies] = useState<PlexMovie[]>([])
  const [libraries, setLibraries] = useState<PlexLibrary[]>([])
  const [selectedLibrary, setSelectedLibrary] = useState<string>('')
  const [selectedMovie, setSelectedMovie] = useState<PlexMovie | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingLibraries, setLoadingLibraries] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [showMobileDetails, setShowMobileDetails] = useState(false)

  const apiBaseUrl = useMemo(() => {
    const configuredBase = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '')
    if (configuredBase) {
      return configuredBase
    }
    const devBase = 'http://localhost:3001/api'
    const prodBase = `${window.location.origin}/api`
    return import.meta.env.DEV ? devBase : prodBase
  }, [])

  const fetchLibraries = useCallback(async () => {
    try {
      setLoadingLibraries(true)
      const response = await fetch(`${apiBaseUrl}/plex/sections`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: PlexSectionsResponse = await response.json()
      const libraryList = data.MediaContainer.Directory || []
      setLibraries(libraryList)
      
      // Auto-select the first library
      if (libraryList.length > 0) {
        setSelectedLibrary(libraryList[0].key)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch libraries')
      console.error('Error fetching libraries:', err)
    } finally {
      setLoadingLibraries(false)
    }
  }, [apiBaseUrl])

  const fetchMovies = useCallback(async (libraryKey: string) => {
    if (!libraryKey) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`${apiBaseUrl}/plex/sections/${libraryKey}/all`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: PlexResponse = await response.json()
      setMovies(data.MediaContainer.Metadata || [])
      
      if (data.MediaContainer.Metadata && data.MediaContainer.Metadata.length > 0) {
        setSelectedMovie(data.MediaContainer.Metadata[0])
      } else {
        setSelectedMovie(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch movies')
      console.error('Error fetching movies:', err)
    } finally {
      setLoading(false)
    }
  }, [apiBaseUrl])

  useEffect(() => {
    fetchLibraries()
  }, [fetchLibraries])

  useEffect(() => {
    if (selectedLibrary) {
      fetchMovies(selectedLibrary)
    }
  }, [selectedLibrary, fetchMovies])

  const pickRandomMovie = () => {
    if (filteredMovies.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredMovies.length)
      setSelectedMovie(filteredMovies[randomIndex])
      setShowMobileDetails(true)
    }
  }

  const formatDuration = (milliseconds: number) => {
    const hours = Math.floor(milliseconds / 3600000)
    const minutes = Math.floor((milliseconds % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  }

  const getImageUrl = (path?: string) => {
    if (!path) return ''
    const encodedPath = encodeURIComponent(path)
    return `${apiBaseUrl}/plex/image?path=${encodedPath}`
  }

  const filteredMovies = movies.filter(movie =>
    movie.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    movie.year?.toString().includes(searchTerm) ||
    movie.Genre?.some(g => g.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
    movie.studio?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 1, sm: 2 }, px: { xs: 1, sm: 3 } }}>
      
      {(loading || loadingLibraries) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6">{loadingLibraries ? 'Loading libraries...' : 'Loading content...'}</Typography>
        </Box>
      )}

      {error && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px', flexDirection: 'column', gap: 2 }}>
          <Typography variant="h6" color="error">Error Loading Content</Typography>
          <Typography>{error}</Typography>
          <Button onClick={() => selectedLibrary && fetchMovies(selectedLibrary)} variant="contained">
            Retry
          </Button>
        </Box>
      )}

      {!loading && !loadingLibraries && !error && (
        <Box sx={{ 
          display: 'flex', 
          gap: { xs: 1, sm: 3 }, 
          height: { xs: 'calc(100vh - 100px)', sm: 'calc(100vh - 200px)' },
          flexDirection: { xs: 'column', md: 'row' }
        }}>
          {/* Left Panel - Movie List */}
          <Box sx={{ 
            width: { xs: '100%', md: '400px' }, 
            flexShrink: 0, 
            display: { xs: showMobileDetails ? 'none' : 'block', md: 'block' },
            height: { xs: '100%', md: 'auto' }
          }}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Header with Count and Controls */}
              <Box sx={{ mb: { xs: 2, sm: 3 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between', 
                  mb: { xs: 1, sm: 2 },
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 0 }
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <VideoLibrary color="primary" />
                    <Typography 
                      variant="h6" 
                      fontWeight={600}
                      sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
                    >
                      Plex Movie Insights
                    </Typography>
                  </Box>
                  <Chip
                    icon={<MovieIcon />}
                    label={loading || loadingLibraries ? 'Loading...' : `${filteredMovies.length} items`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Box>
                
                {/* Library Selector and Random Button Row */}
                <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                  <FormControl sx={{ flex: 1 }}>
                    <InputLabel id="library-select-label">Select Library</InputLabel>
                    <Select
                      labelId="library-select-label"
                      value={selectedLibrary}
                      label="Select Library"
                      onChange={(e) => setSelectedLibrary(e.target.value as string)}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: 2,
                          backgroundColor: 'background.default',
                          '&:hover': {
                            backgroundColor: 'action.hover',
                          },
                          '&.Mui-focused': {
                            backgroundColor: 'background.paper',
                          },
                        },
                      }}
                    >
                      {libraries.map((library) => (
                        <MenuItem key={library.key} value={library.key}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
                            <VideoLibrary fontSize="small" />
                            <Typography sx={{ flex: 1 }}>{library.title}</Typography>
                            <Chip 
                              label={library.type} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  <Button
                    variant="contained"
                    startIcon={<Shuffle />}
                    onClick={pickRandomMovie}
                    sx={{
                      borderRadius: 2,
                      px: 3,
                      textTransform: 'none',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      background: 'linear-gradient(45deg, #9C27B0 30%, #E91E63 90%)',
                      boxShadow: '0 3px 5px 2px rgba(156, 39, 176, .3)',
                      minWidth: 'auto',
                      whiteSpace: 'nowrap',
                      '&:hover': {
                        background: 'linear-gradient(45deg, #7B1FA2 30%, #C2185B 90%)',
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 10px 2px rgba(156, 39, 176, .3)',
                      },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Random
                  </Button>
                </Box>

                {/* Search Field */}
                <TextField
                  fullWidth
                  placeholder="Search library..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search color="action" />
                      </InputAdornment>
                    ),
                  }}
                  variant="outlined"
                  size="medium"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                      backgroundColor: 'background.default',
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                      '&.Mui-focused': {
                        backgroundColor: 'background.paper',
                      },
                    },
                  }}
                />
              </Box>

              {/* Movies List */}
              <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <Stack spacing={1}>
                  {filteredMovies.map((movie) => (
                    <Card
                      key={movie.ratingKey}
                      sx={{
                        cursor: 'pointer',
                        border: selectedMovie?.ratingKey === movie.ratingKey ? 2 : 1,
                        borderColor: selectedMovie?.ratingKey === movie.ratingKey ? 'primary.main' : 'divider',
                        '&:hover': { borderColor: 'primary.main' }
                      }}
                      onClick={() => {
                        setSelectedMovie(movie)
                        setShowMobileDetails(true)
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
                          {movie.title}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 1 }}>
                          <Typography variant="body2" color="text.secondary" noWrap>
                            {movie.year}
                          </Typography>
                          {movie.rating && (
                            <Typography variant="body2" color="text.secondary">
                              ⭐ {movie.rating.toFixed(1)}
                            </Typography>
                          )}
                        </Stack>
                        {movie.Genre && movie.Genre.length > 0 && (
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ mt: 0.5, display: 'block' }}>
                            {movie.Genre.slice(0, 2).map(g => g.tag).join(', ')}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Box>
            </Paper>
          </Box>

          {/* Right Side - Movie Details */}
          <Box sx={{ 
            flexGrow: 1, 
            display: { xs: showMobileDetails ? 'block' : 'none', md: 'block' },
            height: { xs: '100%', md: 'auto' }
          }}>
            <Paper sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
              {selectedMovie ? (
                <Box sx={{ overflow: 'auto', flex: 1 }}>
                  {/* Back to List Button (Mobile Only) */}
                  <Button
                    onClick={() => {
                      setSelectedMovie(null)
                      setShowMobileDetails(false)
                    }}
                    startIcon={<ArrowLeft />}
                    sx={{
                      display: { xs: 'flex', md: 'none' },
                      mb: 2,
                      width: '100%',
                      justifyContent: 'center'
                    }}
                  >
                    Back to List
                  </Button>

                  {/* Movie Poster */}
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <img
                      src={getImageUrl(selectedMovie.art)}
                      alt={selectedMovie.title}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '300px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = getImageUrl(selectedMovie.thumb)
                      }}
                    />
                  </Box>

                  <Typography variant="h4" component="h2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {selectedMovie.title}
                  </Typography>
                  
                  {selectedMovie.tagline && (
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3, fontStyle: 'italic' }}>
                      {selectedMovie.tagline}
                    </Typography>
                  )}

                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">Year</Typography>
                      <Typography variant="body1">{selectedMovie.year}</Typography>
                    </Box>

                    {selectedMovie.contentRating && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Rating</Typography>
                        <Typography variant="body1">{selectedMovie.contentRating}</Typography>
                      </Box>
                    )}

                    <Box>
                      <Typography variant="body2" color="text.secondary">Duration</Typography>
                      <Typography variant="body1">{formatDuration(selectedMovie.duration)}</Typography>
                    </Box>

                    {selectedMovie.rating && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Score</Typography>
                        <Typography variant="body1">⭐ {selectedMovie.rating.toFixed(1)}</Typography>
                      </Box>
                    )}

                    {selectedMovie.audienceRating && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Audience</Typography>
                        <Typography variant="body1">🍅 {selectedMovie.audienceRating.toFixed(1)}</Typography>
                      </Box>
                    )}

                    {selectedMovie.viewCount && selectedMovie.viewCount > 0 && (
                      <Box>
                        <Typography variant="body2" color="text.secondary">Views</Typography>
                        <Typography variant="body1">{selectedMovie.viewCount}</Typography>
                      </Box>
                    )}
                  </Box>

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ mb: 1 }}>Summary</Typography>
                    <Typography variant="body2">{selectedMovie.summary}</Typography>
                  </Box>

                  {selectedMovie.Genre && selectedMovie.Genre.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>Genres</Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap">
                        {selectedMovie.Genre.map((genre, index) => (
                          <Chip key={index} label={genre.tag} size="small" />
                        ))}
                      </Stack>
                    </Box>
                  )}

                  {selectedMovie.Director && selectedMovie.Director.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>Director</Typography>
                      <Typography variant="body2">{selectedMovie.Director.map(d => d.tag).join(', ')}</Typography>
                    </Box>
                  )}

                  {selectedMovie.Writer && selectedMovie.Writer.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>Writers</Typography>
                      <Typography variant="body2">{selectedMovie.Writer.map(w => w.tag).join(', ')}</Typography>
                    </Box>
                  )}

                  {selectedMovie.Role && selectedMovie.Role.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>Cast</Typography>
                      <Typography variant="body2">{selectedMovie.Role.slice(0, 10).map(r => r.tag).join(', ')}</Typography>
                    </Box>
                  )}

                  {selectedMovie.studio && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h6" sx={{ mb: 1 }}>Studio</Typography>
                      <Typography variant="body2">{selectedMovie.studio}</Typography>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center' }}>
                  <VideoLibrary sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">Select an item or pick a random one!</Typography>
                </Box>
              )}
            </Paper>
          </Box>
        </Box>
      )}
    </Container>
  )
}
